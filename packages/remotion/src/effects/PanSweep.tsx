import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import type { PanSweepProps } from '../types';
import { getEasing } from '../lib/timing';

/**
 * Camera pan/sweep. Translates children along X or Y axis
 * over the duration of the effect.
 */
export const PanSweep: React.FC<PanSweepProps> = ({
  startFrame,
  durationInFrames,
  direction = 'left',
  amount = 100,
  children,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) {
    return <>{children}</>;
  }

  const isVertical = direction === 'up' || direction === 'down';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  const translate = interpolate(
    localFrame,
    [0, durationInFrames - 1],
    [0, sign * amount],
    {
      easing: getEasing('slow'),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const transform = isVertical
    ? `translateY(${translate}px)`
    : `translateX(${translate}px)`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform,
      }}
    >
      {children}
    </div>
  );
};
