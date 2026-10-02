import { NextRequest, NextResponse } from "next/server";
import { runtimeClient } from "@/lib/api/jarvis-runtime";
import { apiError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runtimeClient.initChat(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) { return apiError(err); }
}
