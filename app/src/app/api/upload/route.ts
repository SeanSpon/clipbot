import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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
    const filename = `${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Count existing cameras for order
    const cameraCount = await prisma.camera.count({
      where: { projectId },
    });

    // Create camera record in DB
    const camera = await prisma.camera.create({
      data: {
        projectId,
        label: label || file.name,
        sourceFile: filepath,
        isDefault: cameraCount === 0,
        order: cameraCount,
      },
    });

    // Update project status and file info
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "uploaded",
        sourceName: file.name,
        fileSize: BigInt(file.size),
      },
    });

    return NextResponse.json({
      cameraId: camera.id,
      filename,
      label: camera.label,
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
