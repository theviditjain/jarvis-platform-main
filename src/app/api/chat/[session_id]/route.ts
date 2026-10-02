import { NextRequest } from "next/server";
import { runtimeClient } from "@/lib/api/jarvis-runtime";

/**
 * GET /api/chat/[session_id]
 * Proxies the SSE stream from Jarvis runtime to the browser.
 * This keeps the backend URL hidden from the client.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const { session_id } = await params;

  try {
    const upstream = await runtimeClient.streamChat(session_id);

    if (!upstream.ok || !upstream.body) {
      return new Response(
        JSON.stringify({ error: `Upstream ${upstream.status}` }),
        { status: upstream.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pipe the upstream SSE body straight through to the browser
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stream error";
    return new Response(`data: {"type":"error","data":{"message":"${msg}"}}\n\n`, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
