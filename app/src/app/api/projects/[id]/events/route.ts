import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  // Try to proxy from Python backend if available
  const backendUrl = process.env.BACKEND_API_URL;

  const stream = new ReadableStream({
    async start(controller) {
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/projects/${id}/events`, {
            headers: { Accept: "text/event-stream" },
          });

          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })));
            }
            controller.close();
            return;
          }
        } catch {
          // Backend not available
        }
      }

      // Fallback: send a connected event and keep alive
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", projectId: id })}\n\n`),
      );

      // Send periodic keepalives for 30s then close
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (count > 30) {
          clearInterval(interval);
          controller.close();
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
