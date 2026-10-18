"use client";

import * as React from "react";
import Link from "next/link";
import { Gauge } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 mb-8 transition-colors">
          <Gauge className="h-8 w-8 text-emerald-400" />
          <span className="text-xl font-bold text-white">MeterFlow</span>
        </Link>
        {children}
      </div>
    </div>
  );
}