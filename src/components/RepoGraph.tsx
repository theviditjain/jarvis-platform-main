"use client";

import { useEffect, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ── Types ───────────────────────────────────────────────────── */
interface RepoGraphNode {
  id: string;
  label: string;
  repo_url: string;
  node_count: number;
  indexed_at: number;
}
interface RepoGraphEdge { source: string; target: string; }
interface RepoGraph     { nodes: RepoGraphNode[]; edges: RepoGraphEdge[]; }

/* ── Node colour palette (dark) ─────────────────────────────── */
const PALETTE = [
  { dot: "#7c6ef7", border: "rgba(124,110,247,0.35)" },
  { dot: "#4ea8de", border: "rgba(78,168,222,0.35)"  },
  { dot: "#3dbf82", border: "rgba(61,191,130,0.35)"  },
  { dot: "#c9a96e", border: "rgba(201,169,110,0.35)" },
  { dot: "#e07070", border: "rgba(224,112,112,0.35)" },
  { dot: "#d48fb0", border: "rgba(212,143,176,0.35)" },
];

/* ── Custom node ─────────────────────────────────────────────── */
type ServiceNodeData = {
  label: string;
  repo_url: string;
  node_count: number;
  color: { dot: string; border: string };
  [key: string]: unknown;
};

function ServiceNode({ data }: { data: ServiceNodeData }) {
  const short = data.repo_url.replace("https://github.com/", "");
  return (
    <div
      style={{
        background: "#1e1e1c",
        border: `1px solid ${data.color.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        minWidth: 172,
        fontFamily: "var(--font-lora), Georgia, serif",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: data.color.dot, width: 7, height: 7, border: "none" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: data.color.dot, width: 7, height: 7, border: "none" }}
      />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: data.color.dot, flexShrink: 0,
          }}
        />
        <span
          style={{
            fontWeight: 600, fontSize: 13,
            color: "#e8e6e1", letterSpacing: "0.01em",
          }}
        >
          {data.label}
        </span>
      </div>

      {/* Meta */}
      <div style={{ fontSize: 11, color: "#56554f", lineHeight: 1.5 }}>
        <div>{data.node_count.toLocaleString()} nodes</div>
        <div style={{
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", maxWidth: 148,
        }}>
          {short}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { service: ServiceNode };

/* ── Helpers ─────────────────────────────────────────────────── */
function layoutNodes(nodes: RepoGraphNode[]): Node[] {
  const cols = Math.max(Math.ceil(Math.sqrt(nodes.length)), 1);
  return nodes.map((n, i) => ({
    id: n.id,
    type: "service",
    position: {
      x: (i % cols) * 280 + 60,
      y: Math.floor(i / cols) * 170 + 60,
    },
    data: {
      label: n.label,
      repo_url: n.repo_url,
      node_count: n.node_count,
      color: PALETTE[i % PALETTE.length],
    },
  }));
}

function buildEdges(edges: RepoGraphEdge[]): Edge[] {
  return edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#c9a96e",
      width: 14,
      height: 14,
    },
    style: { stroke: "#c9a96e", strokeWidth: 1.5, opacity: 0.7 },
    label: "depends on",
    labelStyle: { fontSize: 10, fill: "#8a8880", fontFamily: "var(--font-lora), serif" },
    labelBgStyle: { fill: "#1e1e1c", rx: 3 },
    labelBgPadding: [4, 6] as [number, number],
  }));
}

/* ── Preview data ────────────────────────────────────────────── */
const PREVIEW: RepoGraph = {
  nodes: [
    { id: "org/gateway",  label: "gateway",      repo_url: "https://github.com/org/gateway",      node_count: 421, indexed_at: 0 },
    { id: "org/users",    label: "user-service",  repo_url: "https://github.com/org/users",        node_count: 318, indexed_at: 0 },
    { id: "org/orders",   label: "order-service", repo_url: "https://github.com/org/orders",       node_count: 572, indexed_at: 0 },
    { id: "org/payments", label: "payments",      repo_url: "https://github.com/org/payments",     node_count: 284, indexed_at: 0 },
    { id: "org/notify",   label: "notification",  repo_url: "https://github.com/org/notify",       node_count: 156, indexed_at: 0 },
  ],
  edges: [
    { source: "org/gateway",  target: "org/users"    },
    { source: "org/gateway",  target: "org/orders"   },
    { source: "org/orders",   target: "org/payments" },
    { source: "org/orders",   target: "org/notify"   },
    { source: "org/users",    target: "org/notify"   },
  ],
};

/* ── Component ───────────────────────────────────────────────── */
export function RepoGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/parser/repos/graph")
      .then((r) => r.json())
      .then((data: RepoGraph) => {
        if (!live) return;
        if (data.nodes?.length) {
          setPreview(false);
          setNodes(layoutNodes(data.nodes));
          setEdges(buildEdges(data.edges));
        } else {
          setPreview(true);
          setNodes(layoutNodes(PREVIEW.nodes));
          setEdges(buildEdges(PREVIEW.edges));
        }
      })
      .catch(() => {
        if (!live) return;
        setPreview(true);
        setNodes(layoutNodes(PREVIEW.nodes));
        setEdges(buildEdges(PREVIEW.edges));
      });
    return () => { live = false; };
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge(c, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Preview banner */}
      {preview && (
        <div
          style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            zIndex: 10, display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "5px 14px",
            fontSize: 12, color: "var(--text-muted)",
            whiteSpace: "nowrap", pointerEvents: "none",
          }}
        >
          <span style={{ color: "var(--accent)" }}>·</span>
          Preview — index repositories to see your real dependency graph
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--bg-raised)" }}
      >
        <Background
          color="#2e2e2c"
          gap={24}
          size={1}
        />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as { color?: { dot: string } };
            return d?.color?.dot ?? "#c9a96e";
          }}
          maskColor="rgba(20,20,19,0.7)"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
          }}
        />
      </ReactFlow>
    </div>
  );
}
