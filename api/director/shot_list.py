"""Validation functions for the AI Director's shot list JSON output."""

import logging
from typing import Optional

from models.shot_list import ShotList, Scene

logger = logging.getLogger(__name__)


def validate_shot_list(data: dict, project_id: str) -> ShotList:
    """Validate and normalize raw JSON from the AI Director into a ShotList.

    Args:
        data: Raw dict parsed from the AI's JSON output.
        project_id: The project ID to attach to the shot list.

    Returns:
        A validated ShotList instance.

    Raises:
        ValueError: If the data fails validation.
    """
    # Ensure project_id is set
    data["project_id"] = project_id

    # Normalize scenes
    scenes = data.get("scenes", [])
    if not scenes:
        raise ValueError("Shot list must contain at least one scene")

    for i, scene in enumerate(scenes):
        _normalize_scene(scene, i)

    return ShotList.model_validate(data)


def _normalize_scene(scene: dict, expected_index: int) -> None:
    """Normalize and fix common issues in a scene dict."""
    # Fix scene_index if missing or wrong
    if "scene_index" not in scene:
        scene["scene_index"] = expected_index

    # Ensure required timing fields
    if "start_time" not in scene:
        raise ValueError(f"Scene {expected_index}: missing start_time")
    if "end_time" not in scene:
        raise ValueError(f"Scene {expected_index}: missing end_time")
    if scene["end_time"] <= scene["start_time"]:
        raise ValueError(
            f"Scene {expected_index}: end_time ({scene['end_time']}) must be "
            f"greater than start_time ({scene['start_time']})"
        )

    # Ensure transcript_segment
    if not scene.get("transcript_segment"):
        scene["transcript_segment"] = ""
        logger.warning("Scene %d: missing transcript_segment", expected_index)

    # Ensure description
    if not scene.get("description"):
        scene["description"] = f"Scene {expected_index}"

    # Clamp virality score
    score = scene.get("virality_score", 50)
    scene["virality_score"] = max(0, min(100, int(score)))

    # Ensure camera defaults
    if "camera" not in scene:
        scene["camera"] = {}

    # Ensure transitions
    if "transition_in" not in scene:
        scene["transition_in"] = {"type": "cut"}
    if "transition_out" not in scene:
        scene["transition_out"] = {"type": "cut"}

    # Ensure captions
    if "captions" not in scene:
        scene["captions"] = {"enabled": True}

    # Normalize typography timing
    for typo in scene.get("typography", []):
        if "start_time" not in typo:
            typo["start_time"] = 0.0
        if "duration" not in typo:
            scene_duration = scene["end_time"] - scene["start_time"]
            typo["duration"] = min(scene_duration, 3.0)

    # Normalize B-roll timing
    for broll in scene.get("broll_cues", []):
        if "start_time" not in broll:
            broll["start_time"] = 0.0
        if "duration" not in broll:
            broll["duration"] = 2.0


def validate_scene_continuity(shot_list: ShotList) -> list[str]:
    """Check for continuity issues across scenes.

    Returns a list of warning messages (empty if all is well).
    """
    warnings = []
    scenes = shot_list.scenes

    if not scenes:
        return ["Shot list has no scenes"]

    for i in range(1, len(scenes)):
        prev = scenes[i - 1]
        curr = scenes[i]

        # Check for time gaps
        gap = curr.start_time - prev.end_time
        if gap > 1.0:
            warnings.append(
                f"Gap of {gap:.1f}s between scene {i-1} and {i}"
            )

        # Check for time overlaps
        if curr.start_time < prev.end_time:
            overlap = prev.end_time - curr.start_time
            warnings.append(
                f"Overlap of {overlap:.1f}s between scene {i-1} and {i}"
            )

        # Warn on same camera setup for 3+ scenes
        if i >= 2:
            prev2 = scenes[i - 2]
            if (
                prev2.camera.framing == prev.camera.framing == curr.camera.framing
                and prev2.camera.movement == prev.camera.movement == curr.camera.movement
            ):
                warnings.append(
                    f"Scenes {i-2} to {i} use identical camera setup "
                    f"({curr.camera.framing}, {curr.camera.movement}) "
                    f"-- consider more visual variety"
                )

    return warnings
