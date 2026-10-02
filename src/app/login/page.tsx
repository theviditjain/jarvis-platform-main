"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ── Icons ───────────────────────────────────────────────────── */
function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/chat";
  const [loading, setLoading] = useState<string | null>(null);

  // Already signed in → redirect
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  async function handleOAuth(provider: "github" | "google") {
    setLoading(provider);
    await signIn(provider, { callbackUrl });
    // signIn redirects — setLoading cleanup not needed
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-faint)", fontSize: 13,
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--accent-dim)",
            border: "1px solid rgba(232,112,58,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 20, fontFamily: "var(--font-lora), serif" }}>J</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
            Sign in to JARVIS
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Your session ends automatically when you close the tab.
          </p>
        </div>

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn"
            disabled={!!loading}
            onClick={() => handleOAuth("github")}
            style={{
              justifyContent: "center",
              gap: 10,
              padding: "12px 16px",
              fontSize: 14,
              opacity: loading && loading !== "github" ? 0.4 : 1,
              position: "relative",
            }}
          >
            <GithubIcon />
            {loading === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
          </button>

          <button
            className="btn"
            disabled={!!loading}
            onClick={() => handleOAuth("google")}
            style={{
              justifyContent: "center",
              gap: 10,
              padding: "12px 16px",
              fontSize: 14,
              opacity: loading && loading !== "google" ? 0.4 : 1,
            }}
          >
            <GoogleIcon />
            {loading === "google" ? "Redirecting to Google…" : "Continue with Google"}
          </button>
        </div>

        {/* Note */}
        <p style={{
          marginTop: 28, textAlign: "center",
          fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7,
        }}>
          Signing in with GitHub grants access to your repositories
          for indexing and AI reasoning. Read-only access is requested.
        </p>
      </div>
    </div>
  );
}
