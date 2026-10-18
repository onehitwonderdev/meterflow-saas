"use client";

/* tslint:disable */
// eslint-disable-next-line @next/next/no-img-element
import { User, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const DEMO_ORG = {
  id: "org_acme_ai_cloud",
  name: "Acme AI Cloud",
  slug: "acme-ai-cloud",
  role: "owner",
};

const DEMO_USER = {
  id: "user_demo_owner",
  email: "owner@acme.ai",
  name: "Acme Owner",
};

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const handleSignIn = async () => {
    if (demoMode) {
      // Demo mode: bypass backend entirely, set localStorage session and redirect instantly
      const demoSession = {
        user: DEMO_USER,
        organization: DEMO_ORG,
        session: { id: "demo_session_" + Date.now(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
        isDemo: true,
      };
      localStorage.setItem("meterflow_demo_session", JSON.stringify(demoSession));
      window.location.href = "/overview";
    } else {
      // Regular auth flow (would use betterAuth in production)
      try {
        const auth = typeof window !== 'undefined' ? (window as any).betterAuth : null;
        if (auth) {
          const result = await auth.api.signInEmail({
            json: { identifier: email, password },
          });
          if (result?.session) {
            window.location.href = "/overview";
          }
        }
      } catch (error) {
        console.error("Sign in error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/70 rounded-xl p-8 border border-zinc-800">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-emerald-400" />
          <h2 className="ml-3 text-xl font-semibold text-white">
            MeterFlow Auth
          </h2>
        </div>

        {/* Demo Mode Toggle */}
        <div className="mb-6 border border-zinc-700 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-2">
            Don't have an account?{" "}
          </p>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="demo"
              checked={demoMode}
              onChange={() => setDemoMode(true)}
              className="w-4 h-4 rounded bg-emerald-600 border-zinc-600 cursor-pointer"
            />
            <span className="text-zinc-300">Explore Live Demo (No Signup Required)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="regular"
              checked={!demoMode}
              onChange={() => setDemoMode(false)}
              className="w-4 h-4 rounded bg-zinc-600 border-zinc-600 cursor-pointer"
            />
            <span className="text-zinc-300">Sign In / Register</span>
          </label>
        </div>

        {/* Demo Credentials Preview */}
        {demoMode && (
          <div className="mb-4 p-2 bg-zinc-800/50 rounded-lg text-sm">
            <span className="font-mono text-emerald-400">
              Email: owner@acme.ai / Password: demo123456
            </span>
          </div>
        )}

        {/* Regular Form */}
        {!demoMode && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSignIn();
            }}
          >
            <div>
              <label className="block text-sm text-zinc-400">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                type="email"
                required
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-zinc-100 focus:outline-none focus-border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-zinc-950 font-medium py-2 rounded hover:bg-emerald-500 transition-colors"
            >
              Sign In
            </button>
          </form>
        )}

        {/* Demo Mode Call-to-Action */}
        {demoMode && (
          <div className="mt-6 space-y-4">
            <p className="text-center text-zinc-500 text-xs">
              No account needed! Instantly experience MeterFlow with{" "}
              <span className="font-medium underline underline-emerald hover:text-emerald-300">
                Acme AI Cloud
              </span>
            </p>
            <Button
              onClick={handleSignIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-medium py-3 text-lg"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Enter Live Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}