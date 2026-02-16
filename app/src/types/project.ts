export type ProjectStatus =
  | "uploading"
  | "uploaded"
  | "transcribing"
  | "directing"
  | "directed"
  | "rendering"
  | "complete"
  | "error";

export interface CameraAngle {
  id: string;
  filename: string;
  label: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  cameras: CameraAngle[];
  clipCount: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  status: ProjectStatus;
  clipCount: number;
  createdAt: string;
}
