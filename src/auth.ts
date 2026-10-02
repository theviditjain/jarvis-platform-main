import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          // Request repo read access so we can list the user's repos
          scope: "read:user user:email repo",
        },
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
    // Session lives only as long as browser is open (maxAge = 0 means session cookie)
    // For true "close-tab = logout" behaviour the cookie must be a session cookie (no maxAge)
  },

  callbacks: {
    async jwt({ token, account }) {
      // Persist the GitHub access token in the JWT so we can call the GitHub API
      if (account?.provider === "github" && account.access_token) {
        token.githubAccessToken = account.access_token;
        token.githubLogin = token.login as string | undefined;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose the GitHub token on the client session object
      session.githubAccessToken = token.githubAccessToken as string | undefined;
      session.githubLogin = token.githubLogin as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
