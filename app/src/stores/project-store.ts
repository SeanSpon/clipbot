import { create } from "zustand";
import type { Project, ProjectStatus, Clip } from "@/types";
import type { SSEEvent, SSEConnection } from "@/lib/sse";
import { connectSSE } from "@/lib/sse";

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

interface ProjectState {
  /* data */
  project: Project | null;
  clips: Clip[];
  transcript: TranscriptWord[];
  thinkingMessage: string;
  progress: { stage: string; percent: number };

  /* sse */
  sseConnection: SSEConnection | null;

  /* actions */
  setProject: (project: Project | null) => void;
  setStatus: (status: ProjectStatus) => void;
  setClips: (clips: Clip[]) => void;
  addClip: (clip: Clip) => void;
  appendTranscript: (words: TranscriptWord[]) => void;
  setThinking: (message: string) => void;
  setProgress: (stage: string, percent: number) => void;
  connectEvents: (projectId: string) => void;
  disconnectEvents: () => void;
  reset: () => void;
}

const initialState = {
  project: null,
  clips: [],
  transcript: [],
  thinkingMessage: "",
  progress: { stage: "", percent: 0 },
  sseConnection: null,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  setProject: (project) => set({ project }),

  setStatus: (status) =>
    set((s) => ({
      project: s.project ? { ...s.project, status } : null,
    })),

  setClips: (clips) => set({ clips }),

  addClip: (clip) =>
    set((s) => ({
      clips: [...s.clips, clip],
    })),

  appendTranscript: (words) =>
    set((s) => ({
      transcript: [...s.transcript, ...words],
    })),

  setThinking: (message) => set({ thinkingMessage: message }),

  setProgress: (stage, percent) => set({ progress: { stage, percent } }),

  connectEvents: (projectId) => {
    const { sseConnection } = get();
    if (sseConnection) sseConnection.close();

    const conn = connectSSE(projectId, (event: SSEEvent) => {
      switch (event.type) {
        case "status":
          get().setStatus(event.status as ProjectStatus);
          break;
        case "transcript":
          get().appendTranscript(event.words);
          break;
        case "clip_found":
          get().addClip({
            id: event.clip.id,
            projectId,
            title: event.clip.title,
            status: "pending",
            score: event.clip.score,
            startTime: event.clip.startTime,
            endTime: event.clip.endTime,
            duration: event.clip.endTime - event.clip.startTime,
            cameraId: "",
            shotListId: "",
            createdAt: new Date().toISOString(),
          });
          break;
        case "progress":
          get().setProgress(event.stage, event.percent);
          break;
        case "thinking":
          get().setThinking(event.message);
          break;
        case "complete":
          get().setStatus("directed");
          break;
        case "error":
          get().setStatus("error");
          break;
      }
    });

    set({ sseConnection: conn });
  },

  disconnectEvents: () => {
    const { sseConnection } = get();
    if (sseConnection) {
      sseConnection.close();
      set({ sseConnection: null });
    }
  },

  reset: () => {
    const { sseConnection } = get();
    if (sseConnection) sseConnection.close();
    set(initialState);
  },
}));
