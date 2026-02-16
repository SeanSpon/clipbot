import { create } from "zustand";

export interface ExportSettings {
  format: "mp4" | "webm" | "gif";
  resolution: "1080p" | "720p" | "4k";
  fps: 30 | 60;
  quality: "draft" | "standard" | "high";
}

export type StylePreset =
  | "cinematic"
  | "podcast"
  | "vlog"
  | "shorts"
  | "documentary"
  | "raw";

interface EditorState {
  /* selection */
  selectedClipId: string | null;
  selectedPreset: StylePreset;
  isPlaying: boolean;
  currentTime: number;

  /* export */
  exportSettings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;

  /* ui state */
  showEffectPanel: boolean;
  showStylePicker: boolean;

  /* actions */
  selectClip: (clipId: string | null) => void;
  setPreset: (preset: StylePreset) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setExportSettings: (settings: Partial<ExportSettings>) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  toggleEffectPanel: () => void;
  toggleStylePicker: () => void;
  reset: () => void;
}

const defaultExportSettings: ExportSettings = {
  format: "mp4",
  resolution: "1080p",
  fps: 30,
  quality: "standard",
};

export const useEditorStore = create<EditorState>((set) => ({
  selectedClipId: null,
  selectedPreset: "cinematic",
  isPlaying: false,
  currentTime: 0,
  exportSettings: { ...defaultExportSettings },
  isExporting: false,
  exportProgress: 0,
  showEffectPanel: false,
  showStylePicker: false,

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setPreset: (preset) => set({ selectedPreset: preset }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),

  setExportSettings: (settings) =>
    set((s) => ({
      exportSettings: { ...s.exportSettings, ...settings },
    })),

  setExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  toggleEffectPanel: () => set((s) => ({ showEffectPanel: !s.showEffectPanel })),
  toggleStylePicker: () => set((s) => ({ showStylePicker: !s.showStylePicker })),

  reset: () =>
    set({
      selectedClipId: null,
      selectedPreset: "cinematic",
      isPlaying: false,
      currentTime: 0,
      exportSettings: { ...defaultExportSettings },
      isExporting: false,
      exportProgress: 0,
      showEffectPanel: false,
      showStylePicker: false,
    }),
}));
