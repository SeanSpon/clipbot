"""Pydantic models for the AI Director's shot list output schema.

These models define the structured JSON that the Master AI Director produces
when analyzing a transcript. Each scene contains camera directions, typography
placement, transitions, B-roll cues, and caption configuration.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# --- Enums ---

class CameraMovement(str, Enum):
    STATIC = "static"
    PAN_LEFT = "pan_left"
    PAN_RIGHT = "pan_right"
    TILT_UP = "tilt_up"
    TILT_DOWN = "tilt_down"
    ZOOM_IN = "zoom_in"
    ZOOM_OUT = "zoom_out"
    DOLLY_IN = "dolly_in"
    DOLLY_OUT = "dolly_out"
    TRACKING = "tracking"
    HANDHELD = "handheld"
    CRANE_UP = "crane_up"
    CRANE_DOWN = "crane_down"


class FramingType(str, Enum):
    EXTREME_CLOSE_UP = "extreme_close_up"
    CLOSE_UP = "close_up"
    MEDIUM_CLOSE_UP = "medium_close_up"
    MEDIUM = "medium"
    MEDIUM_WIDE = "medium_wide"
    WIDE = "wide"
    EXTREME_WIDE = "extreme_wide"


class TransitionType(str, Enum):
    CUT = "cut"
    DISSOLVE = "dissolve"
    FADE_IN = "fade_in"
    FADE_OUT = "fade_out"
    WIPE_LEFT = "wipe_left"
    WIPE_RIGHT = "wipe_right"
    ZOOM_TRANSITION = "zoom_transition"
    WHIP_PAN = "whip_pan"
    JUMP_CUT = "jump_cut"
    MATCH_CUT = "match_cut"
    J_CUT = "j_cut"
    L_CUT = "l_cut"
    SWIPE = "swipe"
    GLITCH = "glitch"


class TypographyPosition(str, Enum):
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    CENTER_LEFT = "center_left"
    CENTER = "center"
    CENTER_RIGHT = "center_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"
    LOWER_THIRD = "lower_third"


class TypographyAnimation(str, Enum):
    NONE = "none"
    FADE_IN = "fade_in"
    SLIDE_UP = "slide_up"
    SLIDE_DOWN = "slide_down"
    SLIDE_LEFT = "slide_left"
    SLIDE_RIGHT = "slide_right"
    SCALE_UP = "scale_up"
    TYPEWRITER = "typewriter"
    BOUNCE = "bounce"
    GLITCH = "glitch"
    HIGHLIGHT = "highlight"


class CaptionStyle(str, Enum):
    STANDARD = "standard"
    KARAOKE = "karaoke"
    WORD_BY_WORD = "word_by_word"
    SENTENCE = "sentence"
    BOLD_KEY_WORDS = "bold_key_words"


# --- Component Models ---

class Camera(BaseModel):
    """Camera direction for a scene."""
    framing: FramingType = FramingType.MEDIUM
    movement: CameraMovement = CameraMovement.STATIC
    movement_speed: float = Field(1.0, ge=0.1, le=5.0, description="Speed multiplier")
    focus_point: Optional[str] = Field(
        None, description="What the camera should focus on, e.g. 'speaker face'"
    )
    angle: Optional[str] = Field(
        None, description="Camera angle description, e.g. 'eye level', 'low angle'"
    )
    notes: Optional[str] = None


class Typography(BaseModel):
    """On-screen text overlay for a scene."""
    text: str
    position: TypographyPosition = TypographyPosition.BOTTOM_CENTER
    animation_in: TypographyAnimation = TypographyAnimation.FADE_IN
    animation_out: TypographyAnimation = TypographyAnimation.FADE_IN
    start_time: float = Field(..., ge=0.0, description="Relative start within the scene (seconds)")
    duration: float = Field(..., gt=0.0, description="Duration on screen (seconds)")
    font_size: Optional[int] = Field(None, ge=8, le=200)
    font_weight: Optional[str] = None
    color: Optional[str] = Field(None, description="Hex color, e.g. '#FFFFFF'")
    background_color: Optional[str] = Field(None, description="Background behind text")
    opacity: float = Field(1.0, ge=0.0, le=1.0)
    purpose: Optional[str] = Field(
        None, description="Why this text is shown, e.g. 'hook', 'key stat', 'CTA'"
    )


class Transition(BaseModel):
    """Transition in/out of a scene."""
    type: TransitionType = TransitionType.CUT
    duration: float = Field(0.5, ge=0.0, le=5.0, description="Transition duration (seconds)")
    direction: Optional[str] = None
    notes: Optional[str] = None


class BrollCue(BaseModel):
    """B-roll insertion cue within a scene."""
    description: str = Field(..., description="What B-roll footage to show")
    start_time: float = Field(..., ge=0.0, description="When to start B-roll (relative to scene)")
    duration: float = Field(..., gt=0.0, description="How long to show B-roll (seconds)")
    search_terms: Optional[list[str]] = Field(
        None, description="Keywords for stock footage search"
    )
    overlay: bool = Field(
        False, description="Whether to overlay B-roll (PiP) or full cut"
    )
    opacity: float = Field(1.0, ge=0.0, le=1.0)
    notes: Optional[str] = None


class CaptionConfig(BaseModel):
    """Caption/subtitle configuration for a scene."""
    enabled: bool = True
    style: CaptionStyle = CaptionStyle.KARAOKE
    position: TypographyPosition = TypographyPosition.BOTTOM_CENTER
    font_size: Optional[int] = Field(None, ge=8, le=120)
    color: Optional[str] = "#FFFFFF"
    highlight_color: Optional[str] = "#FFD700"
    background_color: Optional[str] = None
    max_words_per_line: int = Field(6, ge=1, le=20)


class Scene(BaseModel):
    """A single scene in the shot list with all direction info."""
    scene_index: int = Field(..., ge=0)
    start_time: float = Field(..., ge=0.0, description="Absolute start time in seconds")
    end_time: float = Field(..., gt=0.0, description="Absolute end time in seconds")
    transcript_segment: str = Field(..., description="The spoken words in this scene")
    description: str = Field(..., description="Brief scene description / editorial note")
    hook_moment: bool = Field(
        False, description="Whether this scene contains a 'hook' moment"
    )
    virality_score: int = Field(
        50, ge=0, le=100,
        description="How viral/engaging this scene is (0-100)"
    )
    camera: Camera = Field(default_factory=Camera)
    typography: list[Typography] = Field(default_factory=list)
    transition_in: Transition = Field(default_factory=Transition)
    transition_out: Transition = Field(default_factory=Transition)
    broll_cues: list[BrollCue] = Field(default_factory=list)
    captions: CaptionConfig = Field(default_factory=CaptionConfig)
    energy_level: Optional[str] = Field(
        None, description="Energy/pacing: 'low', 'medium', 'high', 'climax'"
    )
    audio_notes: Optional[str] = Field(
        None, description="Audio direction: music, SFX, volume adjustments"
    )
    tags: list[str] = Field(default_factory=list)


class ShotList(BaseModel):
    """Complete shot list output from the AI Director."""
    project_id: str
    title: Optional[str] = None
    overall_style: Optional[str] = Field(
        None, description="Overall editing style, e.g. 'fast-paced vlog', 'documentary'"
    )
    target_duration: Optional[float] = Field(
        None, description="Target total duration in seconds"
    )
    scenes: list[Scene] = Field(default_factory=list)
    total_virality_score: int = Field(
        50, ge=0, le=100,
        description="Overall virality score for the entire piece"
    )
    music_suggestions: list[str] = Field(default_factory=list)
    color_grade: Optional[str] = Field(
        None, description="Suggested color grading, e.g. 'warm cinematic', 'cool tech'"
    )
    aspect_ratio: str = Field("9:16", description="Target aspect ratio")
    notes: Optional[str] = None
