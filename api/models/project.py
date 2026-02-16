"""Pydantic models for Project CRUD."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    TRANSCRIBING = "transcribing"
    DIRECTING = "directing"
    EDITING = "editing"
    RENDERING = "rendering"
    COMPLETE = "complete"
    ERROR = "error"


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    raw_video_path: Optional[str] = None
    settings: Optional[dict] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    raw_video_path: Optional[str] = None
    transcript: Optional[dict] = None
    shot_list: Optional[dict] = None
    settings: Optional[dict] = None


class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.DRAFT
    raw_video_path: Optional[str] = None
    transcript: Optional[dict] = None
    shot_list: Optional[dict] = None
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
