"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { chatCache, type ChatSession, type StoredMessage } from "@/lib/chatCache";
import { useSSEStream } from "@/lib/sse/useSSEStream";

/* ── Icons ─────────────────────────────────────────────────── */
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 1v12M1 7h12" /></svg>;
}
function TrashIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 4h10M5 4V2h4v2M5.5 7v4M8.5 7v4M3 4l.7 8h6.6L11 4" /></svg>;
}
function SendIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2L2 7l5 2 2 5 5-12z" /></svg>;
}
function ChainIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5.5 9.5l3-5m-4.5 2l-1.5 1.5a2 2 0 1 0 2.83 2.83L7 9.33M9 5l1.5-1.5a2 2 0 1 0-2.83-2.83L7 2.17" /></svg>;
}
function BoxIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1.5 4.5l5.5 3 5.5-3M7 7.5v5M1.5 9.5v-5l5.5-3 5.5 3v5l-5.5 3-5.5-3z" /></svg>;
}
function GraphIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="2"/><circle cx="3" cy="3" r="1.5"/><circle cx="11" cy="11" r="1.5"/><path d="M4 4l2 2M10 10L8 8"/></svg>;
}
function PulseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 7h3l2-4 3 8 2-4h2" /></svg>;
}

/* ── Service Selector popup ─────────────────────────────────── */
function ServiceSelector({
  repos,
  selected,
  onToggle,
  onClose,
}: {
  repos: string[];
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        minWidth: 280,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Connected Services
        </h3>
      </div>
      {repos.length === 0 ? (
        <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
          No repositories indexed yet.
          <br />
          <a href="/index" style={{ color: "var(--accent)", marginTop: 6, display: "inline-block" }}>
            Index a repository →
          </a>
        </div>
      ) : (
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {repos.map((r) => {
            const active = selected.includes(r);
            return (
              <button
                key={r}
                onClick={() => onToggle(r)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.1s",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <div
                  style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    background: active ? "var(--accent-dim)" : "transparent",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {active && <span style={{ color: "var(--accent)", fontSize: 10, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, fontFamily: "var(--font-geist-mono), monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Chat bubble ─────────────────────────────────────────────── */
function Bubble({ msg }: { msg: StoredMessage }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      {/* Assistant avatar dot */}
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "var(--accent-dim)", border: "1px solid rgba(232,112,58,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: 10, marginTop: 2,
          color: "var(--accent)", fontSize: 11, fontWeight: 700,
        }}>
          J
        </div>
      )}

      <div
        style={{
          maxWidth: "76%",
          padding: isUser ? "10px 14px" : "12px 16px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser ? "rgba(232,112,58,0.12)" : "var(--surface)",
          border: isUser ? "1px solid rgba(232,112,58,0.25)" : "1px solid var(--border)",
          fontSize: 14,
          lineHeight: 1.65,
          color: "var(--text-primary)",
        }}
      >
        {/* Tool calls */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {msg.toolCalls.map((t, i) => (
              <span key={i} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 4,
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
                color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace",
              }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Thinking */}
        {msg.thinking && (
          <p style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic", marginBottom: 6 }}>
            {msg.thinking}
          </p>
        )}

        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>

        {/* Citations */}
        {msg.citations && msg.citations.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            {msg.citations.map((c, i) => (
              <span key={i} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 4,
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
                color: "var(--accent)", fontFamily: "var(--font-geist-mono), monospace",
              }}>
                {c.file}:{c.line}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Input bar ──────────────────────────────────────────────── */
function InputBar({
  onSend,
  disabled,
  connectedRepos,
  allRepos,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  connectedRepos: string[];
  allRepos: string[];
  onToggleRepo: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [showServices, setShowServices] = useState(false);
  const [localConnected, setLocalConnected] = useState<string[]>(connectedRepos);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function send() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  return (
    <div style={{ padding: "0 20px 20px", position: "relative" }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "visible",
          position: "relative",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Ask anything about your codebase…"
          style={{
            width: "100%",
            padding: "14px 16px 8px",
            background: "none",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 14,
            fontFamily: "var(--font-lora), serif",
            color: "var(--text-primary)",
            lineHeight: 1.6,
            minHeight: 48,
            maxHeight: 160,
          }}
        />

        {/* Bottom bar inside input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 10px 10px",
            gap: 6,
          }}
        >
          {/* Services pill */}
          <div style={{ position: "relative" }}>
            <button
              className="btn"
              onClick={() => setShowServices((v) => !v)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                gap: 6,
                color: localConnected.length > 0 ? "var(--accent)" : "var(--text-muted)",
                borderColor: localConnected.length > 0 ? "rgba(232,112,58,0.3)" : "var(--border)",
                background: localConnected.length > 0 ? "var(--accent-dim)" : "var(--surface)",
              }}
            >
              <ChainIcon />
              {localConnected.length > 0
                ? `${localConnected.length} service${localConnected.length > 1 ? "s" : ""} connected`
                : "Connect services"}
            </button>
            {showServices && (
              <ServiceSelector
                repos={allRepos}
                selected={localConnected}
                onToggle={(id) =>
                  setLocalConnected((prev) =>
                    prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
                  )
                }
                onClose={() => setShowServices(false)}
              />
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Send */}
          <button
            onClick={send}
            disabled={disabled || !text.trim()}
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              border: "none",
              background: text.trim() && !disabled ? "var(--accent)" : "var(--bg-subtle)",
              color: text.trim() && !disabled ? "#fff" : "var(--text-faint)",
              cursor: text.trim() && !disabled ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}


/* ── Empty state (welcome center) ───────────────────────────── */
function Welcome({ user, allRepos }: { user: { name?: string | null } | null; allRepos: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "var(--accent-dim)", border: "1px solid rgba(232,112,58,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent)", fontWeight: 700, fontSize: 20, marginBottom: 18,
      }}>
        J
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
        {user ? `Welcome, ${(user.name ?? "").split(" ")[0] || "there"}` : "Welcome to JARVIS"}
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", maxWidth: 380, lineHeight: 1.65, marginBottom: 24 }}>
        Ask anything about your indexed codebase. Connect services below to start.
      </p>

      {/* Repo status */}
      {allRepos.length === 0 ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 8,
          background: "var(--surface)", border: "1px solid var(--border)",
          fontSize: 13, color: "var(--text-muted)",
        }}>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          No repositories indexed —{" "}
          <a href="/index" style={{ color: "var(--accent)" }}>index one</a>
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 8,
          background: "var(--accent-dim)", border: "1px solid rgba(232,112,58,0.2)",
          fontSize: 13, color: "var(--accent)",
        }}>
          <span>·</span>
          {allRepos.length} {allRepos.length === 1 ? "repository" : "repositories"} available
        </div>
      )}
    </div>
  );
}

/* ── Main chat page ─────────────────────────────────────────── */
export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.session_id as string | undefined;

  const { data: session, status } = useSession();
  const user = session?.user ?? null;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [allRepos, setAllRepos] = useState<string[]>([]);
  const [connectedRepos, setConnectedRepos] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages: streamMessages, isStreaming, addUserMessage, startStream } = useSSEStream();

  // Auth guard — middleware handles redirect but add client-side check too
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Load sessions from cache
  useEffect(() => {
    setSessions(chatCache.all());
  }, []);

  // Load active session if URL has session_id
  useEffect(() => {
    if (sessionId) {
      const s = chatCache.get(sessionId);
      if (s) setActiveSession(s);
    }
  }, [sessionId]);

  // Fetch available repos
  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((data: { repository_id: string }[]) =>
        setAllRepos(data.map((d) => d.repository_id))
      )
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages]);

  function refreshSessions() {
    setSessions(chatCache.all());
  }

  function handleNew() {
    setActiveSession(null);
    router.push("/chat");
  }

  function handleSelect(id: string) {
    const s = chatCache.get(id);
    if (s) { setActiveSession(s); router.push(`/chat/${id}`); }
  }

  function handleDelete(id: string) {
    chatCache.delete(id);
    refreshSessions();
    if (activeSession?.id === id) { setActiveSession(null); router.push("/chat"); }
  }

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  const handleSend = useCallback(async (text: string) => {
    addUserMessage(text);

    const repoId = connectedRepos[0] ?? allRepos[0] ?? "";

    // Create or reuse session
    let sid = activeSession?.id;
    if (!sid) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, repository_id: repoId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      sid = data.session_id as string;

      const newSession = chatCache.create(sid, connectedRepos);
      chatCache.appendMessage(sid, {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      });
      setActiveSession(newSession);
      refreshSessions();
      router.push(`/chat/${sid}`, { scroll: false });
    } else {
      chatCache.appendMessage(sid, {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      });
    }

    startStream(`/api/chat/${sid}`);
  }, [activeSession, connectedRepos, allRepos, addUserMessage, startStream, router]);

  // Merge stored + streaming messages
  const displayMessages: StoredMessage[] = [
    ...(activeSession?.messages ?? []),
    ...streamMessages
      .filter((m) => !activeSession?.messages.some((sm) => sm.content === m.content))
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        thinking: m.thinking,
        toolCalls: m.toolCalls,
        citations: m.citations,
        createdAt: Date.now(),
      })),
  ];

  if (status === "loading") return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>
      {/* Repo status bar */}
      {activeSession && (
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--text-faint)",
        }}>
          <span style={{ color: "var(--accent)" }}>·</span>
          {activeSession.repoIds.length > 0
            ? activeSession.repoIds.join(", ")
            : "No services connected"}
        </div>
      )}

      {/* Messages or welcome */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
        {displayMessages.length === 0 ? (
          <Welcome user={user} allRepos={allRepos} />
        ) : (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
            {displayMessages.map((msg) => (
              <Bubble key={msg.id} msg={msg} />
            ))}
            {isStreaming && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 0 34px" }}>
                <span style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "var(--accent)",
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, maxWidth: 720, width: "100%", margin: "0 auto", paddingBottom: 4 }}>
        <InputBar
          onSend={handleSend}
          disabled={isStreaming}
          connectedRepos={connectedRepos}
          allRepos={allRepos}
          onToggleRepo={(id) =>
            setConnectedRepos((p) => p.includes(id) ? p.filter((r) => r !== id) : [...p, id])
          }
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
