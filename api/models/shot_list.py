"""Pydantic models for the AI Director's shot list output schema.

These models define the structured JSON that the Master AI Director produces
when analyzing a transcript. Each scene contains camera directions, typography
placement, transitions, B-roll cues, and caption configuration.

Note: We use `str` instead of strict enums for most fields to avoid validation
failures when the AI returns slightly different values than expected. The
renderer only uses a subset of these fields (timestamps, text, scores).
"""

from typing import Optional

from pydantic import BaseModel, Field


# --- Component Models ---

class Camera(BaseModel):
    """Camera direction for a scene."""
    framing: str = "medium"
    movement: str = "static"
    movement_speed: float = Field(1.0, ge=0.1, le=10.0)
    focus_point: Optional[str] = None
    angle: Optional[str] = None
    notes: Optional[str] = None


class Typography(BaseModel):
    """On-screen text overlay for a scene."""
    text: str = ""
    position: str = "bottom_center"
    animation_in: str = "fade_in"
    animation_out: str = "fade_in"
    start_time: float = Field(0.0, ge=0.0)
    duration: float = Field(3.0, gt=0.0)
    font_size: Optional[int] = None
    font_weight: Optional[str] = None
    color: Optional[str] = None
    background_color: Optional[str] = None
    opacity: float = Field(1.0, ge=0.0, le=1.0)
    purpose: Optional[str] = None


class Transition(BaseModel):
    """Transition in/out of a scene."""
    type: str = "cut"
    duration: float = Field(0.5, ge=0.0, le=10.0)
    direction: Optional[str] = None
    notes: Optional[str] = None


class BrollCue(BaseModel):
    """B-roll insertion cue within a scene."""
    description: str = ""
    start_time: float = Field(0.0, ge=0.0)
    duration: float = Field(2.0, gt=0.0)
    search_terms: Optional[list[str]] = None
    overlay: bool = False
    opacity: float = Field(1.0, ge=0.0, le=1.0)
    notes: Optional[str] = None


class CaptionConfig(BaseModel):
    """Caption/subtitle configuration for a scene."""
    enabled: bool = True
    style: str = "karaoke"
    position: str = "bottom_center"
    font_size: Optional[int] = None
    color: Optional[str] = "#FFFFFF"
    highlight_color: Optional[str] = "#FFD700"
    background_color: Optional[str] = None
    max_words_per_line: int = Field(6, ge=1, le=20)


class Scene(BaseModel):
    """A single scene in the shot list with all direction info."""
    scene_index: int = Field(0, ge=0)
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., gt=0.0)
    transcript_segment: str = ""
    description: str = ""
    hook_moment: bool = False
    virality_score: int = Field(50, ge=0, le=100)
    camera: Camera = Field(default_factory=Camera)
    typography: list[Typography] = Field(default_factory=list)
    transition_in: Transition = Field(default_factory=Transition)
    transition_out: Transition = Field(default_factory=Transition)
    broll_cues: list[BrollCue] = Field(default_factory=list)
    captions: CaptionConfig = Field(default_factory=CaptionConfig)
    energy_level: Optional[str] = None
    audio_notes: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class ShotList(BaseModel):
    """Complete shot list output from the AI Director."""
    project_id: str
    title: Optional[str] = None
    overall_style: Optional[str] = None
    target_duration: Optional[float] = None
    scenes: list[Scene] = Field(default_factory=list)
    total_virality_score: int = Field(50, ge=0, le=100)
    music_suggestions: list[str] = Field(default_factory=list)
    color_grade: Optional[str] = None
    aspect_ratio: str = "9:16"
    notes: Optional[str] = None
