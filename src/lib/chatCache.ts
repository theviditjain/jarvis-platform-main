/**
 * Browser-cache layer for chat sessions.
 * All data lives in localStorage under the key "jarvis:sessions".
 * When jarvis-persistence (Cosmos DB) is ready, writes will also
 * be forwarded to that API and this becomes a read-through cache.
 */

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  toolCalls?: { name: string }[];
  citations?: { file: string; line: number }[];
  createdAt: number; // epoch ms
}

export interface ChatSession {
  id: string;           // session_id from the parser API
  title: string;        // first user message (truncated)
  repoIds: string[];    // connected repos
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "jarvis:sessions";

function load(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export const chatCache = {
  all(): ChatSession[] {
    return load().sort((a, b) => b.updatedAt - a.updatedAt);
  },

  get(id: string): ChatSession | undefined {
    return load().find((s) => s.id === id);
  },

  create(id: string, repoIds: string[]): ChatSession {
    const session: ChatSession = {
      id,
      title: "New conversation",
      repoIds,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const sessions = load();
    sessions.unshift(session);
    save(sessions);
    return session;
  },

  appendMessage(sessionId: string, msg: StoredMessage) {
    const sessions = load();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;
    sessions[idx].messages.push(msg);
    sessions[idx].updatedAt = Date.now();
    // Use first user message as title
    if (msg.role === "user" && sessions[idx].title === "New conversation") {
      sessions[idx].title = msg.content.slice(0, 60) + (msg.content.length > 60 ? "…" : "");
    }
    save(sessions);
  },

  updateLastAssistant(sessionId: string, partial: Partial<StoredMessage>) {
    const sessions = load();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;
    const msgs = sessions[idx].messages;
    const last = msgs[msgs.length - 1];
    if (last && last.role === "assistant") {
      Object.assign(last, partial);
      sessions[idx].updatedAt = Date.now();
      save(sessions);
    }
  },

  delete(sessionId: string) {
    save(load().filter((s) => s.id !== sessionId));
  },

  clear() {
    save([]);
  },
};
