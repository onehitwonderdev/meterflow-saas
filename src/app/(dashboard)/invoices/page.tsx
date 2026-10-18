"use client";

import * as React from "react";
import { Search, Filter, ChevronDown, ChevronRight, Eye, Download, RefreshCw, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatMicroDollars, formatMicroDollarsCompact } from "@/lib/utils";
import Link from "next/link";

interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: "DRAFT" | "FINALIZED" | "PAID" | "VOID" | "UNCOLLECTIBLE";
  periodStart: string;
  periodEnd: string;
  subtotalMicros: bigint;
  creditsAppliedMicros: bigint;
  totalPayableMicros: bigint;
  stripeInvoiceId?: string;
  issuedAt: string;
  paidAt?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "inv_001",
    number: "INV-2026-0042",
    customerId: "cus_001",
    customerName: "TechCorp Industries",
    customerEmail: "billing@techcorp.io",
    status: "PAID",
    periodStart: "2026-01-01T00:00:00Z",
    periodEnd: "2026-01-31T23:59:59Z",
    subtotalMicros: 45000000000n,
    creditsAppliedMicros: 5000000000n,
    totalPayableMicros: 40000000000n,
    stripeInvoiceId: "in_1ABC123",
    issuedAt: "2026-02-01T10:00:00Z",
    paidAt: "2026-02-03T14:22:00Z",
  },
  {
    id: "inv_002",
    number: "INV-2026-0041",
    customerId: "cus_002",
    customerName: "DataFlow Labs",
    customerEmail: "finance@dataflow.io",
    status: "PAID",
    periodStart: "2026-01-01T00:00:00Z",
    periodEnd: "2026-01-31T23:59:59Z",
    subtotalMicros: 22500000000n,
    creditsAppliedMicros: 0n,
    totalPayableMicros: 22500000000n,
    stripeInvoiceId: "in_1ABC124",
    issuedAt: "2026-02-01T10:00:00Z",
    paidAt: "2026-02-05T09:15:00Z",
  },
  {
    id: "inv_003",
    number: "INV-2026-0040",
    customerId: "cus_003",
    customerName: "CloudNine Solutions",
    customerEmail: "ops@cloudnine.io",
    status: "FINALIZED",
    periodStart: "2026-01-01T00:00:00Z",
    periodEnd: "2026-01-31T23:59:59Z",
    subtotalMicros: 18750000000n,
    creditsAppliedMicros: 2000000000n,
    totalPayableMicros: 16750000000n,
    issuedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "inv_004",
    number: "INV-2026-0039",
    customerId: "cus_004",
    customerName: "APIFirst Startup",
    customerEmail: "cto@apifirst.io",
    status: "DRAFT",
    periodStart: "2026-02-01T00:00:00Z",
    periodEnd: "2026-02-28T23:59:59Z",
    subtotalMicros: 12500000000n,
    creditsAppliedMicros: 0n,
    totalPayableMicros: 12500000000n,
    issuedAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "inv_005",
    number: "INV-2026-0038",
    customerId: "cus_005",
    customerName: "ScaleUp Ventures",
    customerEmail: "billing@scaleup.io",
    status: "UNCOLLECTIBLE",
    periodStart: "2026-01-01T00:00:00Z",
    periodEnd: "2026-01-31T23:59:59Z",
    subtotalMicros: 8900000000n,
    creditsAppliedMicros: 0n,
    totalPayableMicros: 8900000000n,
    issuedAt: "2026-02-01T10:00:00Z",
  },
];

const statusConfig = {
  DRAFT: { variant: "secondary" as const, label: "Draft", color: "text-zinc-400" },
  FINALIZED: { variant: "info" as const, label: "Finalized", color: "text-indigo-400" },
  PAID: { variant: "success" as const, label: "Paid", color: "text-emerald-400" },
  VOID: { variant: "destructive" as const, label: "Void", color: "text-rose-400" },
  UNCOLLECTIBLE: { variant: "destructive" as const, label: "Uncollectible", color: "text-rose-400" },
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("all");

  const filteredInvoices = React.useMemo(() => {
    return mockInvoices.filter((invoice) => {
      if (searchQuery && !invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: Invoice["status"]) => {
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <p className="text-zinc-400 mt-1">Manage and track all customer invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Invoiced (All Time)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatMicroDollarsCompact(
                    mockInvoices.reduce((sum, inv) => sum + inv.totalPayableMicros, 0n)
                  )}
                </p>
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
                <p className="text-sm text-zinc-400">This Month</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatMicroDollarsCompact(
                    mockInvoices
                      .filter((inv) => inv.issuedAt.startsWith("2026-02") || inv.issuedAt.startsWith("2026-03"))
                      .reduce((sum, inv) => sum + inv.totalPayableMicros, 0n)
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-600/20 text-indigo-400">
                <RefreshCw className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending Collection</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatMicroDollarsCompact(
                    mockInvoices
                      .filter((inv) => inv.status === "FINALIZED")
                      .reduce((sum, inv) => sum + inv.totalPayableMicros, 0n)
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-600/20 text-amber-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Invoices</p>
                <p className="text-2xl font-bold text-white mt-1">{mockInvoices.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-600/20 text-rose-400">
                <Download className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by invoice number, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="FINALIZED">Finalized</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
                <SelectItem value="UNCOLLECTIBLE">Uncollectible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-zinc-500">
                      No invoices match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link href={`/invoices/${invoice.id}`} className="font-mono hover:text-emerald-400 transition-colors">
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{invoice.customerName}</p>
                          <p className="text-xs text-zinc-400">{invoice.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-zinc-300">
                          {new Date(invoice.periodStart).toLocaleDateString()} —{" "}
                          {new Date(invoice.periodEnd).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">
                        {formatMicroDollars(invoice.subtotalMicros)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-400">
                        {invoice.creditsAppliedMicros > 0n ? `-${formatMicroDollars(invoice.creditsAppliedMicros)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-white font-medium">
                        {formatMicroDollars(invoice.totalPayableMicros)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-zinc-400">
                        {new Date(invoice.issuedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}