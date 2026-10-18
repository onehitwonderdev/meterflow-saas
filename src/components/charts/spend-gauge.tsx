"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SpendGaugeProps {
  currentSpendMicros: bigint | number;
  hardCapMicros: bigint | number | null;
  softAlertThresholdMicros: bigint | number | null;
  className?: string;
}

export function SpendGauge({ currentSpendMicros, hardCapMicros, softAlertThresholdMicros, className }: SpendGaugeProps) {
  const current = typeof currentSpendMicros === "bigint" ? Number(currentSpendMicros) : currentSpendMicros;
  const hardCap = hardCapMicros === null ? null : (typeof hardCapMicros === "bigint" ? Number(hardCapMicros) : hardCapMicros);
  const softThreshold = softAlertThresholdMicros === null ? null : (typeof softAlertThresholdMicros === "bigint" ? Number(softAlertThresholdMicros) : softAlertThresholdMicros);

  const hasCap = hardCap !== null && hardCap > 0;
  const percent = hasCap ? Math.min((current / hardCap) * 100, 100) : 0;
  const isOverSoft = softThreshold !== null && current >= softThreshold;
  const isOverHard = hasCap && current >= hardCap;

  const getColor = () => {
    if (isOverHard) return "#f43f5e"; // rose
    if (isOverSoft) return "#f59e0b"; // amber
    return "#10b981"; // emerald
  };

  const formatMicro = (micros: number) => {
    const dollars = micros / 1_000_000;
    if (dollars >= 1) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(dollars);
    }
    return `$${dollars.toFixed(6)}`;
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percent / 100) * circumference;

  if (!hasCap) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="#27272a"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{formatMicro(current)}</span>
            <span className="text-xs text-zinc-400">No Cap</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
          {softThreshold && softThreshold > 0 && softThreshold < hardCap && (
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeDasharray={`${(softThreshold / hardCap) * circumference} ${circumference}`}
              strokeDashoffset={circumference}
              opacity="0.5"
            />
          )}
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{formatMicro(current)}</span>
          <span className="text-xs text-zinc-400">of {formatMicro(hardCap)}</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-zinc-400">
        <span>{Math.round(percent)}% utilized</span>
        {isOverSoft && <span className="text-amber-400">⚠ Soft limit exceeded</span>}
        {isOverHard && <span className="text-rose-400">🚫 Hard cap reached</span>}
      </div>
    </div>
  );
}