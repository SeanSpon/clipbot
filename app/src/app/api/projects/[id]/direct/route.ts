import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Update project status to directing
    await prisma.project.update({
      where: { id },
      data: { status: "directing" },
    });

    // In production, this would call the Python FastAPI backend
    // to trigger WhisperX transcription + AI Director analysis.
    // For now, return acknowledgment.
    const backendUrl = process.env.BACKEND_API_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/projects/${id}/direct`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch {
        // Backend not available, continue with status update only
      }
    }

    return NextResponse.json({
      status: "directing",
      message: "AI Director triggered. Connect the Python backend for full processing.",
    });
  } catch (err) {
    console.error("POST /api/projects/[id]/direct error:", err);
    return NextResponse.json(
      { error: "Failed to trigger AI Director" },
      { status: 500 },
    );
  }
}
