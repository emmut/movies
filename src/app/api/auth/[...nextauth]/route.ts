import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { env } from 'process';

const clientId = env.GITHUB_ID ?? '';
const clientSecret = env.GITHUB_SECRET ?? '';

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId,
      clientSecret,
    }),
  ],
});

export { handler as GET, handler as POST };
