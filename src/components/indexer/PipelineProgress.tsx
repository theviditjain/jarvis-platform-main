"use client";
import { useEffect, useState } from "react";
import type { IndexJob, PipelineStage } from "@/types";

const STATUS_ICON: Record<string, string> = {
  pending: "⬜",
  running: "⏳",
  done:    "✅",
  failed:  "❌",
};

function StageRow({ stage }: { stage: PipelineStage }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6">{STATUS_ICON[stage.status]}</span>
      <div className="flex-1">
        <span className={`text-sm font-medium ${
          stage.status === "running" ? "text-violet-300 animate-pulse"
          : stage.status === "done"  ? "text-green-400"
          : stage.status === "failed"? "text-red-400"
          : "text-zinc-500"
        }`}>
          Stage {stage.number}: {stage.name}
        </span>
        {stage.detail && (
          <p className="text-xs text-zinc-500 mt-0.5">{stage.detail}</p>
        )}
      </div>
      {stage.elapsed_ms != null && (
        <span className="text-xs text-zinc-600">{(stage.elapsed_ms / 1000).toFixed(1)}s</span>
      )}
    </div>
  );
}

interface Props {
  jobId: string;
}

export function PipelineProgress({ jobId }: Props) {
  const [job, setJob] = useState<IndexJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      while (!stopped) {
        try {
          const res = await fetch(`/api/index/status/${jobId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: IndexJob = await res.json();
          setJob(data);
          if (data.status === "done" || data.status === "failed") break;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Poll failed");
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => { stopped = true; };
  }, [jobId]);

  if (!job) {
    return <p className="text-zinc-500 text-sm animate-pulse">Loading job status…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold uppercase tracking-wide ${
          job.status === "done"    ? "text-green-400"
          : job.status === "failed"? "text-red-400"
          : "text-violet-400"
        }`}>
          {job.status}
        </span>
        {job.repository_id && (
          <span className="text-sm text-zinc-400">{job.repository_id}</span>
        )}
      </div>

      <div className="flex flex-col gap-3 border-l-2 border-zinc-800 pl-4">
        {job.stages.map((s) => <StageRow key={s.number} stage={s} />)}
      </div>

      {job.status === "done" && (
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-300">
          <p>✅ <strong>{job.node_count.toLocaleString()}</strong> nodes indexed</p>
          <p>🔗 <strong>{job.relationship_count.toLocaleString()}</strong> relationships</p>
          {job.parse_errors > 0 && (
            <details className="mt-2">
              <summary className="text-yellow-500 cursor-pointer hover:text-yellow-400 select-none flex items-center gap-1">
                <span className="text-xs transition-transform duration-200 group-open:rotate-90">▶</span>
                ⚠ {job.parse_errors} parse errors (click to view)
              </summary>
              <div className="mt-3 mb-1 pl-4 max-h-60 overflow-y-auto border-l-2 border-yellow-900/50 flex flex-col gap-3">
                {job.error_details?.map((err, i) => (
                  <div key={i} className="text-xs leading-relaxed bg-zinc-950/50 p-2 rounded border border-zinc-800">
                    <span className="text-zinc-400 font-medium block mb-1 truncate" title={err.file_path}>{err.file_path}</span>
                    <span className="text-red-400/90 font-mono break-words">{err.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {job.status === "failed" && (
        <div className="rounded-lg bg-red-950 border border-red-800 p-4 text-sm text-red-300">
          <p className="font-medium">Pipeline failed:</p>
          <p className="font-mono text-xs mt-1">{job.error}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
