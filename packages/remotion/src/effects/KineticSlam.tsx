import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { KineticSlamProps } from '../types';
import { springConfigs } from '../lib/spring-configs';

/**
 * Text slams into the frame with a spring animation.
 * Scales from 3x down to 1x with overshoot, then holds.
 */
export const KineticSlam: React.FC<KineticSlamProps> = ({
  text,
  startFrame,
  durationInFrames,
  color = '#FFFFFF',
  fontSize = 80,
  fontWeight = 900,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  // Spring animation for scale: starts big, slams down to 1
  const slamProgress = spring({
    frame: localFrame,
    fps,
    config: springConfigs.bouncy,
  });

  const scale = interpolate(slamProgress, [0, 1], [3, 1]);

  // Opacity: instant appear
  const opacity = interpolate(localFrame, [0, 2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Exit fade in the last 8 frames
  const exitStart = durationInFrames - 8;
  const exitOpacity =
    localFrame >= exitStart
      ? interpolate(localFrame, [exitStart, durationInFrames], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  // Slight rotation on slam for impact
  const rotation = interpolate(slamProgress, [0, 1], [-3, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: opacity * exitOpacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          color,
          fontSize,
          fontWeight,
          fontFamily: 'Inter, Arial, sans-serif',
          textTransform: 'uppercase',
          textAlign: 'center',
          letterSpacing: '0.05em',
          textShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 40px ${color}40`,
          lineHeight: 1.1,
          maxWidth: '80%',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </div>
    </div>
  );
};
