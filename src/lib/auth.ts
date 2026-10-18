import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";

export function createBetterAuth() {
  const auth = betterAuth({
    // Use memory adapter for development without database
    secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-me",

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
    },

    // Organize users into organizations (multi-tenant RBAC)
    owner: true,

    // Default roles
    defaultUserRole: "viewer",

    // Website and base URL
    website: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

    // Callbacks
    callbacks: {
      // Called after successful sign in
      afterSignIn: [] as any[],
    },
  });

  // Type assertion to expose commonly used methods
  // In production with drizzleAdapter, these would have full types
  return auth as any;
}

export const { auth, signIn, signUp, signOut, isAuthenticated, getUser } = createBetterAuth();