import type { Project, ProjectListItem, Clip, ShotList } from "@/types";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, body);
  }

  return res.json();
}

/* ---- Projects ---- */

export async function listProjects(): Promise<ProjectListItem[]> {
  return request("/api/projects");
}

export async function getProject(id: string): Promise<Project> {
  return request(`/api/projects/${id}`);
}

export async function createProject(name: string): Promise<Project> {
  return request("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, "name" | "status">>,
): Promise<Project> {
  return request(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/api/projects/${id}`, { method: "DELETE" });
}

/* ---- Upload ---- */

export async function uploadFile(
  projectId: string,
  file: File,
  label: string,
  onProgress?: (percent: number) => void,
): Promise<{ url: string }> {
  const { upload } = await import("@vercel/blob/client");

  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    clientPayload: JSON.stringify({
      projectId,
      label,
      fileName: file.name,
      fileSize: file.size,
    }),
    onUploadProgress: (e) => {
      if (onProgress) {
        onProgress(Math.round(e.percentage));
      }
    },
  });

  return { url: blob.url };
}

/* ---- Director ---- */

export async function triggerDirector(projectId: string): Promise<void> {
  await request(`/api/projects/${projectId}/direct`, { method: "POST" });
}

export async function getShotList(projectId: string): Promise<ShotList> {
  return request(`/api/projects/${projectId}/shot-list`);
}

/* ---- Clips ---- */

export async function getClips(projectId: string): Promise<Clip[]> {
  return request(`/api/projects/${projectId}/clips`);
}

export async function updateClip(
  projectId: string,
  clipId: string,
  data: Partial<Pick<Clip, "status" | "title">>,
): Promise<Clip> {
  return request(`/api/projects/${projectId}/clips/${clipId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/* ---- Render ---- */

export async function triggerRender(
  projectId: string,
  clipIds: string[],
  preset?: string,
): Promise<{ jobId: string }> {
  return request(`/api/projects/${projectId}/render`, {
    method: "POST",
    body: JSON.stringify({ clipIds, preset }),
  });
}
