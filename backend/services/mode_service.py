"""Mode service for executing automation sequences."""

import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
from database.models.mode import Mode, ModeDevice
from database.models.device import Device
from database.repository import IModeRepository, IDeviceRepository
from services.device_service import DeviceService
from services.mqtt_service import MqttService


class ModeService:
    """
    Service for executing automation modes.
    """
    
    def __init__(
        self,
        mode_repo: IModeRepository,
        device_repo: IDeviceRepository,
        device_service: DeviceService
    ):
        self._mode_repo = mode_repo
        self._device_repo = device_repo
        self._device_service = device_service
        self._active_executions: Dict[int, asyncio.Task] = {}
    
    async def execute_mode(
        self,
        user_id: int,
        mode_id: int,
        parallel: bool = False
    ) -> Dict[str, Any]:
        """
        Execute all actions in a mode immediately (for manual Run Now triggers).
        """
        mode = await self._mode_repo.get_by_id(mode_id)
        if not mode:
            raise ValueError(f"Mode {mode_id} not found")
        
        if mode.user_id != user_id:
            raise ValueError(f"Mode {mode_id} not owned by user {user_id}")
        
        if mode_id in self._active_executions:
            task = self._active_executions[mode_id]
            if not task.done():
                raise ValueError(f"Mode {mode_id} is already executing")
        
        if parallel:
            execution_task = asyncio.create_task(
                self._execute_parallel(mode, user_id)
            )
        else:
            execution_task = asyncio.create_task(
                self._execute_sequential(mode, user_id)
            )
        
        self._active_executions[mode_id] = execution_task
        results = await execution_task
        
        if mode_id in self._active_executions:
            del self._active_executions[mode_id]
        
        return results
    
    async def _execute_sequential(
        self,
        mode: Mode,
        user_id: int
    ) -> Dict[str, Any]:
        results = {
            "mode_id": mode.id,
            "mode_name": mode.name,
            "executed_at": datetime.now().isoformat(),
            "total_actions": len(mode.devices),
            "successful_actions": 0,
            "failed_actions": 0,
            "action_results": []
        }
        
        for device_item in mode.devices:
            device_id = device_item.id
            state = device_item.state
            
            try:
                device = await self._device_repo.get_by_id(device_id)
                if not device:
                    raise ValueError(f"Device {device_id} not found")
                
                success = await self._device_service.control_device(
                    user_id=user_id,
                    device_id=device_id,
                    state=state
                )
                
                if success:
                    results["successful_actions"] += 1
                else:
                    results["failed_actions"] += 1
                
                results["action_results"].append({
                    "device_id": device_id,
                    "state": state,
                    "success": success,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                results["failed_actions"] += 1
                results["action_results"].append({
                    "device_id": device_id,
                    "state": state,
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
        results = {
            "mode_id": mode.id,
            "mode_name": mode.name,
            "executed_at": datetime.now().isoformat(),
            "total_actions": len(mode.devices),
            "successful_actions": 0,
            "failed_actions": 0,
            "action_results": []
        }
        
        tasks = []
        for device_item in mode.devices:
            tasks.append(
                self._execute_action_task(
                    user_id=user_id,
                    device_item=device_item,
                    results=results
                )
            )
        
        if tasks:
            await asyncio.gather(*tasks)
        
        return results
    
    async def _execute_action_task(
        self,
        user_id: int,
        device_item: ModeDevice,
        results: Dict
    ) -> None:
        device_id = device_item.id
        state = device_item.state
        
        try:
            device = await self._device_repo.get_by_id(device_id)
            if not device:
                raise ValueError(f"Device {device_id} not found")
            
            success = await self._device_service.control_device(
                user_id=user_id,
                device_id=device_id,
                state=state
            )
            
            if success:
                results["successful_actions"] += 1
            else:
                results["failed_actions"] += 1
            
            results["action_results"].append({
                "device_id": device_id,
                "state": state,
                "success": success,
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            results["failed_actions"] += 1
            results["action_results"].append({
                "device_id": device_id,
                "state": state,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    
    async def is_mode_executing(self, mode_id: int) -> bool:
        if mode_id not in self._active_executions:
            return False
        task = self._active_executions[mode_id]
        return not task.done()
    
    async def stop_mode_execution(self, mode_id: int) -> bool:
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
