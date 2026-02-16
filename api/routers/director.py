"""Director router - triggers AI Director as background job with SSE progress."""

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import database
from ai.providers import get_provider
from director.master import MasterDirector
from models.project import ProjectStatus
from services.events import broadcaster
from services.job_manager import job_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}", tags=["director"])


class DirectRequest(BaseModel):
    """Request body for the /direct endpoint."""
    provider: str = Field("anthropic", description="AI provider name")
    model: Optional[str] = Field(None, description="Model override")
    cameras: Optional[list[str]] = Field(None, description="Available camera angles")
    preferences: Optional[dict] = Field(None, description="User editing preferences")


@router.post("/direct")
async def start_direction(project_id: str, body: DirectRequest = None):
    """Start AI direction as a background job. Returns job ID.

    The AI Director analyzes the project's transcript and produces a
    scene-by-scene shot list. Subscribe to /projects/{project_id}/events
    for real-time progress.
    """
    if body is None:
        body = DirectRequest()

    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    transcript = project.get("transcript")
    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="Project has no transcript. Run transcription first."
        )

    # Update project status
    await database.update_project(project_id, status=ProjectStatus.DIRECTING.value)

    async def _run_direction():
        async def progress_cb(stage, progress, message):
            await broadcaster.publish(
                project_id=project_id,
                event_type="director.progress",
                stage=stage,
                progress=progress,
                message=message,
            )
            job_manager.update_progress(job_id, progress, message)

        try:
            # Initialize the AI provider
            provider_kwargs = {}
            if body.model:
                provider_kwargs["model"] = body.model
            provider = get_provider(body.provider, **provider_kwargs)

            # Run the Master Director
            director = MasterDirector(provider)
            shot_list, clips = await director.direct(
                transcript=transcript,
                project_id=project_id,
                cameras=body.cameras,
                preferences=body.preferences,
                progress_callback=progress_cb,
            )

            # Save shot list to project
            await database.update_project(
                project_id,
                shot_list=shot_list.model_dump(),
                status=ProjectStatus.DRAFT.value,
            )

            # Delete existing clips and save new ones
            await database.delete_project_clips(project_id)
            for clip in clips:
                await database.create_clip(
                    project_id=clip.project_id,
                    scene_index=clip.scene_index,
                    start_time=clip.start_time,
                    end_time=clip.end_time,
                    transcript_segment=clip.transcript_segment,
                    shot_list=clip.shot_list,
                    virality_score=clip.virality_score,
                    tags=clip.tags,
                )

            await broadcaster.publish(
                project_id=project_id,
                event_type="director.complete",
                data={
                    "scene_count": len(shot_list.scenes),
                    "clip_count": len(clips),
                    "total_virality": shot_list.total_virality_score,
                },
                progress=100,
                message=f"Direction complete: {len(clips)} clips",
            )

            return shot_list.model_dump()

        except Exception as e:
            await database.update_project(
                project_id, status=ProjectStatus.ERROR.value
            )
            await broadcaster.publish(
                project_id=project_id,
                event_type="director.error",
                message=str(e),
            )
            raise

    job_id = job_manager.submit(
        project_id=project_id,
        job_type="direction",
        coro_factory=_run_direction,
    )

    return {"job_id": job_id, "project_id": project_id, "status": "started"}


@router.get("/shot-list")
async def get_shot_list(project_id: str):
    """Get the shot list for a project."""
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    shot_list = project.get("shot_list")
    if not shot_list:
        raise HTTPException(
            status_code=404,
            detail="No shot list available. Run the director first."
        )
    return shot_list
