import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { clips: true } } },
    });

    return NextResponse.json(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        clipCount: p._count.clips,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /api/projects error:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || "Untitled Project";

    const project = await prisma.project.create({
      data: { name },
      include: {
        cameras: true,
        _count: { select: { clips: true } },
      },
    });

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        status: project.status,
        cameras: project.cameras,
        clipCount: project._count.clips,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
