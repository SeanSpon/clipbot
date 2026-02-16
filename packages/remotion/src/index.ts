// Compositions
export { ClipComposition } from './compositions/ClipComposition';
export { CaptionOverlay } from './compositions/CaptionOverlay';
export { RemotionRoot } from './Root';

// Effects
export {
  KineticSlam,
  WordByWord,
  ZoomPush,
  QuickCut,
  PanSweep,
  GlowReveal,
  BounceIn,
  BrollOverlay,
} from './effects';

// Presets
export {
  viralPopup,
  cleanMinimal,
  boldImpact,
  neonGlow,
  presets,
  getPreset,
} from './presets';

// Utilities
export {
  secondsToFrames,
  framesToSeconds,
  durationInFrames,
  clamp,
  getEasing,
  getProgress,
  isInRange,
} from './lib/timing';

export { springConfigs } from './lib/spring-configs';
export type { SpringConfigName } from './lib/spring-configs';

export {
  parseTranscriptToWords,
  groupWordsIntoSegments,
  segmentTimedWords,
  parseAndSegment,
  getActiveWord,
  getActiveSegment,
} from './lib/caption-parser';

// Types
export type {
  ShotList,
  Clip,
  Scene,
  ZoomConfig,
  PanConfig,
  TypographyConfig,
  BrollConfig,
  CaptionConfig,
  CaptionStyle,
  CaptionWord,
  CaptionSegment,
  Preset,
  ColorScheme,
  CaptionStyleConfig,
  TypographyDefaults,
  TransitionDefaults,
  BaseEffectProps,
  KineticSlamProps,
  WordByWordProps,
  ZoomPushProps,
  QuickCutProps,
  PanSweepProps,
  GlowRevealProps,
  BounceInProps,
  BrollOverlayProps,
  ClipCompositionProps,
  CaptionOverlayProps,
} from './types';
