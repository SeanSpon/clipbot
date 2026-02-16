import React from 'react';
import { Composition } from 'remotion';
import { ClipComposition } from './compositions/ClipComposition';
import type { ClipCompositionProps } from './types';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920; // 9:16 vertical video

// Default empty shot list for the Remotion Studio preview
const defaultProps: ClipCompositionProps = {
  shotList: {
    title: 'Preview',
    mood: 'energetic',
    clips: [
      {
        startTime: 0,
        endTime: 30,
        scenes: [
          {
            startTime: 0,
            endTime: 10,
            camera: 'main',
            zoom: { from: 1.0, to: 1.1, easing: 'slow' },
            typography: {
              text: 'CLIPBOT PREVIEW',
              style: 'kinetic-slam',
              enterAt: 1,
              exitAt: 5,
            },
          },
          {
            startTime: 10,
            endTime: 20,
            camera: 'main',
            typography: {
              text: 'Word by word demo',
              style: 'word-by-word',
              enterAt: 11,
              exitAt: 18,
            },
          },
          {
            startTime: 20,
            endTime: 30,
            camera: 'main',
            typography: {
              text: 'GLOW REVEAL',
              style: 'glow-reveal',
              enterAt: 21,
              exitAt: 28,
            },
          },
        ],
        captions: { style: 'viral-popup', emphasizeWords: ['CLIPBOT'] },
        score: 95,
      },
    ],
  },
  videoSrc: '',
  fps: FPS,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClipComposition"
        component={ClipComposition}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultProps}
      />

      <Composition
        id="ClipComposition-Landscape"
        component={ClipComposition}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};
