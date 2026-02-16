// ──────────────────────────────────────────────
// Shot list schema — matches AI Director output
// ──────────────────────────────────────────────

export interface ZoomConfig {
  from: number;
  to: number;
  easing: 'slow' | 'fast' | 'linear' | 'spring';
}

export interface PanConfig {
  direction: 'left' | 'right';
  amount: number; // pixels
  easing: 'slow' | 'fast' | 'linear';
}

export interface TypographyConfig {
  text: string;
  style: 'kinetic-slam' | 'word-by-word' | 'glow-reveal' | 'bounce-in';
  enterAt: number; // timestamp in seconds
  exitAt: number;  // timestamp in seconds
  color?: string;
  fontSize?: number;
}

export interface BrollConfig {
  src: string;
  opacity?: number; // 0-1, default 0.6
  enterAt: number;
  exitAt: number;
}

export interface Scene {
  startTime: number; // seconds
  endTime: number;   // seconds
  camera: 'main' | 'broll' | 'screen';
  zoom?: ZoomConfig;
  pan?: PanConfig;
  typography?: TypographyConfig;
  broll?: BrollConfig;
  transition?: 'cut' | 'quick-cut' | 'fade' | 'none';
}

export interface CaptionConfig {
  style: CaptionStyle;
  emphasizeWords?: string[];
  fontSize?: number;
  color?: string;
}

export interface Clip {
  startTime: number;
  endTime: number;
  scenes: Scene[];
  captions: CaptionConfig;
  score: number;
}

export interface ShotList {
  title: string;
  mood: 'intense' | 'calm' | 'energetic' | 'dramatic' | 'playful' | 'serious';
  clips: Clip[];
}

// ──────────────────────────────────────────────
// Caption styles
// ──────────────────────────────────────────────

export type CaptionStyle = 'viral-popup' | 'clean-minimal' | 'bold-impact' | 'neon-glow';

export interface CaptionWord {
  text: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface CaptionSegment {
  words: CaptionWord[];
  startTime: number;
  endTime: number;
}

// ──────────────────────────────────────────────
// Preset types
// ──────────────────────────────────────────────

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  highlight: string;
}

export interface CaptionStyleConfig {
  style: CaptionStyle;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  textTransform: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  position: 'center' | 'bottom' | 'top';
  backgroundColor?: string;
  padding: number;
  borderRadius: number;
  shadow?: string;
  glowColor?: string;
  glowIntensity?: number;
}

export interface TypographyDefaults {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: string;
}

export interface TransitionDefaults {
  type: 'cut' | 'quick-cut' | 'fade' | 'none';
  durationFrames: number;
  flashColor?: string;
}

export interface Preset {
  name: string;
  captionStyle: CaptionStyleConfig;
  typographyDefaults: TypographyDefaults;
  transitionDefaults: TransitionDefaults;
  colorScheme: ColorScheme;
}

// ──────────────────────────────────────────────
// Effect prop types
// ──────────────────────────────────────────────

export interface BaseEffectProps {
  startFrame: number;
  durationInFrames: number;
}

export interface KineticSlamProps extends BaseEffectProps {
  text: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
}

export interface WordByWordProps extends BaseEffectProps {
  words: CaptionWord[];
  highlightColor?: string;
  fontSize?: number;
  style?: CaptionStyle;
}

export interface ZoomPushProps extends BaseEffectProps {
  from?: number;
  to?: number;
  easing?: 'slow' | 'fast' | 'linear' | 'spring';
  children: React.ReactNode;
}

export interface QuickCutProps extends BaseEffectProps {
  flashColor?: string;
  children: React.ReactNode;
}

export interface PanSweepProps extends BaseEffectProps {
  direction?: 'left' | 'right';
  amount?: number;
  children: React.ReactNode;
}

export interface GlowRevealProps extends BaseEffectProps {
  text: string;
  color?: string;
  glowColor?: string;
  fontSize?: number;
}

export interface BounceInProps extends BaseEffectProps {
  text: string;
  color?: string;
  fontSize?: number;
}

export interface BrollOverlayProps extends BaseEffectProps {
  src: string;
  opacity?: number;
}

// ──────────────────────────────────────────────
// Composition props
// ──────────────────────────────────────────────

export interface ClipCompositionProps {
  shotList: ShotList;
  videoSrc: string;
  fps: number;
  captions?: CaptionSegment[];
  preset?: Preset;
}

export interface CaptionOverlayProps {
  segments: CaptionSegment[];
  style: CaptionStyle;
  emphasizeWords?: string[];
  startFrame: number;
  durationInFrames: number;
  fontSize?: number;
  color?: string;
}
