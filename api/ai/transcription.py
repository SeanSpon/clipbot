"""Transcription service with WhisperX and OpenAI Whisper API fallback.

WhisperX provides word-level timestamps and speaker diarization locally.
If WhisperX is not installed, falls back to the OpenAI Whisper API.
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import Optional

import config

logger = logging.getLogger(__name__)


async def transcribe(
    file_path: str,
    language: Optional[str] = None,
    num_speakers: Optional[int] = None,
    progress_callback=None,
) -> dict:
    """Transcribe an audio/video file with word-level timestamps.

    Attempts WhisperX first for local, high-quality transcription with
    speaker diarization. Falls back to OpenAI Whisper API if WhisperX
    is not available.

    Args:
        file_path: Path to the audio or video file.
        language: Optional language code (e.g., 'en').
        num_speakers: Optional hint for speaker diarization.
        progress_callback: Optional async callable(stage, progress_pct, message).

    Returns:
        dict with keys:
            - segments: list of segment dicts with start, end, text, words, speaker
            - language: detected language code
            - duration: total audio duration in seconds
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    try:
        return await _transcribe_whisperx(
            file_path, language, num_speakers, progress_callback
        )
    except ImportError:
        logger.info("WhisperX not installed, falling back to OpenAI Whisper API")
        return await _transcribe_openai(file_path, language, progress_callback)


async def _transcribe_whisperx(
    file_path: str,
    language: Optional[str],
    num_speakers: Optional[int],
    progress_callback=None,
) -> dict:
    """Transcribe using local WhisperX with word alignment and diarization."""
    import whisperx
    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    if progress_callback:
        await progress_callback("loading_model", 5, "Loading WhisperX model...")

    def _run_whisperx():
        # 1. Load model and transcribe
        model = whisperx.load_model(
            "large-v3", device, compute_type=compute_type, language=language
        )
        audio = whisperx.load_audio(file_path)
        result = model.transcribe(audio, batch_size=16)
        detected_lang = result.get("language", language or "en")

        # 2. Align whisper output for word-level timestamps
        align_model, align_metadata = whisperx.load_align_model(
            language_code=detected_lang, device=device
        )
        result = whisperx.align(
            result["segments"], align_model, align_metadata, audio, device,
            return_char_alignments=False,
        )

        # 3. Speaker diarization (requires HuggingFace token)
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            diarize_model = whisperx.DiarizationPipeline(
                use_auth_token=hf_token, device=device
            )
            diarize_kwargs = {}
            if num_speakers:
                diarize_kwargs["num_speakers"] = num_speakers
            diarize_segments = diarize_model(audio, **diarize_kwargs)
            result = whisperx.assign_word_speakers(diarize_segments, result)

        return result, detected_lang

    if progress_callback:
        await progress_callback("transcribing", 20, "Running WhisperX transcription...")

    result, detected_lang = await asyncio.to_thread(_run_whisperx)

    if progress_callback:
        await progress_callback("complete", 100, "Transcription complete")

    # Normalize output
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start": seg.get("start", 0.0),
            "end": seg.get("end", 0.0),
            "text": seg.get("text", "").strip(),
            "words": [
                {
                    "word": w.get("word", ""),
                    "start": w.get("start", 0.0),
                    "end": w.get("end", 0.0),
                    "score": w.get("score", 0.0),
                }
                for w in seg.get("words", [])
            ],
            "speaker": seg.get("speaker"),
        })

    duration = segments[-1]["end"] if segments else 0.0

    return {
        "segments": segments,
        "language": detected_lang,
        "duration": duration,
    }


async def _transcribe_openai(
    file_path: str,
    language: Optional[str],
    progress_callback=None,
) -> dict:
    """Fallback transcription using the OpenAI Whisper API."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

    if progress_callback:
        await progress_callback("uploading", 10, "Uploading file to OpenAI...")

    with open(file_path, "rb") as f:
        kwargs = {
            "model": "whisper-1",
            "file": f,
            "response_format": "verbose_json",
            "timestamp_granularities": ["word", "segment"],
        }
        if language:
            kwargs["language"] = language

        response = await asyncio.to_thread(
            lambda: asyncio.get_event_loop().run_until_complete(
                client.audio.transcriptions.create(**kwargs)
            )
        )

    if progress_callback:
        await progress_callback("processing", 80, "Processing transcription results...")

    # The OpenAI response has segments and words at the top level
    segments = []
    for seg in getattr(response, "segments", []) or []:
        words = []
        # Words from the verbose response
        seg_words = getattr(seg, "words", None) or []
        for w in seg_words:
            words.append({
                "word": getattr(w, "word", ""),
                "start": getattr(w, "start", 0.0),
                "end": getattr(w, "end", 0.0),
                "score": 1.0,
            })

        segments.append({
            "start": getattr(seg, "start", 0.0),
            "end": getattr(seg, "end", 0.0),
            "text": getattr(seg, "text", "").strip(),
            "words": words,
            "speaker": None,  # OpenAI API doesn't do diarization
        })

    # Also try top-level words if segments didn't have them
    if segments and not segments[0].get("words"):
        all_words = getattr(response, "words", []) or []
        if all_words:
            word_idx = 0
            for seg in segments:
                seg_words = []
                while word_idx < len(all_words):
                    w = all_words[word_idx]
                    w_start = getattr(w, "start", 0.0)
                    if w_start <= seg["end"]:
                        seg_words.append({
                            "word": getattr(w, "word", ""),
                            "start": w_start,
                            "end": getattr(w, "end", 0.0),
                            "score": 1.0,
                        })
                        word_idx += 1
                    else:
                        break
                seg["words"] = seg_words

    duration = segments[-1]["end"] if segments else getattr(response, "duration", 0.0)

    if progress_callback:
        await progress_callback("complete", 100, "Transcription complete")

    return {
        "segments": segments,
        "language": getattr(response, "language", language or "en"),
        "duration": duration,
    }
