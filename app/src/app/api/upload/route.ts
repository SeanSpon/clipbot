import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

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

    // Upload to Vercel Blob
    const ext = file.name.split(".").pop() || "mp4";
    const filename = `${projectId}/${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type || "video/mp4",
    });

    // Count existing cameras for order
    const cameraCount = await prisma.camera.count({
      where: { projectId },
    });

    // Create camera record in DB
    const camera = await prisma.camera.create({
      data: {
        projectId,
        label: label || file.name,
        sourceFile: blob.url,
        isDefault: cameraCount === 0,
        order: cameraCount,
      },
    });

    // Update project status and file info
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "uploaded",
        sourceFile: blob.url,
        sourceName: file.name,
        fileSize: BigInt(file.size),
      },
    });

    return NextResponse.json({
      cameraId: camera.id,
      filename,
      url: blob.url,
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
