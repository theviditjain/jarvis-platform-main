"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PipelineProgress } from "@/components/indexer/PipelineProgress";

export default function IndexPage() {
  const { data: session } = useSession();
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For multi-select from github list
  const [selectedGithub, setSelectedGithub] = useState<Set<string>>(new Set());

  // For manual multi-repo entry
  const [manualEntries, setManualEntries] = useState([{ url: "", branch: "" }]);
  const [clusterId, setClusterId] = useState("default");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/github/repos")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setRepos(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  async function startIndexJobs(entries: { url: string; branch: string }[]) {
    if (entries.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const newJobIds: string[] = [];
      for (const entry of entries) {
        const res = await fetch("/api/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_url: entry.url, branch: entry.branch, cluster_id: clusterId }),
        });
        if (res.ok) {
          const { job_id } = await res.json();
          newJobIds.push(job_id);
        } else {
          throw new Error(`Failed to start job for ${entry.url}`);
        }
      }
      setJobIds((prev) => [...prev, ...newJobIds]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleIndexSelected() {
    startIndexJobs(Array.from(selectedGithub).map((url) => ({ url, branch: "" })));
    setSelectedGithub(new Set());
  }

  function handleIndexManual(e: React.FormEvent) {
    e.preventDefault();
    const validEntries = manualEntries.filter((e) => e.url.trim().startsWith("http"));
    if (validEntries.length > 0) {
      startIndexJobs(validEntries);
      setManualEntries([{ url: "", branch: "" }]);
    }
  }

  function addManualEntry() {
    setManualEntries([...manualEntries, { url: "", branch: "" }]);
  }

  function updateManualEntry(index: number, field: "url" | "branch", value: string) {
    const newEntries = [...manualEntries];
    newEntries[index][field] = value;
    setManualEntries(newEntries);
  }

  function removeManualEntry(index: number) {
    if (manualEntries.length === 1) return;
    const newEntries = [...manualEntries];
    newEntries.splice(index, 1);
    setManualEntries(newEntries);
  }

  function toggleGithubRepo(url: string) {
    const next = new Set(selectedGithub);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedGithub(next);
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "36px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1>Index Repositories</h1>
        <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Provide multiple GitHub URLs or select from your GitHub account. JARVIS will clone, parse, build a knowledge graph,
          and make them available for AI-powered queries.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Custom URL form */}
        <div className="card" style={{ padding: "24px", height: "fit-content" }}>
          <h2 style={{ marginBottom: 16, fontSize: 16 }}>Paste GitHub URLs</h2>
          <form onSubmit={handleIndexManual} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Cluster ID</label>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Group repos together to enable cross-repo relationships.</p>
              <input
                required
                type="text"
                placeholder="default"
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 13,
                  outline: "none", marginBottom: 12,
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {manualEntries.map((entry, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    {idx === 0 && <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Repository URL</label>}
                    <input
                      required
                      type="url"
                      placeholder="https://github.com/owner/repo"
                      value={entry.url}
                      onChange={(e) => updateManualEntry(idx, "url", e.target.value)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8,
                        background: "var(--bg-subtle)", border: "1px solid var(--border)",
                        color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-geist-mono), monospace",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ width: 100 }}>
                    {idx === 0 && <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Branch (Optional)</label>}
                    <input
                      type="text"
                      placeholder="default"
                      value={entry.branch}
                      onChange={(e) => updateManualEntry(idx, "branch", e.target.value)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8,
                        background: "var(--bg-subtle)", border: "1px solid var(--border)",
                        color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-geist-mono), monospace",
                        outline: "none",
                      }}
                    />
                  </div>
                  {manualEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeManualEntry(idx)}
                      style={{
                        background: "none", border: "none", color: "var(--text-faint)",
                        cursor: "pointer", padding: "8px", height: 36, display: "flex", alignItems: "center"
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addManualEntry}
              style={{
                background: "none", border: "none", color: "var(--text-muted)",
                cursor: "pointer", fontSize: 13, textAlign: "left", display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 0", alignSelf: "flex-start"
              }}
            >
              <span style={{ fontSize: 16 }}>+</span> Add another repo
            </button>
            
            {error && <div style={{ fontSize: 13, color: "var(--red)" }}>{error}</div>}
            
            <button
              type="submit"
              disabled={isSubmitting || manualEntries.every(e => !e.url.trim())}
              className="btn btn-accent"
              style={{ justifyContent: "center", padding: "10px", marginTop: 8 }}
            >
              {isSubmitting ? "Starting..." : `Index ${manualEntries.length > 1 ? "Multiple" : "Repository"}`}
            </button>
          </form>
        </div>

        {/* GitHub Repos */}
        <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", maxHeight: 500 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16 }}>Your GitHub Repositories</h2>
            {selectedGithub.size > 0 && (
              <button onClick={handleIndexSelected} disabled={isSubmitting} className="btn btn-accent" style={{ fontSize: 11, padding: "4px 10px" }}>
                Index Selected ({selectedGithub.size}) to "{clusterId || 'default'}"
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
            {loading ? (
              <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Loading repositories...</p>
            ) : !session?.user ? (
              <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Please <a href="/login" style={{ color: "var(--accent)" }}>log in</a> to see your repositories.</p>
            ) : repos.length === 0 ? (
              <div style={{ padding: "16px", background: "var(--bg-subtle)", borderRadius: 8, border: "1px solid var(--border)", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>No repositories found or GitHub token missing.</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  If you are logged in with Google, or if you logged in before repo access was added, please <strong>sign out (bottom left) and sign back in with GitHub</strong>.
                </p>
              </div>
            ) : (
              repos.map((r) => {
                const isSelected = selectedGithub.has(r.html_url);
                return (
                  <div 
                    key={r.html_url} 
                    onClick={() => toggleGithubRepo(r.html_url)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: 12, padding: "12px", 
                      border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`, 
                      background: isSelected ? "var(--accent-dim)" : "transparent",
                      borderRadius: 8, cursor: "pointer", transition: "all 0.15s" 
                    }}
                  >
                    <div style={{ 
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--text-muted)"}`,
                      background: isSelected ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {isSelected && <span style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>✓</span>}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.full_name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>{r.language || "Unknown language"}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {jobIds.length > 0 && (
        <div className="card" style={{ padding: "24px", marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 style={{ fontSize: 16 }}>Pipeline Progress</h2>
          {jobIds.map((id, index) => (
            <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {jobIds.length > 1 && <h3 style={{ fontSize: 11 }}>Job {index + 1} ({id.slice(0, 8)})</h3>}
              <PipelineProgress jobId={id} />
              {index < jobIds.length - 1 && <hr style={{ marginTop: 12 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
