import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * GET /api/github/repos
 * Returns the authenticated user's GitHub repositories.
 * Requires GitHub OAuth with `repo` scope.
 */
export const GET = auth(async (req) => {
  const session = req.auth;

  if (!session?.githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub token not available. Please sign in with GitHub." },
      { status: 401 }
    );
  }

  const page = new URL(req.url).searchParams.get("page") ?? "1";
  const perPage = 50;

  const res = await fetch(
    `https://api.github.com/user/repos?sort=pushed&per_page=${perPage}&page=${page}&affiliation=owner,collaborator`,
    {
      headers: {
        Authorization: `Bearer ${session.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const repos = await res.json() as {
    full_name: string;
    description: string | null;
    private: boolean;
    language: string | null;
    stargazers_count: number;
    pushed_at: string;
    html_url: string;
  }[];

  return NextResponse.json(repos);
});
