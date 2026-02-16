import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const label = formData.get("label") as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing file or projectId" },
        { status: 400 },
      );
    }

    // Create uploads directory
    const uploadDir = join(process.cwd(), "uploads", projectId);
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "mp4";
    const cameraId = randomUUID();
    const filename = `${cameraId}.${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // In a full implementation, we'd also notify the FastAPI backend
    // about the uploaded file. For now, return the camera ID.

    return NextResponse.json({
      cameraId,
      filename,
      label: label || file.name,
      size: file.size,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
