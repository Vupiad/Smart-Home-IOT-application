"""Background scheduler service for executing modes based on time."""

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from database.sql.database_factory import db_instance
from api.deps import _get_db_type
from database.json.json_mode_repository import JsonModeRepository
from database.json.json_device_repository import JsonDeviceRepository
from database.sql.repositories.postgres_mode_repository import PostgresModeRepository
from database.sql.repositories.postgres_device_repository import PostgresDeviceRepository
from services.mode_service import ModeService
from services.device_service import DeviceService
from services.mqtt_service import MqttService


class SchedulerService:
    """
    Manages the background execution of modes based on their schedules.
    """
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        
    async def _get_services(self):
        """Helper to get repositories and services dynamically."""
        conn_generator = db_instance.get_connection()
        try:
            conn = await conn_generator.__anext__()
        except StopAsyncIteration:
            raise Exception("Could not get DB connection")
            
        db_type = _get_db_type()
        if db_type == "json":
            mode_repo = JsonModeRepository(conn)
            device_repo = JsonDeviceRepository(conn)
        else:
            mode_repo = PostgresModeRepository(conn)
            device_repo = PostgresDeviceRepository(conn)
            
        mqtt_service = MqttService.get_instance()
        device_service = DeviceService(device_repo, mqtt_service)
        mode_service = ModeService(mode_repo, device_repo, device_service)
        
        return mode_service, conn_generator, conn

    async def check_and_execute_modes(self):
        """
        Cron job executed every minute to check if any active mode should be triggered.
        """
        current_time_str = datetime.now().strftime("%H:%M")
        
        try:
            mode_service, conn_gen, conn = await self._get_services()
            try:
                # Retrieve all modes
                all_modes = await mode_service._mode_repo.list_all()
                
                for mode in all_modes:
                    if mode.isActive and (current_time_str >= mode.startTime and current_time_str <= mode.endTime):
                        print(f" [SCHEDULER] Triggering Mode {mode.id}: {mode.name} at {current_time_str}")
                        # Execute in background task to prevent blocking the scheduler
                        asyncio.create_task(
                            mode_service.execute_mode(mode.user_id, mode.id, parallel=True)
                        )
            finally:
                try:
                    await conn_gen.aclose()
                except AttributeError:
                    pass
        except Exception as e:
            print(f" [SCHEDULER] Error checking modes: {e}")

    def start(self):
        """Starts the background scheduler."""
        # Check every minute (at the 0th second)
        self.scheduler.add_job(self.check_and_execute_modes, 'cron', minute='*')
        self.scheduler.start()
        print(" [SCHEDULER] Background Scheduler started")
        
    def stop(self):
        """Stops the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            print(" [SCHEDULER] Background Scheduler stopped")

# Global singleton instance
scheduler_service = SchedulerService()
