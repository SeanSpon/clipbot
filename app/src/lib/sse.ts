export type SSEEvent =
  | { type: "status"; status: string; message: string }
  | { type: "transcript"; words: { word: string; start: number; end: number }[] }
  | { type: "clip_found"; clip: { id: string; title: string; score: number; startTime: number; endTime: number } }
  | { type: "progress"; stage: string; percent: number }
  | { type: "thinking"; message: string }
  | { type: "complete"; clipCount: number }
  | { type: "error"; message: string };

export interface SSEConnection {
  close: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function connectSSE(
  projectId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Event) => void,
): SSEConnection {
  const url = `${API}/api/projects/${projectId}/events`;
  const source = new EventSource(url);

  source.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as SSEEvent;
      onEvent(event);
    } catch {
      // ignore malformed events
    }
  };

  source.onerror = (e) => {
    onError?.(e);
  };

  return {
    close: () => source.close(),
  };
}
