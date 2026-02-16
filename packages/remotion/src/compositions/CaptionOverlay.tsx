import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import type {
  CaptionOverlayProps,
  CaptionSegment,
  CaptionWord,
  CaptionStyle,
} from '../types';
import { framesToSeconds } from '../lib/timing';
import { springConfigs } from '../lib/spring-configs';
import { getActiveSegment, getActiveWord } from '../lib/caption-parser';

/**
 * Animated word-by-word caption overlay.
 * Highlights the currently-spoken word and supports
 * four distinct visual styles.
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  segments,
  style,
  emphasizeWords = [],
  startFrame,
  durationInFrames,
  fontSize: fontSizeOverride,
  color: colorOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= durationInFrames) return null;
  if (segments.length === 0) return null;

  const baseTime = segments[0].startTime;
  const currentTime = baseTime + framesToSeconds(localFrame, fps);

  const activeSegment = getActiveSegment(segments, currentTime);
  if (!activeSegment) return null;

  const activeWord = getActiveWord(activeSegment.words, currentTime);

  const emphasizeSet = new Set(
    emphasizeWords.map((w) => w.toLowerCase()),
  );

  return (
    <div style={getContainerStyle(style)}>
      <div style={getBackdropStyle(style)}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: getGap(style),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {activeSegment.words.map((word, i) => (
            <CaptionWordSpan
              key={`${word.text}-${i}`}
              word={word}
              isActive={activeWord === word}
              isEmphasized={emphasizeSet.has(word.text.toLowerCase())}
              style={style}
              fontSize={fontSizeOverride}
              color={colorOverride}
              frame={localFrame}
              fps={fps}
              segmentStartTime={activeSegment.startTime}
              baseTime={baseTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Individual word span ──────────────────────────

interface CaptionWordSpanProps {
  word: CaptionWord;
  isActive: boolean;
  isEmphasized: boolean;
  style: CaptionStyle;
  fontSize?: number;
  color?: string;
  frame: number;
  fps: number;
  segmentStartTime: number;
  baseTime: number;
}

const CaptionWordSpan: React.FC<CaptionWordSpanProps> = ({
  word,
  isActive,
  isEmphasized,
  style: captionStyle,
  fontSize: fontSizeOverride,
  color: colorOverride,
  frame,
  fps,
  segmentStartTime,
  baseTime,
}) => {
  const wordStartFrame = Math.round((word.startTime - baseTime) * fps);
  const localWordFrame = frame - wordStartFrame;

  // Word hasn't appeared yet
  const hasAppeared = frame >= wordStartFrame;

  const pop = hasAppeared
    ? spring({
        frame: Math.max(0, localWordFrame),
        fps,
        config: springConfigs.snappy,
      })
    : 0;

  const baseStyles = getWordBaseStyle(captionStyle, fontSizeOverride);

  if (!hasAppeared) {
    return (
      <span style={{ ...baseStyles, opacity: 0 }}>{word.text}</span>
    );
  }

  const scale = isActive
    ? interpolate(pop, [0, 1], [0.6, 1.2])
    : interpolate(pop, [0, 1], [0.6, 1]);
  const opacity = interpolate(pop, [0, 1], [0, 1]);

  const dynamicStyles = getWordDynamicStyle(
    captionStyle,
    isActive,
    isEmphasized,
    colorOverride,
  );

  return (
    <span
      style={{
        ...baseStyles,
        ...dynamicStyles,
        opacity,
        transform: `scale(${scale})`,
        display: 'inline-block',
      }}
    >
      {word.text}
    </span>
  );
};

// ── Style helpers ─────────────────────────────────

function getContainerStyle(style: CaptionStyle): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  };

  switch (style) {
    case 'viral-popup':
      return { ...base, top: '50%', transform: 'translateY(-50%)' };
    case 'clean-minimal':
      return { ...base, bottom: '60px' };
    case 'bold-impact':
      return { ...base, bottom: '0px' };
    case 'neon-glow':
      return { ...base, top: '50%', transform: 'translateY(-50%)' };
    default:
      return { ...base, bottom: '60px' };
  }
}

function getBackdropStyle(style: CaptionStyle): React.CSSProperties {
  switch (style) {
    case 'bold-impact':
      return {
        backgroundColor: 'rgba(200, 10, 10, 0.85)',
        padding: '14px 40px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      };
    case 'clean-minimal':
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 24px',
        borderRadius: '8px',
      };
    default:
      return {
        padding: '10px 20px',
      };
  }
}

function getGap(style: CaptionStyle): string {
  switch (style) {
    case 'viral-popup':
      return '6px 14px';
    case 'bold-impact':
      return '4px 12px';
    default:
      return '4px 8px';
  }
}

function getWordBaseStyle(
  style: CaptionStyle,
  fontSizeOverride?: number,
): React.CSSProperties {
  const defaults: Record<CaptionStyle, React.CSSProperties> = {
    'viral-popup': {
      fontSize: fontSizeOverride ?? 64,
      fontWeight: 900,
      fontFamily: 'Inter, Arial, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    'clean-minimal': {
      fontSize: fontSizeOverride ?? 36,
      fontWeight: 500,
      fontFamily: 'Inter, Helvetica, sans-serif',
      textTransform: 'none',
    },
    'bold-impact': {
      fontSize: fontSizeOverride ?? 44,
      fontWeight: 800,
      fontFamily: 'Inter, Arial Black, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    },
    'neon-glow': {
      fontSize: fontSizeOverride ?? 48,
      fontWeight: 700,
      fontFamily: 'Inter, Arial, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
  };

  return defaults[style] ?? defaults['clean-minimal'];
}

function getWordDynamicStyle(
  style: CaptionStyle,
  isActive: boolean,
  isEmphasized: boolean,
  colorOverride?: string,
): React.CSSProperties {
  const activeColor =
    colorOverride ?? getDefaultHighlightColor(style);
  const inactiveColor = '#FFFFFF';

  const color = isActive || isEmphasized ? activeColor : inactiveColor;

  switch (style) {
    case 'viral-popup':
      return {
        color,
        textShadow: isActive
          ? `0 0 20px ${activeColor}80, 0 4px 15px rgba(0,0,0,0.6)`
          : '0 2px 10px rgba(0,0,0,0.5)',
      };
    case 'clean-minimal':
      return {
        color: isActive ? activeColor : 'rgba(255,255,255,0.9)',
        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
      };
    case 'bold-impact':
      return {
        color: isActive || isEmphasized ? '#FFFF00' : '#FFFFFF',
        textShadow: '0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'neon-glow':
      return {
        color,
        textShadow: isActive
          ? `0 0 15px ${activeColor}, 0 0 30px ${activeColor}60, 0 0 45px ${activeColor}30`
          : `0 0 8px ${activeColor}40`,
      };
    default:
      return { color };
  }
}

function getDefaultHighlightColor(style: CaptionStyle): string {
  switch (style) {
    case 'viral-popup':
      return '#FFD700';
    case 'clean-minimal':
      return '#007AFF';
    case 'bold-impact':
      return '#FFFF00';
    case 'neon-glow':
      return '#00BFFF';
    default:
      return '#FFD700';
  }
}
