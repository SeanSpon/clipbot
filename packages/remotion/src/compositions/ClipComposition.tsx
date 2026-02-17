import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import type {
  ClipCompositionProps,
  Scene,
  ShotList,
  CaptionSegment,
  Preset,
} from '../types';
import {
  secondsToFrames,
  durationInFrames as calcDuration,
} from '../lib/timing';
import { viralPopup } from '../presets/viral-popup';

// Effects
import { KineticSlam } from '../effects/KineticSlam';
import { WordByWord } from '../effects/WordByWord';
import { ZoomPush } from '../effects/ZoomPush';
import { QuickCut } from '../effects/QuickCut';
import { PanSweep } from '../effects/PanSweep';
import { GlowReveal } from '../effects/GlowReveal';
import { BounceIn } from '../effects/BounceIn';
import { BrollOverlay } from '../effects/BrollOverlay';
import { CaptionOverlay } from './CaptionOverlay';

/**
 * Main composition that reads an AI-generated shot list
 * and orchestrates all video effects, transitions,
 * typography, B-roll overlays, and captions.
 */
export const ClipComposition: React.FC<ClipCompositionProps> = ({
  shotList,
  videoSrc,
  fps: fpsProp,
  captions = [],
  preset = viralPopup,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const effectiveFps = fpsProp || fps;

  // We render the first clip from the shot list
  // (multi-clip support can iterate over shotList.clips)
  const clip = shotList.clips[0];
  if (!clip) return <AbsoluteFill style={{ backgroundColor: '#000' }} />;

  const clipStartFrame = secondsToFrames(clip.startTime, effectiveFps);
  const clipDurationFrames = calcDuration(
    clip.startTime,
    clip.endTime,
    effectiveFps,
  );

  // Compute dynamic objectPosition by interpolating focusX/focusY across scenes
  const currentSceneIndex = clip.scenes.findIndex((scene, i) => {
    const sceneStart = secondsToFrames(scene.startTime - clip.startTime, effectiveFps);
    const sceneDuration = calcDuration(scene.startTime, scene.endTime, effectiveFps);
    return frame >= sceneStart && frame < sceneStart + sceneDuration;
  });
  const activeScene = currentSceneIndex >= 0 ? clip.scenes[currentSceneIndex] : clip.scenes[0];
  const nextScene = currentSceneIndex >= 0 && currentSceneIndex < clip.scenes.length - 1
    ? clip.scenes[currentSceneIndex + 1]
    : null;

  // Current scene focus (default to center)
  const currentFocusX = activeScene?.focusX ?? 0.5;
  const currentFocusY = activeScene?.focusY ?? 0.5;

  // Smooth interpolation toward next scene's focus near scene boundary
  let focusX = currentFocusX;
  let focusY = currentFocusY;
  if (nextScene && activeScene) {
    const sceneStart = secondsToFrames(activeScene.startTime - clip.startTime, effectiveFps);
    const sceneDuration = calcDuration(activeScene.startTime, activeScene.endTime, effectiveFps);
    const localFrame = frame - sceneStart;
    const transitionFrames = Math.min(Math.round(effectiveFps * 0.5), Math.floor(sceneDuration / 3));
    const transitionStart = sceneDuration - transitionFrames;

    if (localFrame >= transitionStart) {
      const nextFocusX = nextScene.focusX ?? 0.5;
      const nextFocusY = nextScene.focusY ?? 0.5;
      const t = interpolate(localFrame, [transitionStart, sceneDuration - 1], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      focusX = currentFocusX + (nextFocusX - currentFocusX) * t;
      focusY = currentFocusY + (nextFocusY - currentFocusY) * t;
    }
  }

  const objectPosition = `${(focusX * 100).toFixed(1)}% ${(focusY * 100).toFixed(1)}%`;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Base video layer */}
      <Sequence from={0} durationInFrames={clipDurationFrames}>
        <OffthreadVideo
          src={videoSrc}
          startFrom={clipStartFrame}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition }}
        />
      </Sequence>

      {/* Scene layers: zoom, pan, transitions, typography, b-roll */}
      {clip.scenes.map((scene, index) => {
        const sceneStart = secondsToFrames(
          scene.startTime - clip.startTime,
          effectiveFps,
        );
        const sceneDuration = calcDuration(
          scene.startTime,
          scene.endTime,
          effectiveFps,
        );

        return (
          <Sequence
            key={`scene-${index}`}
            from={sceneStart}
            durationInFrames={sceneDuration}
          >
            <SceneRenderer
              scene={scene}
              sceneIndex={index}
              sceneDuration={sceneDuration}
              clipStartTime={clip.startTime}
              fps={effectiveFps}
              preset={preset}
              videoSrc={videoSrc}
            />
          </Sequence>
        );
      })}

      {/* Caption overlay */}
      {captions.length > 0 && (
        <Sequence from={0} durationInFrames={clipDurationFrames}>
          <CaptionOverlay
            segments={captions}
            style={clip.captions.style}
            emphasizeWords={clip.captions.emphasizeWords}
            startFrame={0}
            durationInFrames={clipDurationFrames}
            fontSize={clip.captions.fontSize}
            color={clip.captions.color}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// ── Scene renderer ────────────────────────────────

interface SceneRendererProps {
  scene: Scene;
  sceneIndex: number;
  sceneDuration: number;
  clipStartTime: number;
  fps: number;
  preset: Preset;
  videoSrc: string;
}

const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  sceneIndex,
  sceneDuration,
  clipStartTime,
  fps,
  preset,
  videoSrc,
}) => {
  const frame = useCurrentFrame();

  // Compute transformOrigin from scene focus point
  const sceneFocusX = scene.focusX ?? 0.5;
  const sceneFocusY = scene.focusY ?? 0.5;
  const sceneTransformOrigin = `${(sceneFocusX * 100).toFixed(1)}% ${(sceneFocusY * 100).toFixed(1)}%`;

  // Wrap content in camera effects (zoom / pan)
  let content: React.ReactNode = <AbsoluteFill />;

  // Apply zoom if configured
  if (scene.zoom) {
    content = (
      <ZoomPush
        startFrame={0}
        durationInFrames={sceneDuration}
        from={scene.zoom.from}
        to={scene.zoom.to}
        easing={scene.zoom.easing}
        transformOrigin={sceneTransformOrigin}
      >
        <AbsoluteFill />
      </ZoomPush>
    );
  }

  // Apply pan if configured
  if (scene.pan) {
    content = (
      <PanSweep
        startFrame={0}
        durationInFrames={sceneDuration}
        direction={scene.pan.direction}
        amount={scene.pan.amount}
      >
        {content}
      </PanSweep>
    );
  }

  // Apply transition at scene start
  if (scene.transition === 'quick-cut') {
    const transitionDuration =
      preset.transitionDefaults.durationFrames;
    content = (
      <>
        <QuickCut
          startFrame={0}
          durationInFrames={transitionDuration}
          flashColor={preset.transitionDefaults.flashColor}
        >
          {content}
        </QuickCut>
        {/* After transition, show content normally */}
        {frame >= transitionDuration && content}
      </>
    );
  } else if (scene.transition === 'fade') {
    const fadeDuration = preset.transitionDefaults.durationFrames;
    const fadeOpacity = interpolate(frame, [0, fadeDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    content = <div style={{ opacity: fadeOpacity }}>{content}</div>;
  }

  return (
    <AbsoluteFill>
      {/* Camera effects layer */}
      {content}

      {/* Typography layer */}
      {scene.typography && (
        <TypographyRenderer
          typography={scene.typography}
          sceneStartTime={scene.startTime}
          fps={fps}
          preset={preset}
        />
      )}

      {/* B-roll layer */}
      {scene.broll && (
        <BrollOverlay
          src={scene.broll.src}
          startFrame={secondsToFrames(
            scene.broll.enterAt - scene.startTime,
            fps,
          )}
          durationInFrames={calcDuration(
            scene.broll.enterAt,
            scene.broll.exitAt,
            fps,
          )}
          opacity={scene.broll.opacity}
        />
      )}
    </AbsoluteFill>
  );
};

// ── Typography renderer ───────────────────────────

interface TypographyRendererProps {
  typography: NonNullable<Scene['typography']>;
  sceneStartTime: number;
  fps: number;
  preset: Preset;
}

const TypographyRenderer: React.FC<TypographyRendererProps> = ({
  typography,
  sceneStartTime,
  fps,
  preset,
}) => {
  const enterFrame = secondsToFrames(
    typography.enterAt - sceneStartTime,
    fps,
  );
  const duration = calcDuration(
    typography.enterAt,
    typography.exitAt,
    fps,
  );

  const color =
    typography.color ?? preset.typographyDefaults.color;
  const fontSize =
    typography.fontSize ?? preset.typographyDefaults.fontSize;

  switch (typography.style) {
    case 'kinetic-slam':
      return (
        <KineticSlam
          text={typography.text}
          startFrame={enterFrame}
          durationInFrames={duration}
          color={color}
          fontSize={fontSize}
        />
      );

    case 'word-by-word':
      // Split text into pseudo-timed words across the duration
      const words = typography.text.split(/\s+/).map((text, i, arr) => {
        const wordDuration =
          (typography.exitAt - typography.enterAt) / arr.length;
        return {
          text,
          startTime: typography.enterAt + i * wordDuration,
          endTime: typography.enterAt + (i + 1) * wordDuration,
        };
      });
      return (
        <WordByWord
          words={words}
          startFrame={enterFrame}
          durationInFrames={duration}
          highlightColor={preset.colorScheme.highlight}
          fontSize={fontSize}
        />
      );

    case 'glow-reveal':
      return (
        <GlowReveal
          text={typography.text}
          startFrame={enterFrame}
          durationInFrames={duration}
          color={color}
          glowColor={preset.colorScheme.accent}
          fontSize={fontSize}
        />
      );

    case 'bounce-in':
      return (
        <BounceIn
          text={typography.text}
          startFrame={enterFrame}
          durationInFrames={duration}
          color={color}
          fontSize={fontSize}
        />
      );

    default:
      // Fallback: kinetic slam
      return (
        <KineticSlam
          text={typography.text}
          startFrame={enterFrame}
          durationInFrames={duration}
          color={color}
          fontSize={fontSize}
        />
      );
  }
};
