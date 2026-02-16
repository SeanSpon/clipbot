"""Background job manager using asyncio.

Tracks job status, supports cancellation, and provides progress reporting.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Coroutine, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobInfo(BaseModel):
    id: str
    project_id: str
    job_type: str
    status: JobStatus
    progress: float = 0.0
    message: str = ""
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobManager:
    """Manages background jobs with status tracking and cancellation."""

    def __init__(self):
        self._jobs: dict[str, JobInfo] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    def submit(
        self,
        project_id: str,
        job_type: str,
        coro_factory: Callable[..., Coroutine],
        *args,
        **kwargs,
    ) -> str:
        """Submit a background job.

        Args:
            project_id: The project this job belongs to.
            job_type: Type of job (e.g., 'transcription', 'direction').
            coro_factory: Async function to run.
            *args, **kwargs: Arguments passed to the coroutine.

        Returns:
            The job ID.
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job_info = JobInfo(
            id=job_id,
            project_id=project_id,
            job_type=job_type,
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
        )
        self._jobs[job_id] = job_info

        async def _wrapper():
            job_info.status = JobStatus.RUNNING
            job_info.updated_at = datetime.now(timezone.utc)
            try:
                result = await coro_factory(*args, **kwargs)
                job_info.status = JobStatus.COMPLETED
                job_info.progress = 100.0
                job_info.message = "Complete"
                job_info.result = result
            except asyncio.CancelledError:
                job_info.status = JobStatus.CANCELLED
                job_info.message = "Cancelled"
                logger.info("Job %s cancelled", job_id)
            except Exception as e:
                job_info.status = JobStatus.FAILED
                job_info.error = str(e)
                job_info.message = f"Failed: {e}"
                logger.exception("Job %s failed", job_id)
            finally:
                job_info.updated_at = datetime.now(timezone.utc)

        task = asyncio.create_task(_wrapper())
        self._tasks[job_id] = task

        return job_id

    def get_job(self, job_id: str) -> Optional[JobInfo]:
        """Get info about a job."""
        return self._jobs.get(job_id)

    def get_project_jobs(self, project_id: str) -> list[JobInfo]:
        """Get all jobs for a project."""
        return [j for j in self._jobs.values() if j.project_id == project_id]

    def update_progress(
        self, job_id: str, progress: float, message: str = ""
    ) -> None:
        """Update job progress (called from within the job)."""
        job = self._jobs.get(job_id)
        if job and job.status == JobStatus.RUNNING:
            job.progress = progress
            job.message = message
            job.updated_at = datetime.now(timezone.utc)

    async def cancel(self, job_id: str) -> bool:
        """Cancel a running job.

        Returns True if the job was cancelled, False otherwise.
        """
        task = self._tasks.get(job_id)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            return True
        return False

    def cleanup_completed(self, max_age_seconds: int = 3600) -> int:
        """Remove completed/failed/cancelled jobs older than max_age.

        Returns the number of jobs removed.
        """
        now = datetime.now(timezone.utc)
        to_remove = []
        for job_id, job in self._jobs.items():
            if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
                age = (now - job.updated_at).total_seconds()
                if age > max_age_seconds:
                    to_remove.append(job_id)

        for job_id in to_remove:
            del self._jobs[job_id]
            self._tasks.pop(job_id, None)

        return len(to_remove)


# Global singleton
job_manager = JobManager()
