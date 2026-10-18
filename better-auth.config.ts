import { defineBetterAuth } from "better-auth/next";
import postgres from "postgres";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = defineBetterAuth({
  database: postgres(process.env.DATABASE_URL!),
  trustedOrigins: ["http://localhost:3000"],
  desiredEmailRoles: ["owner", "admin", "developer", "finance", "viewer"],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    },
  },
  plugins: {
    // Organization / Multi-tenant plugin
    // This will be configured below
  },
  // RBAC and multi-tenant settings
  owner: (opts) => ({
    // The owner of the organization
    // Will be determined by the first user to create an org
  }),
  // Audit logging
  hooks: {
    afterCreateSession: async ({ session, user }) => {
      // Log session creation
    },
  },
});