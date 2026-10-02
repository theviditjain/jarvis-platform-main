"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { chatCache, type ChatSession } from "@/lib/chatCache";

/* ── Icons ─────────────────────────────────────────────────── */
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 1v12M1 7h12" /></svg>;
}
function TrashIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 4h10M5 4V2h4v2M5.5 7v4M8.5 7v4M3 4l.7 8h6.6L11 4" /></svg>;
}
function BoxIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1.5 4.5l5.5 3 5.5-3M7 7.5v5M1.5 9.5v-5l5.5-3 5.5 3v5l-5.5 3-5.5-3z" /></svg>;
}
function MessageIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M13 7c0 3.3-2.7 6-6 6-1 0-2-.2-2.8-.7L1 13l.7-3.2C1.2 9 1 8 1 7c0-3.3 2.7-6 6-6s6 2.7 6 6z" /></svg>;
}
function RepoIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 3h10M2 7h10M2 11h10" /></svg>;
}
function GraphIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="2"/><circle cx="3" cy="3" r="1.5"/><circle cx="11" cy="11" r="1.5"/><path d="M4 4l2 2M10 10L8 8"/></svg>;
}
function PulseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 7h3l2-4 3 8 2-4h2" /></svg>;
}

export function AppSidebar() {
  const router = useRouter();
  const path = usePathname();
  const params = useParams();
  const activeId = params?.session_id as string | undefined;

  const { data: session } = useSession();
  const user = session?.user;

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    setSessions(chatCache.all());
    // Auto refresh every second just in case chat page updates it
    const interval = setInterval(() => setSessions(chatCache.all()), 1000);
    return () => clearInterval(interval);
  }, []);

  function handleNew() {
    router.push("/chat");
  }

  function handleSelect(id: string) {
    router.push(`/chat/${id}`);
  }

  function handleDelete(id: string) {
    chatCache.delete(id);
    setSessions(chatCache.all());
    if (activeId === id) {
      router.push("/chat");
    }
  }

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-raised)",
        borderRight: "1px solid var(--border)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Logo row */}
      <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "var(--accent-dim)", border: "1px solid rgba(232,112,58,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent)", fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>
          J
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", letterSpacing: "0.02em" }}>
          JARVIS
        </span>
      </div>

      {/* Navigation links */}
      <div style={{ padding: "0 10px 12px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <a href="/chat" className="btn" style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13, background: path?.startsWith("/chat") ? "var(--bg-subtle)" : "transparent", border: "none", color: path?.startsWith("/chat") ? "var(--text-primary)" : "var(--text-muted)" }}>
          <MessageIcon /> Chat
        </a>
        <a href="/repos" className="btn" style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13, background: path?.startsWith("/repos") ? "var(--bg-subtle)" : "transparent", border: "none", color: path?.startsWith("/repos") ? "var(--text-primary)" : "var(--text-muted)" }}>
          <RepoIcon /> Repositories
        </a>
        <a href="/index" className="btn" style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13, background: path?.startsWith("/index") ? "var(--bg-subtle)" : "transparent", border: "none", color: path?.startsWith("/index") ? "var(--text-primary)" : "var(--text-muted)" }}>
          <BoxIcon /> Index Repo
        </a>
        <a href="/graph" className="btn" style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13, background: path?.startsWith("/graph") ? "var(--bg-subtle)" : "transparent", border: "none", color: path?.startsWith("/graph") ? "var(--text-primary)" : "var(--text-muted)" }}>
          <GraphIcon /> Service Graph
        </a>
        <a href="/health" className="btn" style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13, background: path?.startsWith("/health") ? "var(--bg-subtle)" : "transparent", border: "none", color: path?.startsWith("/health") ? "var(--text-primary)" : "var(--text-muted)" }}>
          <PulseIcon /> Health
        </a>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", margin: "0 10px 12px", paddingTop: 12 }} />

      {/* New chat */}
      <div style={{ padding: "0 10px 12px", flexShrink: 0 }}>
        <button
          onClick={handleNew}
          className="btn"
          style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13 }}
        >
          <PlusIcon />
          New conversation
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px" }}>
        {sessions.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--text-faint)", padding: "8px 8px" }}>
            No conversations yet.
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 6,
                background: s.id === activeId ? "var(--bg-subtle)" : "transparent",
                marginBottom: 1,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (s.id !== activeId) e.currentTarget.style.background = "var(--surface)"; }}
              onMouseLeave={(e) => { if (s.id !== activeId) e.currentTarget.style.background = "transparent"; }}
            >
              <button
                onClick={() => handleSelect(s.id)}
                style={{
                  flex: 1, minWidth: 0,
                  textAlign: "left", background: "none", border: "none",
                  cursor: "pointer", padding: "7px 8px",
                  color: s.id === activeId ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <div style={{
                  fontSize: 13, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", lineHeight: 1.4,
                }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
                  {new Date(s.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-faint)", padding: "6px 6px 6px 2px",
                  display: "flex", alignItems: "center",
                  opacity: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>

      {/* User footer */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--bg-subtle)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "var(--text-muted)", flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name ?? "Guest"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, color: "var(--text-faint)",
            padding: "4px 2px",
          }}
          title="Sign out"
        >
          ↩
        </button>
      </div>
    </div>
  );
}
