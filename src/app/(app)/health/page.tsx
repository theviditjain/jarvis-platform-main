"use client";
import { useEffect, useState } from "react";
import type { HealthStatus } from "@/types";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7, height: 7,
        borderRadius: "50%",
        background: ok ? "var(--green)" : "var(--red)",
        flexShrink: 0,
      }}
    />
  );
}

function Row({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        fontSize: 13,
      }}
    >
      <Dot ok={ok} />
      <span style={{ color: "var(--text-muted)", flex: 1 }}>{label}</span>
      <span
        style={{
          color: ok ? "var(--green)" : "var(--red)",
          fontSize: 12,
        }}
      >
        {detail ?? (ok ? "Connected" : "Unavailable")}
      </span>
    </div>
  );
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function check() {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data: HealthStatus = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    }
    setLastChecked(new Date());
    setLoading(false);
  }

  useEffect(() => { check(); }, []);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "36px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1>Health</h1>
          {lastChecked && (
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--text-faint)" }}>
              Checked at {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          className="btn"
          onClick={check}
          disabled={loading}
          style={{ opacity: loading ? 0.4 : 1 }}
        >
          {loading ? "Checking" : "Refresh"}
        </button>
      </div>

      {/* Services */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Runtime */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Dot ok={!!health?.jarvis} />
            <h2 style={{ color: "var(--text-primary)" }}>Jarvis Runtime</h2>
            <code style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-faint)" }}>:8000</code>
          </div>
          {health?.jarvis ? (
            <div style={{ paddingLeft: 16, borderLeft: "1px solid var(--border)" }}>
              <Row label="Neo4j"  ok={health.jarvis.neo4j}  />
              <Row label="Milvus" ok={health.jarvis.milvus} />
              <Row label="OpenAI" ok={health.jarvis.openai} />
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--red)", paddingLeft: 16 }}>Unreachable</p>
          )}
        </div>

        {/* Parser */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Dot ok={!!health?.parser} />
            <h2 style={{ color: "var(--text-primary)" }}>Parser</h2>
            <code style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-faint)" }}>:8001</code>
          </div>
          {health?.parser ? (
            <div
              style={{
                paddingLeft: 16,
                borderLeft: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Active jobs</span>
                <span style={{ color: "var(--text-primary)" }}>{health.parser.active_jobs}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Indexed repositories</span>
                <span style={{ color: "var(--text-primary)" }}>{health.parser.indexed_repos}</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--red)", paddingLeft: 16 }}>Unreachable</p>
          )}
        </div>
      </div>
    </div>
  );
}
