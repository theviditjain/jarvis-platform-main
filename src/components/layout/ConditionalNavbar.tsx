"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

// Chat and login have their own full-page layouts — no shared navbar
const HIDDEN_ON = ["/chat", "/login"];

export function ConditionalNavbar() {
  const path = usePathname();
  const hidden = HIDDEN_ON.some((prefix) => path === prefix || path.startsWith(prefix + "/"));
  if (hidden) return null;
  return (
    <>
      <Navbar />
      {/* Spacer so content isn't under the fixed navbar */}
      <div style={{ height: 48 }} />
    </>
  );
}
