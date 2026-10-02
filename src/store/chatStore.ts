/**
 * Global Zustand store.
 * Tracks the active repository and open chat sessions.
 */
import { create } from "zustand";
import type { IndexedRepo } from "@/types";

interface ChatStore {
  /** The currently selected cluster for chat */
  activeCluster: string | null;
  setActiveCluster: (clusterId: string | null) => void;

  /** All open session IDs → cluster mapping */
  sessions: Record<string, string>; // session_id → cluster_id
  addSession: (sessionId: string, clusterId: string) => void;
  removeSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeCluster: null,
  setActiveCluster: (clusterId) => set({ activeCluster: clusterId }),

  sessions: {},
  addSession: (sessionId, clusterId) =>
    set((s) => ({ sessions: { ...s.sessions, [sessionId]: clusterId } })),
  removeSession: (sessionId) =>
    set((s) => {
      const next = { ...s.sessions };
      delete next[sessionId];
      return { sessions: next };
    }),
}));
