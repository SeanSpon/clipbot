import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import type { WordByWordProps, CaptionWord } from '../types';
import { secondsToFrames } from '../lib/timing';
import { springConfigs } from '../lib/spring-configs';

/**
 * TikTok-style word-by-word reveal. Each word pops in at its
 * designated time, with the currently-active word highlighted.
 */
export const WordByWord: React.FC<WordByWordProps> = ({
  words,
  startFrame,
  durationInFrames,
  highlightColor = '#FFD700',
  fontSize = 56,
  style = 'viral-popup',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  const currentTimeSec = localFrame / fps;

  // Find the segment-relative start time offset
  const baseTime = words.length > 0 ? words[0].startTime : 0;

  const getWordStyle = (word: CaptionWord, index: number) => {
    const wordStart = secondsToFrames(word.startTime - baseTime, fps);
    const wordEnd = secondsToFrames(word.endTime - baseTime, fps);
    const relativeTime = currentTimeSec + baseTime;
    const isActive =
      relativeTime >= word.startTime && relativeTime < word.endTime;
    const hasAppeared = localFrame >= wordStart;

    if (!hasAppeared) {
      return { opacity: 0, transform: 'scale(0.5) translateY(10px)' };
    }

    const appearProgress = spring({
      frame: localFrame - wordStart,
      fps,
      config: springConfigs.snappy,
    });

    const scale = isActive
      ? interpolate(appearProgress, [0, 1], [0.5, 1.15])
      : interpolate(appearProgress, [0, 1], [0.5, 1]);

    const translateY = interpolate(appearProgress, [0, 1], [10, 0]);
    const opacity = interpolate(appearProgress, [0, 1], [0, 1]);

    return {
      opacity,
      transform: `scale(${scale}) translateY(${translateY}px)`,
      color: isActive ? highlightColor : '#FFFFFF',
      textShadow: isActive
        ? `0 0 20px ${highlightColor}80, 0 2px 10px rgba(0,0,0,0.6)`
        : '0 2px 10px rgba(0,0,0,0.5)',
    };
  };

  const containerStyle = getContainerStyle(style);

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 12px',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: '80%',
        }}
      >
        {words.map((word, i) => {
          const wordStyle = getWordStyle(word, i);
          return (
            <span
              key={`${word.text}-${i}`}
              style={{
                fontSize,
                fontWeight: 800,
                fontFamily: 'Inter, Arial, sans-serif',
                display: 'inline-block',
                transition: 'color 0.1s',
                ...wordStyle,
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

function getContainerStyle(
  style: string,
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  };

  switch (style) {
    case 'viral-popup':
      return { ...base, top: '50%', transform: 'translateY(-50%)' };
    case 'clean-minimal':
      return { ...base, bottom: '60px' };
    case 'bold-impact':
      return {
        ...base,
        bottom: '40px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '16px 32px',
      };
    case 'neon-glow':
      return { ...base, top: '50%', transform: 'translateY(-50%)' };
    default:
      return { ...base, bottom: '60px' };
  }
}
