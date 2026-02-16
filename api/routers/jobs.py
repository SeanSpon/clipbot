"""Jobs router - query and manage background jobs."""

import logging

from fastapi import APIRouter, HTTPException

from services.job_manager import job_manager, JobInfo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get the status of a background job."""
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.model_dump()


@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running background job."""
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    cancelled = await job_manager.cancel(job_id)
    if not cancelled:
        raise HTTPException(status_code=400, detail="Job is not running or already finished")

    return {"job_id": job_id, "status": "cancelled"}


@router.get("")
async def list_jobs(project_id: str = None):
    """List jobs, optionally filtered by project_id."""
    if project_id:
        jobs = job_manager.get_project_jobs(project_id)
    else:
        jobs = list(job_manager._jobs.values())
    return [j.model_dump() for j in jobs]
