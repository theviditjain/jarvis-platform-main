/**
 * Lightweight local auth session.
 * - Stored in sessionStorage (auto-clears when tab/browser closes → "auto logout")
 * - When a real auth backend (Supabase / OAuth) is wired, this becomes a thin
 *   wrapper around the provider's session token.
 */

export interface UserSession {
  email: string;
  name: string;
  avatarUrl?: string;
  githubToken?: string;   // populated after GitHub OAuth
  githubLogin?: string;   // e.g. "viditjain"
  provider: "github" | "google" | "email";
  loggedInAt: number;
}

const KEY = "jarvis:session";

export const authSession = {
  get(): UserSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  },

  set(user: UserSession) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(KEY, JSON.stringify(user));
  },

  clear() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(KEY);
  },

  isLoggedIn(): boolean {
    return !!authSession.get();
  },
};
