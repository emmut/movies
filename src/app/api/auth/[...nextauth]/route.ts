import { env } from 'process';
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

const prisma = new PrismaClient();

const clientId = env.GITHUB_ID ?? '';
const clientSecret = env.GITHUB_SECRET ?? '';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId,
      clientSecret,
    }),
  ],
});

export { handler as GET, handler as POST };
