import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For now, use a simple hardcoded check
        // TODO: Add bcrypt password hashing for production
        if (credentials.email === 'admin@local' && credentials.password === 'admin') {
          // Find or create the user in database
          const user = await prisma.user.upsert({
            where: { email: 'admin@local' },
            create: {
              email: 'admin@local',
              name: 'Admin',
              role: 'admin',
            },
            update: {},
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
