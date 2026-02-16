import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      cameras: { orderBy: { order: "asc" } },
      _count: { select: { clips: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    status: project.status,
    cameras: project.cameras.map((c) => ({
      id: c.id,
      filename: c.sourceFile,
      label: c.label,
    })),
    clipCount: project._count.clips,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
    },
    include: {
      cameras: true,
      _count: { select: { clips: true } },
    },
  });

  return NextResponse.json({
    id: project.id,
    name: project.name,
    status: project.status,
    cameras: project.cameras,
    clipCount: project._count.clips,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
