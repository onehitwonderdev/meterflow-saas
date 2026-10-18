"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface IngestionDataPoint {
  time: string;
  accepted: number;
  duplicates: number;
  rateLimited: number;
  blocked: number;
}

interface IngestionChartProps {
  data: IngestionDataPoint[];
  className?: string;
}

export function IngestionChart({ data, className }: IngestionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("h-64 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg", className)}>
        <p className="text-zinc-500">No ingestion data available</p>
      </div>
    );
  }

  const colors = {
    accepted: "#10b981",
    duplicates: "#f59e0b",
    rateLimited: "#f43f5e",
    blocked: "#6366f1",
  };

  return (
    <div className={cn("w-full h-64", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#71717a"
            fontSize={12}
            tick={{ fill: "#71717a" }}
            axisLine={{ stroke: "#27272a" }}
            tickLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tick={{ fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{ color: "#fafafa" }}
            formatter={(value: any, name: any) => [typeof value === "number" ? value.toLocaleString() : "0", String(name || "")]}
          />
          <Bar dataKey="accepted" name="Accepted" fill={colors.accepted} radius={[4, 4, 0, 0]} />
          <Bar dataKey="duplicates" name="Duplicates" fill={colors.duplicates} radius={[4, 4, 0, 0]} />
          <Bar dataKey="rateLimited" name="Rate Limited" fill={colors.rateLimited} radius={[4, 4, 0, 0]} />
          <Bar dataKey="blocked" name="Blocked" fill={colors.blocked} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}