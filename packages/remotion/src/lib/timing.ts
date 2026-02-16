import { Easing } from 'remotion';

/**
 * Convert a timestamp in seconds to a frame number.
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/**
 * Convert a frame number back to seconds.
 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Get the duration in frames between two timestamps.
 */
export function durationInFrames(
  startTime: number,
  endTime: number,
  fps: number,
): number {
  return Math.max(1, secondsToFrames(endTime - startTime, fps));
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a named easing string to a Remotion Easing function.
 */
export function getEasing(
  name: 'slow' | 'fast' | 'linear' | 'spring',
): (t: number) => number {
  switch (name) {
    case 'slow':
      return Easing.bezier(0.25, 0.1, 0.25, 1.0);
    case 'fast':
      return Easing.bezier(0.0, 0.0, 0.2, 1.0);
    case 'linear':
      return Easing.linear;
    case 'spring':
      return Easing.bezier(0.34, 1.56, 0.64, 1.0);
    default:
      return Easing.linear;
  }
}

/**
 * Calculate the progress (0-1) of the current frame within a range.
 */
export function getProgress(
  currentFrame: number,
  startFrame: number,
  durationFrames: number,
): number {
  if (durationFrames <= 0) return 0;
  return clamp((currentFrame - startFrame) / durationFrames, 0, 1);
}

/**
 * Check if the current frame is within the given range.
 */
export function isInRange(
  currentFrame: number,
  startFrame: number,
  durationFrames: number,
): boolean {
  return (
    currentFrame >= startFrame &&
    currentFrame < startFrame + durationFrames
  );
}
