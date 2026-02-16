import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import type { PanSweepProps } from '../types';
import { getEasing } from '../lib/timing';

/**
 * Horizontal camera pan/sweep. Translates children along the X axis
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

  const sign = direction === 'left' ? -1 : 1;

  const translateX = interpolate(
    localFrame,
    [0, durationInFrames - 1],
    [0, sign * amount],
    {
      easing: getEasing('slow'),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `translateX(${translateX}px)`,
      }}
    >
      {children}
    </div>
  );
};
