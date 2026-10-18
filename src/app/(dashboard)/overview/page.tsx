"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, DollarSign, Zap, Users, FileText, ArrowUpRight, AlertTriangle, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { IngestionChart } from "@/components/charts/ingestion-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMicroDollars, formatMicroDollarsCompact, formatNumber, formatPercent, cn } from "@/lib/utils";
import { InlineAnomalyCards } from "@/components/ai/AnomalyBadge";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  description?: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, iconColor, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="flex items-center gap-2 text-xs mt-1">
          {change && (
            <span className={cn(
              "flex items-center gap-1",
              changeType === "up" && "text-emerald-400",
              changeType === "down" && "text-rose-400",
              changeType === "neutral" && "text-zinc-400"
            )}>
              {changeType === "up" && <TrendingUp className="h-3 w-3" />}
              {changeType === "down" && <TrendingDown className="h-3 w-3" />}
              {change}
            </span>
          )}
          {description && <span className="text-zinc-500">{description}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

const mockRevenueData = [
  { date: "Jan", mrr: 12500, arr: 150000 },
  { date: "Feb", mrr: 14200, arr: 170400 },
  { date: "Mar", mrr: 16800, arr: 201600 },
  { date: "Apr", mrr: 19500, arr: 234000 },
  { date: "May", mrr: 22100, arr: 265200 },
  { date: "Jun", mrr: 25600, arr: 307200 },
  { date: "Jul", mrr: 28900, arr: 346800 },
  { date: "Aug", mrr: 31200, arr: 374400 },
  { date: "Sep", mrr: 34800, arr: 417600 },
  { date: "Oct", mrr: 38500, arr: 462000 },
  { date: "Nov", mrr: 41200, arr: 494400 },
  { date: "Dec", mrr: 45600, arr: 547200 },
];

const mockIngestionData = [
  { time: "00:00", accepted: 1240, duplicates: 12, rateLimited: 3, blocked: 0 },
  { time: "04:00", accepted: 890, duplicates: 8, rateLimited: 1, blocked: 0 },
  { time: "08:00", accepted: 2100, duplicates: 45, rateLimited: 12, blocked: 2 },
  { time: "12:00", accepted: 3450, duplicates: 89, rateLimited: 34, blocked: 5 },
  { time: "16:00", accepted: 2890, duplicates: 67, rateLimited: 23, blocked: 3 },
  { time: "20:00", accepted: 1680, duplicates: 23, rateLimited: 8, blocked: 1 },
];

const mockTopCustomers = [
  { id: "cus_001", name: "TechCorp Industries", email: "billing@techcorp.io", spend: 12500000, events: 45200, status: "active" },
  { id: "cus_002", name: "DataFlow Labs", email: "finance@dataflow.io", spend: 8900000, events: 32100, status: "active" },
  { id: "cus_003", name: "CloudNine Solutions", email: "ops@cloudnine.io", spend: 6700000, events: 28900, status: "active" },
  { id: "cus_004", name: "APIFirst Startup", email: "cto@apifirst.io", spend: 4300000, events: 19800, status: "warning" },
  { id: "cus_005", name: "ScaleUp Ventures", email: "billing@scaleup.io", spend: 3100000, events: 15600, status: "active" },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Overview</h1>
          <p className="text-zinc-400 mt-1">Real-time revenue, usage, and customer metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Live
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatMicroDollars(45600000000n)}
          change="+23.4%"
          changeType="up"
          icon={DollarSign}
          iconColor="bg-emerald-600/20 text-emerald-400"
          description="vs last month"
        />
        <StatCard
          title="Annual Recurring Revenue"
          value={formatMicroDollarsCompact(547200000000n)}
          change="+18.2%"
          changeType="up"
          icon={TrendingUp}
          iconColor="bg-indigo-600/20 text-indigo-400"
          description="projected"
        />
        <StatCard
          title="Unbilled Usage Revenue"
          value={formatMicroDollars(2800000000n)}
          change="+5.1%"
          changeType="up"
          icon={Zap}
          iconColor="bg-amber-600/20 text-amber-400"
          description="current period"
        />
        <StatCard
          title="Active Customers"
          value="247"
          change="+12"
          changeType="up"
          icon={Users}
          iconColor="bg-rose-600/20 text-rose-400"
          description="3 at risk"
        />
      </div>

      {/* Anomaly Detection */}
      <InlineAnomalyCards
        anomalies={[
          {
            id: "anom_001",
            title: "GPU Seconds Spike - TechCorp Industries",
            customerName: "TechCorp Industries",
            customerId: "cus_001",
            metricCode: "gpu_inference_seconds",
            zScore: 4.2,
            severity: "CRITICAL",
            detectedAt: "2026-01-15T15:00:00Z",
            summaryMarkdown: "",
            rootCause: "",
            contributingFactors: [],
            recommendedActions: [],
          },
          {
            id: "anom_002",
            title: "LLM Token Drop - DataFlow Labs",
            customerName: "DataFlow Labs",
            customerId: "cus_002",
            metricCode: "llm_input_tokens",
            zScore: -3.8,
            severity: "MEDIUM",
            detectedAt: "2026-01-15T14:00:00Z",
            summaryMarkdown: "",
            rootCause: "",
            contributingFactors: [],
            recommendedActions: [],
          },
          {
            id: "anom_003",
            title: "Storage Growth - CloudNine Solutions",
            customerName: "CloudNine Solutions",
            customerId: "cus_003",
            metricCode: "vector_storage_gb",
            zScore: 3.5,
            severity: "LOW",
            detectedAt: "2026-01-15T13:00:00Z",
            summaryMarkdown: "",
            rootCause: "",
            contributingFactors: [],
            recommendedActions: [],
          },
        ]}
      />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Revenue Trend
              <Badge variant="outline" className="ml-2">MRR / ARR</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={mockRevenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ingestion Throughput (24h)
              <Badge variant="outline" className="ml-2">Events/sec</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IngestionChart data={mockIngestionData} />
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Customers by Spend</CardTitle>
              <span className="text-xs text-zinc-500">Current billing period</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <p className="text-xs text-zinc-400">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">
                      {formatMicroDollars(customer.spend)}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300 font-mono">
                      {formatNumber(customer.events)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min((customer.spend / 50000000) * 100, 100)}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.status === "active" ? "success" : "warning"}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/customers/new" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Add Customer</p>
                <p className="text-xs text-zinc-400">Onboard new customer</p>
              </div>
            </a>
            <a href="/plans/new" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-white">Create Plan</p>
                <p className="text-xs text-zinc-400">Build pricing plan</p>
              </div>
            </a>
            <a href="/metrics/new" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-white">Define Metric</p>
                <p className="text-xs text-zinc-400">Create billable metric</p>
              </div>
            </a>
            <a href="/invoices" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="font-medium text-white">Generate Invoice</p>
                <p className="text-xs text-zinc-400">Run billing cycle</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}