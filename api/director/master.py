"""Master AI Director - the core brain of ClipBot.

Takes transcripts and user preferences, calls an AI provider, and produces
validated, structured shot lists with scene-by-scene editing directions.
"""

import json
import logging
from typing import Optional

from ai.providers.base import AIProvider
from director.prompts import DIRECTOR_SYSTEM_PROMPT, DIRECTOR_USER_PROMPT_TEMPLATE
from director.shot_list import validate_shot_list, validate_scene_continuity
from models.clip import ClipCreate
from models.shot_list import ShotList

logger = logging.getLogger(__name__)


class MasterDirector:
    """The Master AI Director that transforms transcripts into shot lists.

    Usage:
        provider = get_provider("anthropic")
        director = MasterDirector(provider)
        clips = await director.direct(transcript, cameras, preferences)
    """

    def __init__(
        self,
        provider: AIProvider,
        max_retries: int = 2,
    ):
        self.provider = provider
        self.max_retries = max_retries

    async def direct(
        self,
        transcript: dict,
        project_id: str,
        cameras: Optional[list[str]] = None,
        preferences: Optional[dict] = None,
        progress_callback=None,
    ) -> tuple[ShotList, list[ClipCreate]]:
        """Analyze a transcript and produce a complete shot list.

        Args:
            transcript: Transcript dict with 'segments' list from the
                        transcription service.
            project_id: The project ID.
            cameras: Available camera angles (e.g., ['main', 'wide', 'overhead']).
            preferences: User preferences dict with optional keys:
                - style: 'fast-paced', 'cinematic', 'documentary', etc.
                - target_duration: desired output duration in seconds
                - aspect_ratio: '9:16', '16:9', '1:1'
                - caption_style: 'karaoke', 'word_by_word', etc.
                - energy: 'low', 'medium', 'high'
            progress_callback: Optional async callable(stage, progress_pct, message).

        Returns:
            Tuple of (ShotList, list[ClipCreate]) where clips are ready for DB insert.
        """
        if progress_callback:
            await progress_callback("preparing", 5, "Preparing transcript for director...")

        # Format the transcript as readable text with timestamps
        formatted_transcript = self._format_transcript(transcript)
        cameras_text = self._format_cameras(cameras)
        preferences_text = self._format_preferences(preferences)

        # Build the prompt
        user_prompt = DIRECTOR_USER_PROMPT_TEMPLATE.format(
            transcript=formatted_transcript,
            cameras=cameras_text,
            preferences=preferences_text,
        )

        if progress_callback:
            await progress_callback("directing", 20, "AI Director is analyzing transcript...")

        # Call the AI with retries
        shot_list = None
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                raw_json = await self.provider.generate_json(
                    prompt=user_prompt,
                    system_prompt=DIRECTOR_SYSTEM_PROMPT,
                    max_tokens=16384,
                    temperature=0.4,
                )

                if progress_callback:
                    pct = 60 + (attempt * 10)
                    await progress_callback(
                        "validating", min(pct, 80),
                        "Validating shot list..."
                    )

                shot_list = validate_shot_list(raw_json, project_id)
                break

            except (ValueError, json.JSONDecodeError) as e:
                last_error = e
                logger.warning(
                    "Director attempt %d/%d failed: %s",
                    attempt + 1, self.max_retries + 1, e,
                )
                if attempt < self.max_retries:
                    # Refine the prompt with error feedback
                    user_prompt = (
                        f"{user_prompt}\n\n"
                        f"IMPORTANT: Your previous response had an error: {e}\n"
                        f"Please fix this and output valid JSON."
                    )

        if shot_list is None:
            raise RuntimeError(
                f"AI Director failed after {self.max_retries + 1} attempts. "
                f"Last error: {last_error}"
            )

        # Check continuity
        warnings = validate_scene_continuity(shot_list)
        for w in warnings:
            logger.info("Continuity note: %s", w)

        if progress_callback:
            await progress_callback("scoring", 85, "Scoring clips for virality...")

        # Convert scenes to clips
        clips = self._scenes_to_clips(shot_list, project_id)

        if progress_callback:
            await progress_callback("complete", 100, f"Director complete: {len(clips)} clips created")

        return shot_list, clips

    def _format_transcript(self, transcript: dict) -> str:
        """Format transcript segments into readable text with timestamps."""
        lines = []
        for seg in transcript.get("segments", []):
            start = seg.get("start", 0.0)
            end = seg.get("end", 0.0)
            text = seg.get("text", "")
            speaker = seg.get("speaker")

            timestamp = f"[{self._fmt_time(start)} --> {self._fmt_time(end)}]"
            if speaker:
                lines.append(f"{timestamp} {speaker}: {text}")
            else:
                lines.append(f"{timestamp} {text}")

        return "\n".join(lines) if lines else "(empty transcript)"

    def _format_cameras(self, cameras: Optional[list[str]]) -> str:
        """Format camera list for the prompt."""
        if not cameras:
            return "Single camera (treat all footage as one angle)"
        return ", ".join(cameras)

    def _format_preferences(self, preferences: Optional[dict]) -> str:
        """Format user preferences for the prompt."""
        if not preferences:
            return "No specific preferences -- use your best judgment for maximum viral impact."

        lines = []
        if "style" in preferences:
            lines.append(f"- Editing style: {preferences['style']}")
        if "target_duration" in preferences:
            lines.append(f"- Target duration: {preferences['target_duration']} seconds")
        if "aspect_ratio" in preferences:
            lines.append(f"- Aspect ratio: {preferences['aspect_ratio']}")
        if "caption_style" in preferences:
            lines.append(f"- Caption style: {preferences['caption_style']}")
        if "energy" in preferences:
            lines.append(f"- Energy level: {preferences['energy']}")

        # Pass through any other preferences
        known_keys = {"style", "target_duration", "aspect_ratio", "caption_style", "energy"}
        for k, v in preferences.items():
            if k not in known_keys:
                lines.append(f"- {k}: {v}")

        return "\n".join(lines) if lines else "No specific preferences."

    def _scenes_to_clips(self, shot_list: ShotList, project_id: str) -> list[ClipCreate]:
        """Convert shot list scenes into ClipCreate objects."""
        clips = []
        for scene in shot_list.scenes:
            clip = ClipCreate(
                project_id=project_id,
                scene_index=scene.scene_index,
                start_time=scene.start_time,
                end_time=scene.end_time,
                transcript_segment=scene.transcript_segment,
                shot_list=scene.model_dump(),
                virality_score=scene.virality_score,
                tags=scene.tags,
            )
            clips.append(clip)
        return clips

    @staticmethod
    def _fmt_time(seconds: float) -> str:
        """Format seconds as MM:SS.ms."""
        mins = int(seconds // 60)
        secs = seconds % 60
        return f"{mins:02d}:{secs:05.2f}"
