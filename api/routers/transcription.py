"""Transcription router - triggers WhisperX transcription with SSE progress."""

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from sse_starlette.sse import EventSourceResponse

import database
from ai.transcription import transcribe
from models.project import ProjectStatus
from services.events import broadcaster
from services.job_manager import job_manager
from services.storage import storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}", tags=["transcription"])


@router.post("/upload")
async def upload_video(
    project_id: str,
    file: UploadFile = File(...),
):
    """Upload a video/audio file for a project."""
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    file_path = await storage.save_upload_stream(
        file_stream=file,
        original_filename=file.filename or "upload",
        project_id=project_id,
    )

    await database.update_project(project_id, raw_video_path=file_path)

    return {"path": file_path, "filename": file.filename, "project_id": project_id}


@router.post("/transcribe")
async def start_transcription(
    project_id: str,
    language: Optional[str] = Form(None),
    num_speakers: Optional[int] = Form(None),
):
    """Start transcription as a background job. Returns job ID.

    Subscribe to /projects/{project_id}/events for real-time progress.
    """
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    video_path = project.get("raw_video_path")
    if not video_path:
        raise HTTPException(
            status_code=400,
            detail="No video file uploaded. Upload a file first via POST /projects/{id}/upload"
        )

    # Update project status
    await database.update_project(project_id, status=ProjectStatus.TRANSCRIBING.value)

    async def _run_transcription():
        async def progress_cb(stage, progress, message):
            await broadcaster.publish(
                project_id=project_id,
                event_type="transcription.progress",
                stage=stage,
                progress=progress,
                message=message,
            )
            job_manager.update_progress(job_id, progress, message)

        try:
            result = await transcribe(
                file_path=video_path,
                language=language,
                num_speakers=num_speakers,
                progress_callback=progress_cb,
            )

            # Save transcript to project
            await database.update_project(
                project_id,
                transcript=result,
                status=ProjectStatus.DRAFT.value,
            )

            await broadcaster.publish(
                project_id=project_id,
                event_type="transcription.complete",
                data={"segment_count": len(result.get("segments", []))},
                progress=100,
                message="Transcription complete",
            )

            return result

        except Exception as e:
            await database.update_project(
                project_id, status=ProjectStatus.ERROR.value
            )
            await broadcaster.publish(
                project_id=project_id,
                event_type="transcription.error",
                message=str(e),
            )
            raise

    job_id = job_manager.submit(
        project_id=project_id,
        job_type="transcription",
        coro_factory=_run_transcription,
    )

    return {"job_id": job_id, "project_id": project_id, "status": "started"}


@router.get("/events")
async def project_events(project_id: str):
    """SSE endpoint for real-time project events."""
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    async def event_stream():
        async for event in broadcaster.subscribe(project_id):
            yield {
                "event": event.get("type", "message"),
                "data": json.dumps(event),
            }

    return EventSourceResponse(event_stream())
