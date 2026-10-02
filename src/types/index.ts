// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for jarvis-ui.
// These mirror the Pydantic models in both backend repos.
// ─────────────────────────────────────────────────────────────────────────────

// ── jarvis-parser types ───────────────────────────────────────────────────────

export type JobStatus = "pending" | "running" | "done" | "failed";
export type StageStatus = "pending" | "running" | "done" | "failed";

export interface PipelineStage {
  number: number;
  name: string;
  status: StageStatus;
  started_at: number | null;
  finished_at: number | null;
  detail: string;
  elapsed_ms?: number | null;
}

export interface IndexJob {
  job_id: string;
  repo_url: string;
  branch: string;
  module_name: string | null;
  status: JobStatus;
  current_stage: number;
  stages: PipelineStage[];
  created_at: number;
  finished_at: number | null;
  error: string | null;
  repository_id: string | null;
  node_count: number;
  relationship_count: number;
  parse_errors: number;
  error_details: Array<{ file_path: string; reason: string }>;
}

export interface IndexedRepo {
  repository_id: string;
  repo_url: string;
  branch: string;
  cluster_id: string;
  node_count: number;
  relationship_count: number;
  indexed_at: number;
  job_id: string;
}

export interface IndexRequest {
  repo_url: string;
  branch?: string;
  module_name?: string;
  github_token?: string;
}

export interface IndexResponse {
  job_id: string;
  message: string;
  status_url: string;
}

// ── Jarvis runtime types ──────────────────────────────────────────────────────

export interface ChatRequest {
  query: string;
  repository_id?: string;
  session_id?: string;
  stream?: boolean;
}

export interface ChatSessionResponse {
  session_id: string;
  stream_url: string;
}

// SSE event union — matches events emitted by the Jarvis SSE adapter
export type SSEEventType = "thinking" | "tool" | "markdown" | "citation" | "done" | "error";

export interface SSEThinkingEvent   { type: "thinking";  data: { message: string } }
export interface SSEToolEvent       { type: "tool";      data: { name: string; result: string } }
export interface SSEMarkdownEvent   { type: "markdown";  data: { chunk: string } }
export interface SSECitationEvent   { type: "citation";  data: { file: string; line: number; node_id: string } }
export interface SSEDoneEvent       { type: "done";      data: { session_id: string } }
export interface SSEErrorEvent      { type: "error";     data: { message: string } }

export type SSEEvent =
  | SSEThinkingEvent
  | SSEToolEvent
  | SSEMarkdownEvent
  | SSECitationEvent
  | SSEDoneEvent
  | SSEErrorEvent;

// Chat message shown in the UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  thinking?: string;
  toolCalls?: Array<{ name: string; result: string }>;
  citations?: Array<{ file: string; line: number; node_id: string }>;
  timestamp: number;
}

// Retrieval
export interface RetrievalRequest {
  query: string;
  repository_id?: string;
  top_k?: number;
  include_graph?: boolean;
  include_vector?: boolean;
}

// Health
export interface HealthStatus {
  jarvis: {
    status: string;
    neo4j: boolean;
    milvus: boolean;
    openai: boolean;
  } | null;
  parser: {
    status: string;
    active_jobs: number;
    indexed_repos: number;
  } | null;
}
