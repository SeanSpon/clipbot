import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  Img,
  OffthreadVideo,
} from 'remotion';
import type { BrollOverlayProps } from '../types';

/**
 * Semi-transparent B-roll overlay layer.
 * Fades in and out, sits on top of the main video.
 * Supports both image and video B-roll sources.
 */
export const BrollOverlay: React.FC<BrollOverlayProps> = ({
  src,
  startFrame,
  durationInFrames,
  opacity: maxOpacity = 0.6,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  const fadeInDuration = Math.min(10, Math.floor(durationInFrames * 0.15));
  const fadeOutDuration = Math.min(10, Math.floor(durationInFrames * 0.15));
  const fadeOutStart = durationInFrames - fadeOutDuration;

  // Fade in
  let opacity = interpolate(localFrame, [0, fadeInDuration], [0, maxOpacity], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out
  if (localFrame >= fadeOutStart) {
    opacity = interpolate(
      localFrame,
      [fadeOutStart, durationInFrames],
      [maxOpacity, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }

  const isVideo = /\.(mp4|webm|mov)$/i.test(src);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        overflow: 'hidden',
      }}
    >
      {isVideo ? (
        <OffthreadVideo
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
};
