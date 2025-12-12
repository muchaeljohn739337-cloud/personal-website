import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare, hash } from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { prisma } from './prismaClient';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Strict validation - require both email and password
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          throw new Error('Email and password are required');
        }

        // Validate password is not empty string
        if (credentials.password.trim().length === 0) {
          console.log('[AUTH] Empty password');
          throw new Error('Password cannot be empty');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          console.log('[AUTH] User not found:', credentials.email);
          throw new Error('Invalid credentials');
        }

        if (!user.password) {
          console.log('[AUTH] User has no password (OAuth user):', credentials.email);
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password for:', credentials.email);
          throw new Error('Invalid credentials');
        }

        // Check if user is suspended
        if (user.isSuspended) {
          console.log('[AUTH] User is suspended:', credentials.email);
          throw new Error('Your account has been suspended. Please contact support.');
        }

        // Check admin approval - Admins bypass approval check
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && !user.isApproved) {
          console.log('[AUTH] User not approved:', credentials.email);
          throw new Error(
            'Your account is pending admin approval. Please wait for approval before signing in.'
          );
        }

        console.log('[AUTH] Login successful for:', credentials.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Allow OAuth sign in
      if (account?.provider !== 'credentials') {
        // For OAuth users, check approval status
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isApproved: true, isSuspended: true },
        });

        if (!existingUser) return true; // New OAuth user

        // Admins bypass checks
        if (existingUser.role === 'ADMIN' || existingUser.role === 'SUPER_ADMIN') {
          return true;
        }

        // Check suspension
        if (existingUser.isSuspended) {
          return false;
        }

        // Check approval
        if (!existingUser.isApproved) {
          return false;
        }

        return true;
      }

      // For credentials, check is already done in authorize()
      // Email verification is optional for now
      return true;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Create default wallet for new users
        await prisma.wallet.create({
          data: {
            name: 'Primary Wallet',
            userId: user.id,
            type: 'PERSONAL',
          },
        });

        // Create token wallet with 0 balance (like a new bank account)
        await prisma.tokenWallet.create({
          data: {
            userId: user.id,
            balance: 0,
            lockedBalance: 0,
            lifetimeEarned: 0,
            lifetimeSpent: 0,
            tokenSymbol: 'ADV',
            exchangeRate: 0.1, // 1 ADV = $0.10 USD
          },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
