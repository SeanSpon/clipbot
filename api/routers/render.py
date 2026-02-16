"""Render router - triggers Opus Clip-style video rendering."""

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

import config
import database
from models.project import ProjectStatus
from services.events import broadcaster
from services.job_manager import job_manager
from services.renderer import renderer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}", tags=["render"])


@router.post("/render")
async def start_render(project_id: str):
    """Render vertical 9:16 clips from the project's shot list.

    Produces multiple Opus Clip-style clips with karaoke captions.
    Returns a job ID for tracking progress.
    """
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    shot_list = project.get("shot_list")
    if not shot_list:
        raise HTTPException(
            status_code=400,
            detail="Project has no shot list. Run the director first."
        )

    video_path = project.get("raw_video_path")
    if not video_path:
        raise HTTPException(status_code=400, detail="Project has no video file.")

    transcript = project.get("transcript", {})

    await database.update_project(project_id, status=ProjectStatus.RENDERING.value)

    async def _run_render():
        async def progress_cb(stage, progress, message):
            await broadcaster.publish(
                project_id=project_id,
                event_type="render.progress",
                stage=stage,
                progress=progress,
                message=message,
            )
            job_manager.update_progress(job_id, progress, message)

        try:
            results = await renderer.render_clips(
                project_id=project_id,
                video_path=video_path,
                shot_list=shot_list,
                transcript=transcript,
                progress_callback=progress_cb,
            )

            await database.update_project(
                project_id, status=ProjectStatus.COMPLETE.value,
            )

            await broadcaster.publish(
                project_id=project_id,
                event_type="render.complete",
                data={"clips": results},
                progress=100,
                message=f"Rendered {len(results)} clips!",
            )

            return results

        except Exception as e:
            await database.update_project(
                project_id, status=ProjectStatus.ERROR.value
            )
            await broadcaster.publish(
                project_id=project_id,
                event_type="render.error",
                message=str(e),
            )
            raise

    job_id = job_manager.submit(
        project_id=project_id,
        job_type="render",
        coro_factory=_run_render,
    )

    return {"job_id": job_id, "project_id": project_id, "status": "started"}


@router.get("/exports")
async def list_exports(project_id: str):
    """List all rendered clips for a project."""
    export_dir = Path(config.EXPORTS_DIR) / project_id
    if not export_dir.exists():
        return []

    clips = []
    for f in sorted(export_dir.glob("*.mp4")):
        if f.name.startswith("scene_"):
            continue
        clips.append({
            "filename": f.name,
            "size": f.stat().st_size,
            "url": f"/exports/{project_id}/{f.name}",
        })
    return clips


@router.get("/download/{filename}")
async def download_clip(project_id: str, filename: str):
    """Download a specific rendered clip."""
    export_dir = Path(config.EXPORTS_DIR) / project_id
    file_path = export_dir / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        str(file_path),
        media_type="video/mp4",
        filename=filename,
    )
