"""Mode service for executing automation sequences."""

import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
from models.mode import Mode
from models.device import Device
from backend.database.sql.repositories.repository import IModeRepository, IDeviceRepository
from services.device_service import DeviceService
from services.mqtt_service import MqttService


class ModeService:
    """
    Service for executing automation modes.
    
    A mode contains multiple device actions that are executed together.
    Modes can be:
    - Activated immediately (execute all actions)
    - Scheduled for specific times
    - Triggered by device state changes
    """
    
    def __init__(
        self,
        mode_repo: IModeRepository,
        device_repo: IDeviceRepository,
        device_service: DeviceService
    ):
        """
        Initialize mode service.
        
        Args:
            mode_repo: Mode repository for persistence
            device_repo: Device repository for device access
            device_service: Device service for executing actions
        """
        self._mode_repo = mode_repo
        self._device_repo = device_repo
        self._device_service = device_service
        
        # Track active execution tasks
        self._active_executions: Dict[int, asyncio.Task] = {}
    
    async def execute_mode(
        self,
        user_id: int,
        mode_id: int,
        parallel: bool = False
    ) -> Dict[str, Any]:
        """
        Execute all actions in a mode.
        
        Args:
            user_id: User executing the mode
            mode_id: Mode to execute
            parallel: Execute actions in parallel (True) or sequentially (False)
            
        Returns:
            Dict with execution results for each action
            
        Raises:
            ValueError: If mode not found or not owned by user
        """
        # Get mode
        mode = await self._mode_repo.get_by_id(mode_id)
        if not mode:
            raise ValueError(f"Mode {mode_id} not found")
        
        # Verify ownership
        if mode.user_id != user_id:
            raise ValueError(f"Mode {mode_id} not owned by user {user_id}")
        
        # Check if already running
        if mode_id in self._active_executions:
            task = self._active_executions[mode_id]
            if not task.done():
                raise ValueError(f"Mode {mode_id} is already executing")
        
        # Execute actions
        if parallel:
            execution_task = asyncio.create_task(
                self._execute_parallel(mode, user_id)
            )
        else:
            execution_task = asyncio.create_task(
                self._execute_sequential(mode, user_id)
            )
        
        # Store task
        self._active_executions[mode_id] = execution_task
        
        # Wait for execution
        results = await execution_task
        
        # Clean up
        if mode_id in self._active_executions:
            del self._active_executions[mode_id]
        
        return results
    
    async def _execute_sequential(
        self,
        mode: Mode,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Execute mode actions sequentially.
        
        Args:
            mode: Mode with actions to execute
            user_id: User executing the mode
            
        Returns:
            Dict with results for each action
        """
        results = {
            "mode_id": mode.id,
            "mode_name": mode.name,
            "executed_at": datetime.now().isoformat(),
            "total_actions": len(mode.actions),
            "successful_actions": 0,
            "failed_actions": 0,
            "action_results": []
        }
        
        for action_item in mode.actions:
            device_id = action_item.get("device_id")
            action = action_item.get("action")
            value = action_item.get("value")
            delay = action_item.get("delay", 0)
            
            # Wait before next action
            if delay > 0:
                await asyncio.sleep(delay)
            
            # Execute action
            try:
                device = await self._device_repo.get_by_id(device_id)
                if not device:
                    raise ValueError(f"Device {device_id} not found")
                
                success = await self._device_service.control_device(
                    user_id=user_id,
                    device_id=device_id,
                    action=action,
                    value=value
                )
                
                if success:
                    results["successful_actions"] += 1
                else:
                    results["failed_actions"] += 1
                
                results["action_results"].append({
                    "device_id": device_id,
                    "action": action,
                    "value": value,
                    "success": success,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                results["failed_actions"] += 1
                results["action_results"].append({
                    "device_id": device_id,
                    "action": action,
                    "value": value,
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        return results
    
    async def _execute_parallel(
        self,
        mode: Mode,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Execute mode actions in parallel.
        
        All independent actions are executed simultaneously.
        
        Args:
            mode: Mode with actions to execute
            user_id: User executing the mode
            
        Returns:
            Dict with results for each action
        """
        results = {
            "mode_id": mode.id,
            "mode_name": mode.name,
            "executed_at": datetime.now().isoformat(),
            "total_actions": len(mode.actions),
            "successful_actions": 0,
            "failed_actions": 0,
            "action_results": []
        }
        
        # Create tasks for all actions
        tasks = []
        for action_item in mode.actions:
            tasks.append(
                self._execute_action_task(
                    user_id=user_id,
                    action_item=action_item,
                    results=results
                )
            )
        
        # Execute all in parallel
        if tasks:
            await asyncio.gather(*tasks)
        
        return results
    
    async def _execute_action_task(
        self,
        user_id: int,
        action_item: Dict,
        results: Dict
    ) -> None:
        """
        Execute a single action as a task.
        
        Args:
            user_id: User executing the action
            action_item: Action dict with device_id, action, value, delay
            results: Shared results dict to update
        """
        device_id = action_item.get("device_id")
        action = action_item.get("action")
        value = action_item.get("value")
        delay = action_item.get("delay", 0)
        
        try:
            # Wait before executing
            if delay > 0:
                await asyncio.sleep(delay)
            
            # Execute action
            device = await self._device_repo.get_by_id(device_id)
            if not device:
                raise ValueError(f"Device {device_id} not found")
            
            success = await self._device_service.control_device(
                user_id=user_id,
                device_id=device_id,
                action=action,
                value=value
            )
            
            if success:
                results["successful_actions"] += 1
            else:
                results["failed_actions"] += 1
            
            results["action_results"].append({
                "device_id": device_id,
                "action": action,
                "value": value,
                "success": success,
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            results["failed_actions"] += 1
            results["action_results"].append({
                "device_id": device_id,
                "action": action,
                "value": value,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    
    async def is_mode_executing(self, mode_id: int) -> bool:
        """
        Check if a mode is currently executing.
        
        Args:
            mode_id: Mode ID to check
            
        Returns:
            True if executing, False otherwise
        """
        if mode_id not in self._active_executions:
            return False
        
        task = self._active_executions[mode_id]
        return not task.done()
    
    async def stop_mode_execution(self, mode_id: int) -> bool:
        """
        Stop a running mode execution.
        
        Args:
            mode_id: Mode to stop
            
        Returns:
            True if stopped, False if not executing
        """
        if mode_id not in self._active_executions:
            return False
        
        task = self._active_executions[mode_id]
        if task.done():
            del self._active_executions[mode_id]
            return False
        
        task.cancel()
        
        try:
            await task
        except asyncio.CancelledError:
            pass
        
        del self._active_executions[mode_id]
        return True
    
    async def create_mode(
        self,
        user_id: int,
        name: str,
        description: str,
        actions: List[Dict[str, Any]],
        is_active: bool = True
    ) -> Mode:
        """
        Create a new automation mode.
        
        Args:
            user_id: User creating mode
            name: Mode name
            description: Mode description
            actions: List of action dicts [{'device_id': int, 'action': str, 'value': Any, 'delay': float}]
            is_active: Whether mode is active
            
        Returns:
            Created Mode instance
        """
        mode = Mode(
            name=name,
            description=description,
            user_id=user_id,
            actions=actions,
            is_active=is_active
        )
        
        return await self._mode_repo.create(mode)
    
    async def update_mode(
        self,
        user_id: int,
        mode_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        actions: Optional[List[Dict]] = None,
        is_active: Optional[bool] = None
    ) -> Mode:
        """
        Update an existing mode.
        
        Args:
            user_id: User updating mode
            mode_id: Mode to update
            name: New name (optional)
            description: New description (optional)
            actions: New actions (optional)
            is_active: New active status (optional)
            
        Returns:
            Updated Mode instance
            
        Raises:
            ValueError: If mode not found or not owned by user
        """
        mode = await self._mode_repo.get_by_id(mode_id)
        if not mode:
            raise ValueError(f"Mode {mode_id} not found")
        
        if mode.user_id != user_id:
            raise ValueError(f"Mode {mode_id} not owned by user {user_id}")
        
        # Update fields
        if name:
            mode.name = name
        if description:
            mode.description = description
        if actions is not None:
            mode.actions = actions
        if is_active is not None:
            mode.is_active = is_active
        
        return await self._mode_repo.update(mode)
