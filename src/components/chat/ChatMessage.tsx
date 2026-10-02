"use client";
import type { ChatMessage as Msg } from "@/types";

export function ChatMessage({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "bg-violet-600 text-white rounded-br-sm"
          : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
      }`}>
        {/* Thinking indicator */}
        {msg.thinking && (
          <p className="text-xs text-zinc-400 italic mb-2">💭 {msg.thinking}</p>
        )}

        {/* Tool calls */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-2">
            {msg.toolCalls.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-zinc-700 rounded px-2 py-0.5 text-zinc-300">
                🔧 {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Main content */}
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        {msg.isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />
        )}

        {/* Citations */}
        {msg.citations && msg.citations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-zinc-700">
            {msg.citations.map((c, i) => (
              <span key={i} className="text-xs bg-zinc-700 text-violet-300 rounded px-2 py-0.5 font-mono">
                📎 {c.file}:{c.line}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
