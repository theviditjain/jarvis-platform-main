import { NextRequest, NextResponse } from "next/server";
import { parserClient } from "@/lib/api/jarvis-parser";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;
    const job = await parserClient.getJobStatus(job_id);
    return NextResponse.json(job);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg.includes("404") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
