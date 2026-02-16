"""Opus Clip-style video renderer for ClipBot.

Renders vertical 9:16 clips with:
- Center-crop reframing from landscape to portrait (1080x1920)
- Karaoke-style word-by-word highlighted captions (ASS subtitles)
- Clean typography overlays
- Separate clip outputs (not one big concatenated mess)
"""

import asyncio
import json
import logging
import math
import os
import re
import subprocess
from pathlib import Path
from typing import Optional

import config

logger = logging.getLogger(__name__)

# Output dimensions (9:16 vertical)
OUT_W = 1080
OUT_H = 1920

# Caption styling
CAPTION_FONT = "Arial"
CAPTION_FONT_SIZE = 80
CAPTION_COLOR = "&H00FFFFFF"        # white (ASS BGR format)
CAPTION_HIGHLIGHT = "&H0000FF00"    # green highlight (Opus Clip style)
CAPTION_OUTLINE_COLOR = "&H00000000"  # black outline
CAPTION_OUTLINE_WIDTH = 5
CAPTION_SHADOW = 3
CAPTION_Y_POSITION = 160            # distance from bottom

# Typography styling
TYPO_FONT = "Arial"
TYPO_FONT_SIZE = 78


def _ass_color(hex_color: str) -> str:
    """Convert #RRGGBB to ASS &HBBGGRR format."""
    h = hex_color.lstrip("#")
    if len(h) == 6:
        r, g, b = h[0:2], h[2:4], h[4:6]
        return f"&H00{b}{g}{r}"
    return CAPTION_COLOR


def _escape_ass(text: str) -> str:
    """Escape text for ASS subtitle format."""
    return text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")


