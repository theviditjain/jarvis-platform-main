import { parserClient } from "@/lib/api/jarvis-parser";
import { NextResponse } from "next/server";

/**
 * GET /api/parser/repos/graph
 * BFF proxy — forwards to jarvis-parser GET /api/repos/graph
 */
export async function GET() {
  try {
    const data = await parserClient.getRepoGraph();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
