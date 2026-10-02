"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/repos",  label: "Repositories" },
  { href: "/index",  label: "Index"         },
  { href: "/graph",  label: "Service Graph" },
  { href: "/chat",   label: "Chat"          },
  { href: "/health", label: "Health"        },
];

export function Navbar() {
  const path = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 48,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Wordmark */}
      <Link
        href="/repos"
        style={{
          fontFamily: "var(--font-lora), serif",
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.04em",
          color: "var(--text-primary)",
          marginRight: 36,
          flexShrink: 0,
          textDecoration: "none",
        }}
      >
        JARVIS
      </Link>

      {/* Links */}
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {NAV.map(({ href, label }) => {
          const active = path === href || (href !== "/repos" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "4px 12px",
                borderRadius: 5,
                fontSize: 13,
                fontFamily: "var(--font-lora), serif",
                fontWeight: active ? 500 : 400,
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                background: active ? "var(--bg-subtle)" : "transparent",
                textDecoration: "none",
                transition: "color 0.12s, background 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
