"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950",
  {
    variants: {
      variant: {
        default: "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
        secondary: "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
        destructive: "border-rose-700 bg-rose-900/30 text-rose-400 hover:bg-rose-900/50",
        outline: "border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800",
        success: "border-emerald-700 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50",
        warning: "border-amber-700 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50",
        info: "border-indigo-700 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };