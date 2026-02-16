import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  // In production, this would call the Python backend or
  // trigger Remotion Lambda rendering. For now, return a job ID.
  const backendUrl = process.env.BACKEND_API_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/projects/${id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend not available
    }
  }

  return NextResponse.json({
    jobId: `render-${id}-${Date.now()}`,
    status: "queued",
    message: "Render queued. Connect the Python backend for actual rendering.",
  });
}
