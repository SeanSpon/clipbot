import type { CaptionSegment, CaptionWord } from '../types';

const MAX_WORDS_PER_SEGMENT = 6;
const DEFAULT_WORD_DURATION = 0.4; // seconds

/**
 * Parse a flat transcript string into timed CaptionWord entries.
 * If no per-word timing data is available, words are distributed evenly
 * across the given time range.
 */
export function parseTranscriptToWords(
  transcript: string,
  startTime: number,
  endTime: number,
): CaptionWord[] {
  const rawWords = transcript.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const totalDuration = endTime - startTime;
  const wordDuration = totalDuration / rawWords.length;

  return rawWords.map((text, i) => ({
    text,
    startTime: startTime + i * wordDuration,
    endTime: startTime + (i + 1) * wordDuration,
  }));
}

/**
 * Group an array of CaptionWords into display segments.
 * Each segment contains up to MAX_WORDS_PER_SEGMENT words and spans
 * from the first word's startTime to the last word's endTime.
 */
export function groupWordsIntoSegments(
  words: CaptionWord[],
  maxWordsPerSegment: number = MAX_WORDS_PER_SEGMENT,
): CaptionSegment[] {
  const segments: CaptionSegment[] = [];

  for (let i = 0; i < words.length; i += maxWordsPerSegment) {
    const chunk = words.slice(i, i + maxWordsPerSegment);
    segments.push({
      words: chunk,
      startTime: chunk[0].startTime,
      endTime: chunk[chunk.length - 1].endTime,
    });
  }

  return segments;
}

/**
 * Given pre-timed words (e.g. from Whisper), directly group them into
 * segments without re-distributing timing.
 */
export function segmentTimedWords(
  words: CaptionWord[],
  maxWordsPerSegment: number = MAX_WORDS_PER_SEGMENT,
): CaptionSegment[] {
  return groupWordsIntoSegments(words, maxWordsPerSegment);
}

/**
 * Convenience: parse a transcript and return ready-to-render segments.
 */
export function parseAndSegment(
  transcript: string,
  startTime: number,
  endTime: number,
  maxWordsPerSegment: number = MAX_WORDS_PER_SEGMENT,
): CaptionSegment[] {
  const words = parseTranscriptToWords(transcript, startTime, endTime);
  return groupWordsIntoSegments(words, maxWordsPerSegment);
}

/**
 * Find the active word at a given timestamp.
 */
export function getActiveWord(
  words: CaptionWord[],
  currentTime: number,
): CaptionWord | null {
  return (
    words.find(
      (w) => currentTime >= w.startTime && currentTime < w.endTime,
    ) ?? null
  );
}

/**
 * Find the active segment at a given timestamp.
 */
export function getActiveSegment(
  segments: CaptionSegment[],
  currentTime: number,
): CaptionSegment | null {
  return (
    segments.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime,
    ) ?? null
  );
}
