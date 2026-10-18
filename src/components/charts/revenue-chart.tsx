"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface RevenueDataPoint {
  date: string;
  mrr: number;
  arr: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("h-64 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg", className)}>
        <p className="text-zinc-500">No revenue data available</p>
      </div>
    );
  }

  const chartColors = {
    mrr: "#10b981",
    arr: "#6366f1",
  };

  return (
    <div className={cn("w-full h-64", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.mrr} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.mrr} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.arr} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.arr} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
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
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{ color: "#fafafa" }}
            formatter={(value: any) => [`$${typeof value === "number" ? value.toLocaleString() : "0"}`, ""]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
            layout="horizontal"
            align="center"
          />
          <Area
            type="monotone"
            dataKey="mrr"
            name="MRR"
            stroke={chartColors.mrr}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMrr)"
          />
          <Area
            type="monotone"
            dataKey="arr"
            name="ARR"
            stroke={chartColors.arr}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorArr)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}