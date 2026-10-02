/**
 * Standardized error handler for BFF API routes.
 * Converts any upstream error into a consistent { error, status } shape.
 * This means if a backend changes its error format, only THIS file changes.
 */
import { NextResponse } from "next/server";

export function apiError(err: unknown, fallbackStatus = 500): NextResponse {
  const message = err instanceof Error ? err.message : String(err);

  // Detect upstream 404 from error message text
  const status =
    message.includes("404") ? 404 :
    message.includes("501") ? 501 :
    message.includes("503") ? 503 :
    fallbackStatus;

  return NextResponse.json({ error: message }, { status });
}
