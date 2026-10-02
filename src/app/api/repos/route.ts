import { NextResponse } from "next/server";
import { parserClient } from "@/lib/api/jarvis-parser";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  try {
    return NextResponse.json(await parserClient.listRepos());
  } catch (err) { return apiError(err); }
}
