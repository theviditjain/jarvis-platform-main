/**
 * API client for Jarvis Runtime (Port 8000).
 * Used ONLY in Next.js API route handlers (server-side BFF).
 * Never import this in React components.
 */
import type { ChatRequest, ChatSessionResponse } from "@/types";

const BASE = process.env.JARVIS_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`jarvis-runtime ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const runtimeClient = {
  /** POST /api/v1/chat/stream — initiate SSE chat session */
  initChat: (req: ChatRequest) =>
    request<ChatSessionResponse>("/api/v1/chat/stream", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  /**
   * GET /api/v1/chat/stream/{session_id} — returns a raw Response
   * that the BFF pipes back as SSE to the browser.
   */
  streamChat: (sessionId: string): Promise<Response> =>
    fetch(`${BASE}/api/v1/chat/stream/${sessionId}`, {
      headers: { Accept: "text/event-stream" },
    }),

  /** POST /api/v1/chat/complete — blocking (non-streaming) chat */
  completeChat: (req: ChatRequest) =>
    request<{ answer: string; citations: unknown[] }>("/api/v1/chat/complete", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  /** POST /api/v1/retrieval/search */
  search: (req: object) =>
    request<unknown>("/api/v1/retrieval/search", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  /** GET /api/v1/retrieval/node/{node_id} */
  getNode: (nodeId: string) =>
    request<unknown>(`/api/v1/retrieval/node/${nodeId}`),

  /** GET /api/v1/health/ready */
  healthReady: () =>
    request<{ status: string; neo4j: boolean; milvus: boolean; openai: boolean }>(
      "/api/v1/health/ready"
    ),
};
