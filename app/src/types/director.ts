export interface Typography {
  font: string;
  weight: number;
  size: number;
  color: string;
  position: "top" | "center" | "bottom" | "lower-third";
  animation: "fade" | "typewriter" | "slide-up" | "glitch";
}

export interface Camera {
  angle: string;
  startTc: string;
  endTc: string;
}

export interface Transition {
  type: "cut" | "dissolve" | "whip-pan" | "j-cut" | "l-cut" | "zoom";
  duration: number;
}

export interface BrollCue {
  source: string;
  startTc: string;
  endTc: string;
  opacity: number;
  scale: number;
}

export interface CaptionStyle {
  preset: "minimal" | "bold" | "subtitle" | "hormozi" | "cinematic";
  primaryColor: string;
  highlightColor: string;
  backgroundColor: string;
  position: "top" | "center" | "bottom";
}

export interface Scene {
  id: string;
  title: string;
  startTc: string;
  endTc: string;
  camera: Camera;
  transition: Transition;
  typography?: Typography;
  broll?: BrollCue[];
  captionStyle: CaptionStyle;
  hook?: string;
  pacing: "slow" | "medium" | "fast" | "frenetic";
  energy: number;
}

export interface ShotList {
  id: string;
  projectId: string;
  version: number;
  scenes: Scene[];
  totalDuration: number;
  createdAt: string;
}
