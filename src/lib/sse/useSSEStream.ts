"use client";
/**
 * useSSEStream — React hook for consuming a Server-Sent Events stream.
 *
 * Usage:
 *   const { messages, isStreaming, error, startStream } = useSSEStream();
 *   startStream("/api/chat/my-session-id");
 */
import { useCallback, useRef, useState } from "react";
import type { SSEEvent, ChatMessage } from "@/types";

function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith("data: ")) return null;
  try {
    return JSON.parse(line.slice(6)) as SSEEvent;
  } catch {
    return null;
  }
}

export function useSSEStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Append a user message to the list
  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  /**
   * Start streaming from a BFF SSE endpoint.
   * url — e.g. "/api/chat/some-session-id"
   */
  const startStream = useCallback(async (url: string) => {
    // Cancel any in-flight stream
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsStreaming(true);
    setError(null);

    // Add a placeholder assistant message that we update incrementally
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
        thinking: undefined,
        toolCalls: [],
        citations: [],
        timestamp: Date.now(),
      },
    ]);

    try {
      const res = await fetch(url, {
        headers: { Accept: "text/event-stream" },
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Stream failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const evt = parseSSELine(line.trim());
          if (!evt) continue;

          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              switch (evt.type) {
                case "thinking":
                  return { ...m, thinking: evt.data.message };
                case "tool":
                  return { ...m, toolCalls: [...(m.toolCalls ?? []), evt.data] };
                case "markdown":
                  return { ...m, content: m.content + evt.data.chunk };
                case "citation":
                  return { ...m, citations: [...(m.citations ?? []), evt.data] };
                case "done":
                  return { ...m, isStreaming: false };
                case "error":
                  return { ...m, content: m.content + `\n\n⚠ ${evt.data.message}`, isStreaming: false };
                default:
                  return m;
              }
            })
          );

          if (evt.type === "done" || evt.type === "error") break;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, isStreaming: false, content: m.content || `Error: ${msg}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, addUserMessage, startStream, reset };
}
