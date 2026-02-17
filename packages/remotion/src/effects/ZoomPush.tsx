import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { ZoomPushProps } from '../types';
import { getEasing } from '../lib/timing';
import { springConfigs } from '../lib/spring-configs';

/**
 * Slow push zoom for emphasis. Interpolates scale over the full
 * duration of the effect, wrapping its children.
 */
export const ZoomPush: React.FC<ZoomPushProps> = ({
  startFrame,
  durationInFrames,
  from = 1.0,
  to = 1.15,
  easing = 'slow',
  transformOrigin = 'center center',
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= durationInFrames) {
    return <>{children}</>;
  }

  let scale: number;

  if (easing === 'spring') {
    const progress = spring({
      frame: localFrame,
      fps,
      config: springConfigs.smooth,
      durationInFrames,
    });
    scale = interpolate(progress, [0, 1], [from, to]);
  } else {
    scale = interpolate(localFrame, [0, durationInFrames - 1], [from, to], {
      easing: getEasing(easing),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scale})`,
        transformOrigin,
      }}
    >
      {children}
    </div>
  );
};
