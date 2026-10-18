"use client";

/* tslint:disable */
// eslint-disable-next-line @next/next/no-img-element
import { UserPlus, Mail, Lock } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const auth = typeof window !== 'undefined' ? (window as any).betterAuth : null;

  const handleSignUp = async () => {
    try {
      if (demoMode) {
        // In demo mode, just redirect to the dashboard since the demo user
        // is already seeded in the database
        window.location.href = "/app/(dashboard)/overview";
      } else {
        if (auth) {
          const result = await auth.api.signUpEmail({
            json: {
              fullName,
              email,
              password,
            },
          });
          // Handle signup result
          if (result?.session) {
            window.location.href = "/app/(dashboard)/overview";
          }
        }
      }
    } catch (error) {
      console.error("Sign up error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/70 rounded-xl p-8 border border-zinc-800">
        <div className="flex items-center mb-6">
          <UserPlus className="h-6 w-6 text-emerald-400" />
          <h2 className="ml-3 text-xl font-semibold text-white">
            Create Account
          </h2>
        </div>

        {/* Demo Mode Toggle */}
        <div className="mb-6 border border-zinc-700 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-2">
            Already have an account?{" "}
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
            <span className="text-zinc-300">Explore Live Demo</span>
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
            <span className="text-zinc-300">Create Account</span>
          </label>
        </div>

        {/* Demo Mode Call-to-Action */}
        {demoMode && (
          <p className="mb-4 text-center text-zinc-500 text-xs">
            No signup needed! Instantly experience MeterFlow with{" "}
            <span className="font-medium underline underline-emerald hover:text-emerald-300">
              Acme AI Cloud
            </span>
          </p>
        )}

        {/* Regular Form */}
        {!demoMode && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSignUp();
            }}
          >
            <div>
              <label className="block text-sm text-zinc-400">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

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
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-zinc-950 font-medium py-2 rounded hover:bg-emerald-500 transition-colors"
            >
              Create Account
            </button>
          </form>
        )}

        {/* Demo Mode Invite */}
        {demoMode && (
          <p className="mt-6 text-center text-zinc-500 text-xs">
            Get instant access to{" "}
            <span className="font-medium underline underline-emerald hover:text-emerald-300">
              Acme AI Cloud
            </span>
            — pre-seeded with customers, plans, and 90 days of usage data.
          </p>
        )}
      </div>
    </div>
  );
}