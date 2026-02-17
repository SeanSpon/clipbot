import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // clientPayload contains projectId + label from the client
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-msvideo",
            "video/x-matroska",
            "audio/mpeg",
            "audio/wav",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const { projectId, label, fileName, fileSize } = JSON.parse(
            tokenPayload || "{}",
          );

          if (!projectId) return;

          const cameraCount = await prisma.camera.count({
            where: { projectId },
          });

          await prisma.camera.create({
            data: {
              projectId,
              label: label || fileName || "Camera",
              sourceFile: blob.url,
              isDefault: cameraCount === 0,
              order: cameraCount,
            },
          });

          await prisma.project.update({
            where: { id: projectId },
            data: {
              status: "uploaded",
              sourceFile: blob.url,
              sourceName: fileName,
              fileSize: fileSize ? BigInt(fileSize) : null,
            },
          });
        } catch (dbErr) {
          console.error("onUploadCompleted DB error:", dbErr);
          // Don't throw — blob is already stored, DB can be fixed later
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
