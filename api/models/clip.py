"""Pydantic models for Clip data."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ClipStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RENDERED = "rendered"
    EXPORTED = "exported"
    ERROR = "error"


class ClipCreate(BaseModel):
    project_id: str
    scene_index: int = Field(..., ge=0)
    start_time: float = Field(..., ge=0.0, description="Start time in seconds")
    end_time: float = Field(..., gt=0.0, description="End time in seconds")
    transcript_segment: Optional[str] = None
    shot_list: Optional[dict] = None
    virality_score: Optional[int] = Field(None, ge=0, le=100)
    tags: Optional[list[str]] = None


class Clip(BaseModel):
    id: str
    project_id: str
    scene_index: int
    start_time: float
    end_time: float
    duration: float = 0.0
    transcript_segment: Optional[str] = None
    shot_list: Optional[dict] = None
    virality_score: Optional[int] = Field(None, ge=0, le=100)
    status: ClipStatus = ClipStatus.PENDING
    output_path: Optional[str] = None
    tags: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
