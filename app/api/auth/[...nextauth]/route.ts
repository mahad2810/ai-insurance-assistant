import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { v4 as uuidv4 } from "uuid";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
        
        try {
          const user = await authenticateUser(credentials.email, credentials.password);
          return user;
        } catch (error: any) {
          // Now handling specific error messages from authenticateUser
          const errorMessage = error.message || "Authentication failed";
          
          // These error messages will be displayed to the user in the UI
          if (errorMessage.includes("not found")) {
            throw new Error("No user found with this email");
          } else if (errorMessage.includes("password")) {
            throw new Error("Invalid password");
          } else if (errorMessage.includes("social login")) {
            throw new Error("Please use the social login option associated with this account");
          }
          
          // Generic fallback
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthUser).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            await User.create({
              userId: user.id || uuidv4(),
              email: user.email,
              name: user.name,
              image: user.image,
            });
          }
        } catch (error) {
          console.error("SignIn error:", error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Let browser handle domain
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
