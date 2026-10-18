"use client";

import * as React from "react";
import { ArrowLeft, Edit, DollarSign, CreditCard, AlertTriangle, CheckCircle, Download, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatMicroDollars, formatMicroDollarsCompact, formatNumber } from "@/lib/utils";
import { SpendGauge } from "@/components/charts/spend-gauge";

interface Customer {
  id: string;
  externalId: string;
  name: string;
  email: string;
  stripeCustomerId?: string;
  hardSpendCapMicros: bigint | null;
  softAlertThresholdMicros: bigint | null;
  currentPeriodSpendMicros: bigint;
  isBlocked: boolean;
  metadata: Record<string, string>;
  createdAt: string;
  planName?: string;
  totalEvents: number;
}

const mockCustomer: Customer = {
  id: "cus_001",
  externalId: "cus_techcorp_001",
  name: "TechCorp Industries",
  email: "billing@techcorp.io",
  stripeCustomerId: "cus_techcorp_001",
  hardSpendCapMicros: 50000000000n,
  softAlertThresholdMicros: 40000000000n,
  currentPeriodSpendMicros: 42500000000n,
  isBlocked: false,
  metadata: { account_manager: "sarah@meterflow.io", tier: "enterprise" },
  createdAt: "2026-01-01T10:00:00Z",
  planName: "Pro Scale Usage Plan",
  totalEvents: 45200,
};

const mockCreditGrants = [
  {
    id: "cg_001",
    name: "Q3 Promotional Credits",
    initialAmountMicros: 10000000000n,
    remainingAmountMicros: 3500000000n,
    priority: 1,
    expiresAt: "2026-03-31T23:59:59Z",
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: "cg_002",
    name: "Enterprise Onboarding Credit",
    initialAmountMicros: 50000000000n,
    remainingAmountMicros: 50000000000n,
    priority: 2,
    expiresAt: "2026-12-31T23:59:59Z",
    createdAt: "2026-01-15T10:00:00Z",
  },
];

const mockUsageByMetric = [
  { metric: "LLM Input Tokens", code: "llm_input_tokens", units: 12500000, cost: 1875000000 },
  { metric: "LLM Output Tokens", code: "llm_output_tokens", units: 4200000, cost: 2100000000 },
  { metric: "API Calls", code: "api_calls", units: 28500, cost: 1425000 },
  { metric: "Storage (GB)", code: "storage_gb", units: 150, cost: 750000000 },
];

const mockInvoices = [
  { id: "inv_001", number: "INV-2026-0012", status: "PAID", period: "Jan 2026", total: 38500000000n, date: "2026-02-01" },
  { id: "inv_002", number: "INV-2026-0008", status: "PAID", period: "Dec 2025", total: 35200000000n, date: "2026-01-01" },
  { id: "inv_003", number: "INV-2026-0003", status: "FINALIZED", period: "Feb 2026", total: 42100000000n, date: "2026-03-01" },
];

