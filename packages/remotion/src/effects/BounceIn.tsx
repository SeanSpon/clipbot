import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import type { BounceInProps } from '../types';
import { springConfigs } from '../lib/spring-configs';

/**
 * Bounce entrance animation. Text drops in from above
 * with a bouncy spring, then holds in place.
 */
export const BounceIn: React.FC<BounceInProps> = ({
  text,
  startFrame,
  durationInFrames,
  color = '#FFFFFF',
  fontSize = 72,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  const bounceProgress = spring({
    frame: localFrame,
    fps,
    config: springConfigs.bouncy,
  });

  // Drop from above
  const translateY = interpolate(bounceProgress, [0, 1], [-80, 0]);

  // Scale bounce
  const scale = interpolate(bounceProgress, [0, 1], [0.3, 1]);

  // Opacity
  const opacity = interpolate(bounceProgress, [0, 1], [0, 1]);

  // Exit fade
  const exitStart = durationInFrames - 8;
  const exitOpacity =
    localFrame >= exitStart
      ? interpolate(localFrame, [exitStart, durationInFrames], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

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
          fontSize,
          fontWeight: 800,
          fontFamily: 'Inter, Arial, sans-serif',
          color,
          textTransform: 'uppercase',
          textAlign: 'center',
          letterSpacing: '0.04em',
          transform: `translateY(${translateY}px) scale(${scale})`,
          textShadow: '0 4px 15px rgba(0,0,0,0.5)',
          maxWidth: '80%',
          lineHeight: 1.1,
        }}
      >
        {text}
      </div>
    </div>
  );
};
