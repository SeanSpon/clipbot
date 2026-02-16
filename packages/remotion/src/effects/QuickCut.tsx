import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import type { QuickCutProps } from '../types';

/**
 * Fast cut transition: a brief flash to white or black,
 * then the new scene appears. Wraps children content.
 */
export const QuickCut: React.FC<QuickCutProps> = ({
  startFrame,
  durationInFrames,
  flashColor = '#FFFFFF',
  children,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) {
    return <>{children}</>;
  }

  // Flash peaks at 30% of the duration, then fades
  const peakFrame = Math.floor(durationInFrames * 0.3);

  const flashOpacity =
    localFrame <= peakFrame
      ? interpolate(localFrame, [0, peakFrame], [0, 1], {
          extrapolateRight: 'clamp',
        })
      : interpolate(localFrame, [peakFrame, durationInFrames], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // Content fades in after the flash peak
  const contentOpacity = interpolate(
    localFrame,
    [peakFrame, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ opacity: contentOpacity, width: '100%', height: '100%' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: flashColor,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
