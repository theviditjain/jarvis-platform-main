"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IndexedRepo } from "@/types";
import { useChatStore } from "@/store/chatStore";

function ClusterRow({ clusterId, reposInCluster, onChat }: { clusterId: string, reposInCluster: IndexedRepo[], onChat: () => void }) {
  const nodeCount = reposInCluster.reduce((sum, r) => sum + r.node_count, 0);
  const edgeCount = reposInCluster.reduce((sum, r) => sum + r.relationship_count, 0);
  
  return (
    <div
      className="card card-hover"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        gap: 16,
      }}
    >
      {/* Left */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)", marginBottom: 5 }}>
          Cluster: {clusterId}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-faint)" }}>
          <span>{reposInCluster.length} {reposInCluster.length === 1 ? 'repository' : 'repositories'}</span>
          <span>{nodeCount.toLocaleString()} nodes</span>
          <span>{edgeCount.toLocaleString()} edges</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {reposInCluster.map(r => (
            <span key={r.repository_id} style={{ background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: 4 }}>
              {r.repository_id} ({r.branch})
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <button className="btn btn-accent" onClick={onChat} style={{ flexShrink: 0 }}>
        Chat with Cluster
      </button>
    </div>
  );
}

export default function ReposPage() {
  const [repos, setRepos] = useState<IndexedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const setActiveCluster = useChatStore((s) => s.setActiveCluster);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then(setRepos)
      .finally(() => setLoading(false));
  }, []);

  async function handleChat(clusterId: string) {
    setActiveCluster(clusterId);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "", cluster_id: clusterId }),
    });
    const data = await res.json();
    router.push(`/chat/${data.session_id}?cluster=${encodeURIComponent(clusterId)}`);
  }

  // Group by cluster
  const clusters = repos.reduce((acc, repo) => {
    const cid = repo.cluster_id || "default";
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(repo);
    return acc;
  }, {} as Record<string, IndexedRepo[]>);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1>Repositories</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading..." : `${repos.length} ${repos.length === 1 ? "repository" : "repositories"} indexed`}
          </p>
        </div>
        <Link href="/index" className="btn">
          + Index
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: "var(--text-faint)", fontSize: 13, padding: "24px 0" }}>
          Loading...
        </div>
      ) : repos.length === 0 ? (
        <div
          className="card"
          style={{ padding: "48px 32px", textAlign: "center" }}
        >
          <p style={{ color: "var(--text-muted)", marginBottom: 12, fontSize: 14 }}>
            No repositories indexed yet.
          </p>
          <Link href="/index" style={{ fontSize: 13, color: "var(--accent)" }}>
            Index your first repository →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(clusters).map(([clusterId, clusterRepos]) => (
            <ClusterRow
              key={clusterId}
              clusterId={clusterId}
              reposInCluster={clusterRepos}
              onChat={() => handleChat(clusterId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