const mockEvents = [
  { id: "evt_001", eventName: "llm_tokens", timestamp: "2026-01-15T14:32:18Z", outcome: "ACCEPTED", units: 1500 },
  { id: "evt_002", eventName: "llm_tokens", timestamp: "2026-01-15T14:31:45Z", outcome: "ACCEPTED", units: 2100 },
  { id: "evt_003", eventName: "api_calls", timestamp: "2026-01-15T14:30:12Z", outcome: "ACCEPTED", units: 1 },
  { id: "evt_004", eventName: "llm_tokens", timestamp: "2026-01-15T14:28:33Z", outcome: "DUPLICATE_IGNORED", units: 1500 },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const [activeTab, setActiveTab] = React.useState<"overview" | "usage" | "credits" | "invoices" | "events">("overview");
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isGrantCreditsOpen, setIsGrantCreditsOpen] = React.useState(false);

  const customer = mockCustomer;

  const getStatus = () => {
    if (customer.isBlocked) return { label: "Blocked", variant: "destructive" as const, icon: AlertTriangle };
    if (customer.softAlertThresholdMicros && customer.currentPeriodSpendMicros >= customer.softAlertThresholdMicros) {
      return { label: "Warning", variant: "warning" as const, icon: AlertTriangle };
    }
    return { label: "Active", variant: "success" as const, icon: CheckCircle };
  };

  const status = getStatus();
  const utilization = customer.hardSpendCapMicros
    ? Math.min((Number(customer.currentPeriodSpendMicros) / Number(customer.hardSpendCapMicros)) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{customer.name}</h1>
              <Badge variant={status.variant} className="gap-1">
                <status.icon className="h-3 w-3" /> {status.label}
              </Badge>
            </div>
            <p className="text-zinc-400 mt-1">{customer.email} · {customer.externalId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={() => setIsGrantCreditsOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Grant Credits
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Current Period Spend</p>
                <p className="text-2xl font-bold text-white mt-1">{formatMicroDollars(customer.currentPeriodSpendMicros)}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-600/20 text-emerald-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Hard Spend Cap</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {customer.hardSpendCapMicros ? formatMicroDollars(customer.hardSpendCapMicros) : "Unlimited"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-600/20 text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Utilization</p>
                <p className="text-2xl font-bold text-white mt-1">{Math.round(utilization)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-600/20 text-indigo-400">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Events (Period)</p>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(customer.totalEvents)}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-600/20 text-rose-400">
                <RefreshCw className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spend Gauge & Plan Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend Gauge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <SpendGauge
                currentSpendMicros={customer.currentPeriodSpendMicros}
                hardCapMicros={customer.hardSpendCapMicros}
                softAlertThresholdMicros={customer.softAlertThresholdMicros}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mt-6 text-center">
              <div className="p-4 bg-zinc-900/50 rounded-lg">
                <p className="text-sm text-zinc-400">Spent</p>
                <p className="text-xl font-bold text-white mt-1">{formatMicroDollars(customer.currentPeriodSpendMicros)}</p>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-lg">
                <p className="text-sm text-zinc-400">Remaining</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {customer.hardSpendCapMicros
                    ? formatMicroDollars(Number(customer.hardSpendCapMicros) - Number(customer.currentPeriodSpendMicros))
                    : "Unlimited"}
                </p>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-lg">
                <p className="text-sm text-zinc-400">Soft Threshold</p>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {customer.softAlertThresholdMicros ? formatMicroDollars(customer.softAlertThresholdMicros) : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <p className="text-sm text-zinc-400">Current Plan</p>
              <p className="text-lg font-semibold text-white mt-1">{customer.planName}</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <p className="text-sm text-zinc-400">Stripe Customer ID</p>
              <p className="text-sm font-mono text-white mt-1">{customer.stripeCustomerId || "Not linked"}</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <p className="text-sm text-zinc-400">Account Manager</p>
              <p className="text-sm text-white mt-1">{customer.metadata.account_manager || "Unassigned"}</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <p className="text-sm text-zinc-400">Customer Since</p>
              <p className="text-sm text-white mt-1">{new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "overview" | "usage" | "credits" | "invoices" | "events")}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Breakdown</TabsTrigger>
          <TabsTrigger value="credits">Credit Grants</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Metric (Current Period)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Est. Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsageByMetric.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.metric}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(item.units)}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-400">
                          {formatMicroDollars(item.cost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Credit Grants Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsGrantCreditsOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Grant Credits
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mockCreditGrants.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">No credit grants available</p>
                ) : (
                  <div className="space-y-3">
                    {mockCreditGrants.map((grant) => (
                      <div key={grant.id} className="p-4 bg-zinc-900/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{grant.name}</p>
                            <p className="text-xs text-zinc-400">
                              Priority {grant.priority} · Expires {new Date(grant.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">
                              {formatMicroDollars(grant.remainingAmountMicros)}
                            </p>
                            <p className="text-xs text-zinc-500">
                              of {formatMicroDollars(grant.initialAmountMicros)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{
                              width: `${(Number(grant.remainingAmountMicros) / Number(grant.initialAmountMicros)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Metric (Current Period)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Units Consumed</TableHead>
                    <TableHead className="text-right">Estimated Cost</TableHead>
                    <TableHead>Pricing Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsageByMetric.map((item) => (
                    <TableRow key={item.code}>
                      <TableCell>{item.metric}</TableCell>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(item.units)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-400">
                        {formatMicroDollars(item.cost)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Graduated Tiered</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Credit Grants (Waterfall Burndown)</CardTitle>
                <Button onClick={() => setIsGrantCreditsOpen(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Grant Credits
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mockCreditGrants.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400 mb-4">No credit grants yet</p>
                  <Button onClick={() => setIsGrantCreditsOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Grant First Credits
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grant Name</TableHead>
                      <TableHead>Initial Amount</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">Burned</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCreditGrants.map((grant) => {
                      const burned = Number(grant.initialAmountMicros) - Number(grant.remainingAmountMicros);
                      const percentUsed = (burned / Number(grant.initialAmountMicros)) * 100;
                      const isExpired = new Date(grant.expiresAt) < new Date();
                      const isDepleted = grant.remainingAmountMicros === 0n;

                      return (
                        <TableRow key={grant.id}>
                          <TableCell>
                            <p className="font-medium text-white">{grant.name}</p>
                            <p className="text-xs text-zinc-400">Created {new Date(grant.createdAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="font-mono">{formatMicroDollars(grant.initialAmountMicros)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-400">
                            {formatMicroDollars(grant.remainingAmountMicros)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-rose-400">
                            {formatMicroDollars(burned)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">Priority {grant.priority}</Badge>
                          </TableCell>
                          <TableCell>{new Date(grant.expiresAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isDepleted ? "secondary" : isExpired ? "destructive" : "success"
                              }
                            >
                              {isDepleted ? "Depleted" : isExpired ? "Expired" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.number}</TableCell>
                      <TableCell>{invoice.period}</TableCell>
                      <TableCell className="text-right font-mono text-white">
                        {formatMicroDollars(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "PAID"
                              ? "success"
                              : invoice.status === "FINALIZED"
                              ? "info"
                              : "warning"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Idempotency Key</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEvents.map((event) => {
                    const outcomeColors = {
                      ACCEPTED: "success",
                      DUPLICATE_IGNORED: "warning",
                      RATE_LIMITED: "destructive",
                      HARD_CAP_BLOCKED: "destructive",
                      INVALID: "secondary",
                    };
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{event.eventName}</TableCell>
                        <TableCell className="text-right font-mono">{event.units.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={outcomeColors[event.outcome as keyof typeof outcomeColors] as "default" | "destructive" | "info" | "outline" | "secondary" | "success" | "warning"}>{event.outcome}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400 max-w-[200px] truncate">
                          {event.id}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details and spend controls.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4 py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Display Name</Label>
                <Input id="customerName" defaultValue={customer.name} required />
              </div>
              <div>
                <Label htmlFor="externalId">External ID</Label>
                <Input id="externalId" defaultValue={customer.externalId} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={customer.email} required />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="hardCap">Hard Spend Cap (USD)</Label>
                <Input
                  id="hardCap"
                  type="number"
                  defaultValue={customer.hardSpendCapMicros ? Number(customer.hardSpendCapMicros) / 1_000_000 : ""}
                />
              </div>
              <div>
                <Label htmlFor="softThreshold">Soft Alert Threshold (USD)</Label>
                <Input
                  id="softThreshold"
                  type="number"
                  defaultValue={customer.softAlertThresholdMicros ? Number(customer.softAlertThresholdMicros) / 1_000_000 : ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grant Credits Dialog */}
      <Dialog open={isGrantCreditsOpen} onOpenChange={setIsGrantCreditsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Prepaid Credits</DialogTitle>
            <DialogDescription>
              Add prepaid credits for {customer.name}. Credits burn down first before invoicing (waterfall by priority).
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 py-4">
            <div>
              <Label htmlFor="grantName">Grant Name</Label>
              <Input id="grantName" placeholder="e.g., Q4 Promotional Credits" required />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input id="amount" type="number" placeholder="1000" required />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="1 (Highest)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Highest (Burns first)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 - Lowest (Burns last)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input id="expiresAt" type="datetime-local" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGrantCreditsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Grant Credits</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}