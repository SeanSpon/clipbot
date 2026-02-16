export type ClipStatus = "pending" | "approved" | "rejected" | "rendering" | "complete";

export interface Clip {
  id: string;
  projectId: string;
  title: string;
  status: ClipStatus;
  score: number;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  cameraId: string;
  shotListId: string;
  createdAt: string;
}
