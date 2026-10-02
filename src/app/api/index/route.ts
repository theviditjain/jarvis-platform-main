import { NextRequest, NextResponse } from "next/server";
import { parserClient } from "@/lib/api/jarvis-parser";
import { apiError } from "@/lib/api/errors";

import { auth } from "@/auth";

export const POST = auth(async (req) => {
  try {
    const body = await req.json();
    if (req.auth?.githubAccessToken) {
      body.github_token = req.auth.githubAccessToken;
    }
    const result = await parserClient.startIndex(body);
    return NextResponse.json(result, { status: 202 });
  } catch (err) { return apiError(err); }
});

export async function GET() {
  try {
    return NextResponse.json(await parserClient.listJobs());
  } catch (err) { return apiError(err); }
}
