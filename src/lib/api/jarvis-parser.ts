/**
 * API client for jarvis-parser (Port 8001).
 * Used ONLY in Next.js API route handlers (server-side BFF).
 * Never import this in React components.
 */
import type { IndexJob, IndexedRepo, IndexRequest, IndexResponse } from "@/types";

interface RepoGraphNode { id: string; label: string; repo_url: string; node_count: number; indexed_at: number; }
interface RepoGraphEdge { source: string; target: string; }
interface RepoGraph     { nodes: RepoGraphNode[]; edges: RepoGraphEdge[]; }

const BASE = process.env.PARSER_API_URL ?? "http://localhost:8001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`jarvis-parser ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const parserClient = {
  /** POST /api/index — start a new indexing job */
  startIndex: (req: IndexRequest) =>
    request<IndexResponse>("/api/index", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  /** GET /api/index/status/{job_id} — poll job progress */
  getJobStatus: (jobId: string) =>
    request<IndexJob>(`/api/index/status/${jobId}`),

  /** GET /api/index — list all jobs */
  listJobs: () => request<IndexJob[]>("/api/index"),

  /** GET /api/repos — list indexed repos */
  listRepos: () => request<IndexedRepo[]>("/api/repos"),

  /** DELETE /api/repos/{repo_id} — soft-delete a repo */
  deleteRepo: (repoId: string) =>
    request<{ deleted: string; message: string }>(
      `/api/repos/${encodeURIComponent(repoId)}`,
      { method: "DELETE" }
    ),

  /** GET /api/health */
  health: () => request<{ status: string; active_jobs: number; indexed_repos: number }>("/api/health"),

  /** GET /api/repos/graph — service dependency graph */
  getRepoGraph: () => request<RepoGraph>("/api/repos/graph"),
};
