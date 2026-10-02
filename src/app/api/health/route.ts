import { NextResponse } from "next/server";
import { runtimeClient } from "@/lib/api/jarvis-runtime";
import { parserClient } from "@/lib/api/jarvis-parser";

export async function GET() {
  const [jarvisResult, parserResult] = await Promise.allSettled([
    runtimeClient.healthReady(),
    parserClient.health(),
  ]);
  return NextResponse.json({
    jarvis: jarvisResult.status === "fulfilled" ? jarvisResult.value : null,
    parser: parserResult.status === "fulfilled" ? parserResult.value : null,
  });
}
