"""Project CRUD router."""

import logging

from fastapi import APIRouter, HTTPException

import database
from models.project import Project, ProjectCreate, ProjectUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[Project])
async def list_projects():
    """List all projects."""
    rows = await database.list_projects()
    return rows


@router.post("", response_model=Project, status_code=201)
async def create_project(body: ProjectCreate):
    """Create a new project."""
    project = await database.create_project(
        name=body.name,
        description=body.description,
        raw_video_path=body.raw_video_path,
        settings=body.settings,
    )
    return project


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a project by ID."""
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=Project)
async def update_project(project_id: str, body: ProjectUpdate):
    """Update a project."""
    existing = await database.get_project(project_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return existing

    # Convert enum to string value for storage
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = update_data["status"].value

    project = await database.update_project(project_id, **update_data)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str):
    """Delete a project and its clips."""
    deleted = await database.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    await database.delete_project_clips(project_id)


@router.get("/{project_id}/clips")
async def list_project_clips(project_id: str):
    """List all clips for a project."""
    project = await database.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    clips = await database.get_project_clips(project_id)
    return clips
