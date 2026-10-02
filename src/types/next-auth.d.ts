import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    githubAccessToken?: string;
    githubLogin?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    githubAccessToken?: string;
    githubLogin?: string;
  }
}
