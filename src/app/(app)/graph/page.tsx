"use client";

import dynamic from "next/dynamic";

const RepoGraph = dynamic(
  () => import("@/components/RepoGraph").then((m) => ({ default: m.RepoGraph })),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-faint)",
        fontSize: 13,
        letterSpacing: "0.05em",
      }}>
        Loading graph...
      </div>
    ),
  }
);

export default function GraphPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 48px)",
        padding: "24px 28px 0",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ color: "var(--text-primary)" }}>Service Graph</h1>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            — dependency map across indexed repositories
          </span>
        </div>
        <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-faint)", maxWidth: 560 }}>
          Index repositories with <code>depends_on</code> to declare inter-service dependencies.
          The graph updates automatically.
        </p>
      </div>

      {/* Graph — fills remaining height */}
      <div
        className="card"
        style={{
          flex: 1,
          overflow: "hidden",
          marginBottom: 24,
          background: "var(--bg-raised)",
        }}
      >
        <RepoGraph />
      </div>
    </div>
  );
}