def _secs_to_ass_time(secs: float) -> str:
    """Convert seconds to ASS timestamp H:MM:SS.cc."""
    h = int(secs // 3600)
    m = int((secs % 3600) // 60)
    s = secs % 60
    return f"{h}:{m:02d}:{s:05.2f}"


class OpusClipRenderer:
    """Renders Opus Clip-style vertical videos with karaoke captions."""

    def __init__(self):
        self.exports_dir = config.EXPORTS_DIR

    async def render_clips(
        self,
        project_id: str,
        video_path: str,
        shot_list: dict,
        transcript: dict,
        progress_callback=None,
    ) -> list[dict]:
        """Render separate vertical clips from the shot list.

        Groups scenes into clips and renders each as a standalone
        9:16 vertical video with karaoke captions.

        Returns:
            List of dicts with clip info (path, title, score, duration).
        """
        scenes = shot_list.get("scenes", [])
        if not scenes:
            raise ValueError("Shot list has no scenes")

        project_dir = self.exports_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        # Probe source video dimensions
        src_w, src_h = await self._probe_dimensions(video_path)
        logger.info("Source video: %dx%d", src_w, src_h)

        # Group scenes into clips (contiguous high-value segments)
        clips = self._group_scenes_into_clips(scenes)
        logger.info("Grouped %d scenes into %d clips", len(scenes), len(clips))

        results = []
        total = len(clips)

        for idx, clip in enumerate(clips):
            if progress_callback:
                pct = int((idx / total) * 90)
                await progress_callback(
                    "rendering", pct,
                    f"Rendering clip {idx + 1}/{total}: {clip['title']}"
                )

            try:
                output_path = await self._render_single_clip(
                    video_path=video_path,
                    clip=clip,
                    transcript=transcript,
                    project_dir=project_dir,
                    clip_index=idx,
                    src_w=src_w,
                    src_h=src_h,
                )
                results.append({
                    "path": output_path,
                    "title": clip["title"],
                    "score": clip["score"],
                    "duration": clip["end"] - clip["start"],
                    "start": clip["start"],
                    "end": clip["end"],
                })
            except Exception as e:
                logger.error("Failed to render clip %d: %s", idx, e)

        if progress_callback:
            await progress_callback(
                "complete", 100,
                f"Rendered {len(results)} clips!"
            )

        return results

    def _group_scenes_into_clips(self, scenes: list[dict]) -> list[dict]:
        """Group consecutive scenes into standalone clips.

        Each clip is 15-90 seconds, scored by average virality.
        Tries to find natural break points and keep high-value content together.
        """
        if not scenes:
            return []

        # Sort by start time
        sorted_scenes = sorted(scenes, key=lambda s: s["start_time"])

        clips = []
        current_clip_scenes = [sorted_scenes[0]]

        for i in range(1, len(sorted_scenes)):
            scene = sorted_scenes[i]
            prev = sorted_scenes[i - 1]

            current_start = current_clip_scenes[0]["start_time"]
            current_duration = scene["end_time"] - current_start
            gap = scene["start_time"] - prev["end_time"]

            # Break into new clip if:
            # - Gap > 2 seconds between scenes
            # - Current clip would exceed 90 seconds
            # - Current clip is >30s and next scene has very different energy
            should_break = (
                gap > 2.0
                or current_duration > 90
                or (current_duration > 30 and gap > 0.5)
            )

            if should_break and len(current_clip_scenes) >= 2:
                clips.append(self._build_clip(current_clip_scenes))
                current_clip_scenes = [scene]
            else:
                current_clip_scenes.append(scene)

        # Don't forget the last group
        if current_clip_scenes:
            clips.append(self._build_clip(current_clip_scenes))

        # Filter out very short clips (<5s)
        clips = [c for c in clips if c["end"] - c["start"] >= 5.0]

        # Sort by score descending
        clips.sort(key=lambda c: c["score"], reverse=True)

        return clips

    def _build_clip(self, scenes: list[dict]) -> dict:
        """Build a clip dict from a group of scenes."""
        start = scenes[0]["start_time"]
        end = scenes[-1]["end_time"]
        avg_score = sum(s.get("virality_score", 50) for s in scenes) // len(scenes)

        # Find the best title from typography or scene descriptions
        title = None
        best_hook = None
        for s in scenes:
            if s.get("hook_moment"):
                best_hook = s.get("description", "")
            for t in s.get("typography", []):
                purpose = t.get("purpose", "")
                if purpose in ("hook", "key_stat") and t.get("text"):
                    title = t["text"]
                    break
            if title:
                break

        if not title:
            title = best_hook or scenes[0].get("description", f"Clip")

        # Clean up title
        title = title.strip()[:60]

        return {
            "start": start,
            "end": end,
            "score": avg_score,
            "title": title,
            "scenes": scenes,
        }

    async def _render_single_clip(
        self,
        video_path: str,
        clip: dict,
        transcript: dict,
        project_dir: Path,
        clip_index: int,
        src_w: int,
        src_h: int,
    ) -> str:
        """Render one clip as a vertical 9:16 video with karaoke captions."""
        start = clip["start"]
        end = clip["end"]
        duration = end - start

        # Generate ASS subtitle file with karaoke captions
        ass_path = project_dir / f"clip_{clip_index:02d}.ass"
        self._generate_ass_subtitles(
            transcript=transcript,
            clip_start=start,
            clip_end=end,
            scenes=clip["scenes"],
            output_path=str(ass_path),
        )

        # Build the FFmpeg filter chain
        # 1. Crop to 9:16 from center of source
        # 2. Scale to 1080x1920
        # 3. Burn in ASS subtitles
        crop_w, crop_h, crop_x, crop_y = self._calc_center_crop(
            src_w, src_h, 9, 16
        )

        # Escape the ASS path for FFmpeg on Windows
        ass_path_escaped = str(ass_path).replace("\\", "/").replace(":", "\\:")

        # Dark gradient at bottom for caption readability (stepped opacity)
        gradient = (
            f"drawbox=y=ih*0.78:w=iw:h=ih*0.22:color=black@0.65:t=fill,"
            f"drawbox=y=ih*0.72:w=iw:h=ih*0.06:color=black@0.35:t=fill,"
            f"drawbox=y=ih*0.67:w=iw:h=ih*0.05:color=black@0.15:t=fill,"
        )

        vf_chain = (
            f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y},"
            f"scale={OUT_W}:{OUT_H}:flags=lanczos,"
            f"{gradient}"
            f"ass='{ass_path_escaped}'"
        )

        # Safe filename
        safe_title = re.sub(r'[^\w\s-]', '', clip["title"]).strip()[:40]
        safe_title = re.sub(r'\s+', '_', safe_title)
        output_path = str(project_dir / f"{clip_index + 1:02d}_{safe_title}.mp4")

        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-t", str(duration),
            "-i", video_path,
            "-vf", vf_chain,
            "-c:v", "libx264", "-preset", "medium",
            "-crf", "20",
            "-c:a", "aac", "-b:a", "128k",
            "-ar", "44100",
            "-movflags", "+faststart",
            output_path,
        ]

        logger.info("Rendering clip %d: %s", clip_index, " ".join(cmd[:6]))
        proc = await asyncio.to_thread(
            subprocess.run, cmd,
            capture_output=True, text=True,
        )

        if proc.returncode != 0:
            logger.error("FFmpeg clip render stderr: %s", proc.stderr[:500])
            # Retry without subtitles if ASS failed
            vf_simple = (
                f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y},"
                f"scale={OUT_W}:{OUT_H}:flags=lanczos"
            )
            cmd_retry = [
                "ffmpeg", "-y",
                "-ss", str(start),
                "-t", str(duration),
                "-i", video_path,
                "-vf", vf_simple,
                "-c:v", "libx264", "-preset", "medium",
                "-crf", "20",
                "-c:a", "aac", "-b:a", "128k",
                "-ar", "44100",
                "-movflags", "+faststart",
                output_path,
            ]
            proc2 = await asyncio.to_thread(
                subprocess.run, cmd_retry,
                capture_output=True, text=True,
            )
            if proc2.returncode != 0:
                raise RuntimeError(f"FFmpeg render failed: {proc2.stderr[:300]}")

        # Cleanup ASS file
        try:
            os.remove(str(ass_path))
        except OSError:
            pass

        return output_path

    def _generate_ass_subtitles(
        self,
        transcript: dict,
        clip_start: float,
        clip_end: float,
        scenes: list[dict],
        output_path: str,
    ) -> None:
        """Generate an ASS subtitle file with karaoke-style word highlighting.

        Each word appears in white, then highlights to yellow as it's spoken.
        Words are grouped into 3-5 word phrases for readability.
        """
        # Collect all words within this clip's time range
        words_in_clip = []
        for seg in transcript.get("segments", []):
            for word in seg.get("words", []):
                w_start = word.get("start", 0.0)
                w_end = word.get("end", 0.0)
                if w_start >= clip_start - 0.1 and w_end <= clip_end + 0.1:
                    words_in_clip.append({
                        "word": word.get("word", "").strip(),
                        "start": w_start - clip_start,  # relative to clip
                        "end": w_end - clip_start,
                    })

        # Group words into phrases (3-5 words per line)
        phrases = self._group_words_into_phrases(words_in_clip)

        # Also collect typography events from scenes
        typo_events = []
        for scene in scenes:
            for typo in scene.get("typography", []):
                text = typo.get("text", "").strip()
                if not text:
                    continue
                # Convert to clip-relative time
                t_start = typo.get("start_time", 0.0)
                t_dur = typo.get("duration", 3.0)
                scene_offset = scene["start_time"] - clip_start
                abs_start = scene_offset + t_start
                abs_end = abs_start + t_dur
                if abs_start >= 0:
                    typo_events.append({
                        "text": text,
                        "start": max(0, abs_start),
                        "end": abs_end,
                        "color": typo.get("color", "#FFDD00"),
                        "position": typo.get("position", "center"),
                    })

        # Write ASS file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(self._ass_header())

            # Write per-word highlight caption events (Opus Clip style)
            for phrase in phrases:
                f.write(self._ass_word_highlight_events(phrase))

            # Write typography overlay events
            for typo in typo_events:
                f.write(self._ass_typography_event(typo))

    def _group_words_into_phrases(
        self, words: list[dict], max_words: int = 3
    ) -> list[dict]:
        """Group words into display phrases for captions.

        Each phrase contains 3-5 words displayed together,
        with per-word timing for karaoke highlighting.
        """
        if not words:
            return []

        phrases = []
        current_words = []

        for word in words:
            if not word["word"]:
                continue
            current_words.append(word)

            # Break on natural points or max words
            text = word["word"]
            is_end = (
                len(current_words) >= max_words
                or text.endswith((".", "!", "?", ",", ";", ":"))
            )

            if is_end and current_words:
                phrases.append({
                    "words": list(current_words),
                    "start": current_words[0]["start"],
                    "end": current_words[-1]["end"],
                    "text": " ".join(w["word"] for w in current_words),
                })
                current_words = []

        # Remaining words
        if current_words:
            phrases.append({
                "words": list(current_words),
                "start": current_words[0]["start"],
                "end": current_words[-1]["end"],
                "text": " ".join(w["word"] for w in current_words),
            })

        return phrases

    def _ass_header(self) -> str:
        """Generate ASS subtitle file header with styles."""
        return f"""[Script Info]
Title: ClipBot Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: {OUT_W}
PlayResY: {OUT_H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,{CAPTION_FONT},{CAPTION_FONT_SIZE},{CAPTION_COLOR},{CAPTION_HIGHLIGHT},{CAPTION_OUTLINE_COLOR},&HA0000000,-1,0,0,0,100,100,1,0,1,{CAPTION_OUTLINE_WIDTH},{CAPTION_SHADOW},2,60,60,{CAPTION_Y_POSITION},1
Style: Typography,{TYPO_FONT},{TYPO_FONT_SIZE},&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,2,0,1,5,3,8,60,60,700,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def _ass_word_highlight_events(self, phrase: dict) -> str:
        """Generate ASS events with per-word color highlighting (Opus Clip style).

        For each word in the phrase, creates a separate dialogue event
        showing all words but highlighting only the active one in green
        with a slight scale-up effect. This is the signature Opus Clip look.
        """
        words = phrase["words"]
        if not words:
            return ""

        events = []

        for i, w in enumerate(words):
            # Each event starts when this word starts, ends when next word starts
            if i == 0:
                evt_start = max(0, w["start"] - 0.08)  # slight pre-show
            else:
                evt_start = w["start"]

            if i + 1 < len(words):
                evt_end = words[i + 1]["start"]
            else:
                evt_end = w["end"] + 0.1  # brief hold, avoid overlap with next phrase

            start_ts = _secs_to_ass_time(evt_start)
            end_ts = _secs_to_ass_time(evt_end)

            # Build text with color overrides - active word is green + scaled up
            parts = []
            for j, word in enumerate(words):
                text = _escape_ass(word["word"])
                if j == i:
                    # Active word: green, slightly larger, bolder outline
                    parts.append(
                        f"{{\\1c{CAPTION_HIGHLIGHT}\\fscx115\\fscy115\\bord6}}"
                        f"{text}"
                        f"{{\\1c{CAPTION_COLOR}\\fscx100\\fscy100\\bord{CAPTION_OUTLINE_WIDTH}}}"
                    )
                else:
                    parts.append(text)

            full_text = " ".join(parts)
            events.append(
                f"Dialogue: 0,{start_ts},{end_ts},Caption,,0,0,0,,{full_text}\n"
            )

        return "".join(events)

    def _ass_typography_event(self, typo: dict) -> str:
        """Generate an ASS dialogue event for typography overlays.

        Typography appears in the upper third of the screen with
        a smooth fade-in/out and slight scale animation.
        """
        start = _secs_to_ass_time(max(0, typo["start"]))
        end = _secs_to_ass_time(typo["end"])
        text = _escape_ass(typo["text"].upper())  # uppercase for impact

        # Fade in/out + slight scale animation for punch
        effects = "{\\fad(400,300)\\fscx105\\fscy105}"

        return (
            f"Dialogue: 1,{start},{end},Typography,,0,0,0,,{effects}{text}\n"
        )

    def _calc_center_crop(
        self, src_w: int, src_h: int, target_w_ratio: int, target_h_ratio: int,
        focus: str = "center",
    ) -> tuple[int, int, int, int]:
        """Calculate crop dimensions to achieve target aspect ratio.

        Args:
            focus: Where to focus the crop - 'left', 'center', 'right',
                   or a float 0.0 (left) to 1.0 (right).

        Returns (crop_w, crop_h, crop_x, crop_y).
        """
        target_ratio = target_w_ratio / target_h_ratio  # 9/16 = 0.5625
        src_ratio = src_w / src_h

        # Map focus to a 0-1 position
        focus_map = {"left": 0.25, "center": 0.5, "right": 0.75}
        if isinstance(focus, str):
            focus_pos = focus_map.get(focus, 0.5)
        else:
            focus_pos = float(focus)

        if src_ratio > target_ratio:
            # Source is wider than target - crop width
            crop_h = src_h
            crop_w = int(src_h * target_ratio)
            crop_w = crop_w - (crop_w % 2)
            # Position crop based on focus point
            max_x = src_w - crop_w
            crop_x = int(max_x * focus_pos)
            crop_x = max(0, min(crop_x, max_x))
            crop_y = 0
        else:
            # Source is taller - crop height
            crop_w = src_w
            crop_h = int(src_w / target_ratio)
            crop_h = crop_h - (crop_h % 2)
            crop_x = 0
            crop_y = (src_h - crop_h) // 2

        return crop_w, crop_h, crop_x, crop_y

    async def _probe_dimensions(self, video_path: str) -> tuple[int, int]:
        """Get video dimensions using ffprobe."""
        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-select_streams", "v:0",
            video_path,
        ]
        proc = await asyncio.to_thread(
            subprocess.run, cmd,
            capture_output=True, text=True,
        )
        if proc.returncode != 0:
            logger.warning("ffprobe failed, using defaults")
            return 1920, 1080

        data = json.loads(proc.stdout)
        streams = data.get("streams", [])
        if streams:
            w = streams[0].get("width", 1920)
            h = streams[0].get("height", 1080)
            return w, h
        return 1920, 1080

    # Keep backwards compat with render endpoint
    async def render_full_edit(
        self,
        project_id: str,
        video_path: str,
        shot_list: dict,
        transcript: dict = None,
        progress_callback=None,
    ) -> str:
        """Render and return path to best clip (or all clips).

        This wraps render_clips for the existing render endpoint.
        """
        # If no transcript provided, try to load from database
        if transcript is None:
            import database
            project = await database.get_project(project_id)
            transcript = project.get("transcript", {}) if project else {}

        results = await self.render_clips(
            project_id=project_id,
            video_path=video_path,
            shot_list=shot_list,
            transcript=transcript,
            progress_callback=progress_callback,
        )

        if not results:
            raise RuntimeError("No clips were rendered")

        # Return the highest-scored clip path
        best = max(results, key=lambda r: r["score"])
        return best["path"]


# Global singleton
renderer = OpusClipRenderer()
