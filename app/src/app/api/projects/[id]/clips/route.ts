import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clips = await prisma.clip.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(
      clips.map((c) => ({
        id: c.id,
        projectId: c.projectId,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.duration,
        score: c.score,
        shotList: c.shotList,
        transcript: c.transcript,
        mood: c.mood,
        status: c.status,
        order: c.order,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /api/projects/[id]/clips error:", err);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 },
    );
  }
}
