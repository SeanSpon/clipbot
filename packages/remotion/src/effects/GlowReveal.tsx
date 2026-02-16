import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import type { GlowRevealProps } from '../types';
import { springConfigs } from '../lib/spring-configs';

/**
 * Text glows in from transparent with a blur effect.
 * The glow expands, then text sharpens into view.
 */
export const GlowReveal: React.FC<GlowRevealProps> = ({
  text,
  startFrame,
  durationInFrames,
  color = '#FFFFFF',
  glowColor = '#00BFFF',
  fontSize = 72,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  const revealProgress = spring({
    frame: localFrame,
    fps,
    config: springConfigs.smooth,
  });

  // Opacity ramps up
  const opacity = interpolate(revealProgress, [0, 1], [0, 1]);

  // Blur fades out as text is revealed
  const blur = interpolate(revealProgress, [0, 1], [20, 0]);

  // Glow intensity peaks then settles
  const glowIntensity = interpolate(
    revealProgress,
    [0, 0.5, 1],
    [0, 40, 15],
  );

  // Scale slightly shrinks to give a "focus" feel
  const scale = interpolate(revealProgress, [0, 1], [1.08, 1]);

  // Exit fade in last 8 frames
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
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          filter: `blur(${blur}px)`,
          transform: `scale(${scale})`,
          textShadow: [
            `0 0 ${glowIntensity}px ${glowColor}`,
            `0 0 ${glowIntensity * 2}px ${glowColor}60`,
            `0 0 ${glowIntensity * 3}px ${glowColor}30`,
          ].join(', '),
          maxWidth: '80%',
          lineHeight: 1.1,
        }}
      >
        {text}
      </div>
    </div>
  );
};
