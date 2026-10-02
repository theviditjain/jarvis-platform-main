import { NextRequest, NextResponse } from "next/server";
import { parserClient } from "@/lib/api/jarvis-parser";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ repo_id: string[] }> }
) {
  try {
    const { repo_id } = await params;
    const repoId = repo_id.join("/");
    const result = await parserClient.deleteRepo(repoId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg.includes("404") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
