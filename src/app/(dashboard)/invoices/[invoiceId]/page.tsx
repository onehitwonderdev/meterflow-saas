"use client";

import * as React from "react";
import { ArrowLeft, Download, RefreshCw, Eye, Check, X, DollarSign, CreditCard, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatMicroDollars } from "@/lib/utils";

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
  lineItems: InvoiceLineItem[];
}

interface InvoiceLineItem {
  id: string;
  description: string;
  metricCode: string;
  quantity: bigint;
  subtotalMicros: bigint;
  tierBreakdown: InvoiceTierBreakdown[];
}

interface InvoiceTierBreakdown {
  tierIndex: number;
  fromUnits: number;
  toUnits: number | null;
  unitsInTier: number;
  unitPriceMicros: number;
  subtotalMicros: number;
}

const mockInvoice: Invoice = {
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
  lineItems: [
    {
      id: "li_001",
      description: "LLM Input Tokens (gpt-4o)",
      metricCode: "llm_input_tokens",
      quantity: 12500000n,
      subtotalMicros: 1875000000n,
      tierBreakdown: [
        { tierIndex: 0, fromUnits: 0, toUnits: 1000000, unitsInTier: 1000000, unitPriceMicros: 150, subtotalMicros: 150000000 },
        { tierIndex: 1, fromUnits: 1000000, toUnits: 10000000, unitsInTier: 9000000, unitPriceMicros: 120, subtotalMicros: 1080000000 },
        { tierIndex: 2, fromUnits: 10000000, toUnits: null, unitsInTier: 2500000, unitPriceMicros: 100, subtotalMicros: 250000000 },
      ],
    },
    {
      id: "li_002",
      description: "LLM Output Tokens (gpt-4o)",
      metricCode: "llm_output_tokens",
      quantity: 4200000n,
      subtotalMicros: 2100000000n,
      tierBreakdown: [
        { tierIndex: 0, fromUnits: 0, toUnits: 500000, unitsInTier: 500000, unitPriceMicros: 600, subtotalMicros: 300000000 },
        { tierIndex: 1, fromUnits: 500000, toUnits: 5000000, unitsInTier: 3500000, unitPriceMicros: 480, subtotalMicros: 1680000000 },
        { tierIndex: 2, fromUnits: 5000000, toUnits: null, unitsInTier: 200000, unitPriceMicros: 400, subtotalMicros: 80000000 },
      ],
    },
    {
      id: "li_003",
      description: "API Calls",
      metricCode: "api_calls",
      quantity: 28500n,
      subtotalMicros: 1425000n,
      tierBreakdown: [
        { tierIndex: 0, fromUnits: 0, toUnits: null, unitsInTier: 28500, unitPriceMicros: 50, subtotalMicros: 1425000 },
      ],
    },
    {
      id: "li_004",
      description: "Storage (GB)",
      metricCode: "storage_gb",
      quantity: 150n,
      subtotalMicros: 750000000n,
      tierBreakdown: [
        { tierIndex: 0, fromUnits: 0, toUnits: null, unitsInTier: 150, unitPriceMicros: 5000000, subtotalMicros: 750000000 },
      ],
    },
  ],
};

const statusConfig = {
  DRAFT: { variant: "secondary" as const, label: "Draft" },
  FINALIZED: { variant: "info" as const, label: "Finalized" },
  PAID: { variant: "success" as const, label: "Paid" },
  VOID: { variant: "destructive" as const, label: "Void" },
  UNCOLLECTIBLE: { variant: "destructive" as const, label: "Uncollectible" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const [activeTab, setActiveTab] = React.useState<"details" | "line-items">("details");

  const invoice = mockInvoice;
  const config = statusConfig[invoice.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{invoice.number}</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-zinc-400 mt-1">{invoice.customerName} · {invoice.customerEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview PDF
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {invoice.status === "FINALIZED" && !invoice.stripeInvoiceId && (
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync to Stripe
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Header Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-zinc-400">Invoice Total</p>
            <p className="text-3xl font-bold text-white mt-1">{formatMicroDollars(invoice.totalPayableMicros)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-zinc-400">Billing Period</p>
            <p className="text-lg font-medium text-white mt-1">
              {new Date(invoice.periodStart).toLocaleDateString()} — {new Date(invoice.periodEnd).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-zinc-400">Issued Date</p>
            <p className="text-lg font-medium text-white mt-1">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-zinc-400">
              {invoice.status === "PAID" ? "Paid Date" : invoice.status === "FINALIZED" ? "Due Date" : "Status"}
            </p>
            <p className="text-lg font-medium text-white mt-1">
              {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : invoice.status}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "details" | "line-items")}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="details">Invoice Details</TabsTrigger>
          <TabsTrigger value="line-items">Line Items & Tier Breakdown</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="font-mono text-white">{formatMicroDollars(invoice.subtotalMicros)}</span>
                  </div>
                  {invoice.creditsAppliedMicros > 0n && (
                    <div className="flex justify-between text-sm text-amber-400 mt-2">
                      <span>Credits Applied</span>
                      <span className="font-mono">-{formatMicroDollars(invoice.creditsAppliedMicros)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-800 pt-3 mt-3 flex justify-between text-lg font-bold">
                    <span className="text-white">Total Payable</span>
                    <span className="text-emerald-400">{formatMicroDollars(invoice.totalPayableMicros)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <p className="text-sm text-zinc-400">Customer</p>
                    <p className="font-medium text-white mt-1">{invoice.customerName}</p>
                    <p className="text-sm text-zinc-400 mt-1">{invoice.customerEmail}</p>
                  </div>

                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <p className="text-sm text-zinc-400">Stripe Invoice</p>
                    <p className="font-mono text-sm text-white mt-1">
                      {invoice.stripeInvoiceId ? (
                        <Link href={`https://dashboard.stripe.com/invoices/${invoice.stripeInvoiceId}`} target="_blank" className="hover:text-emerald-400">
                          {invoice.stripeInvoiceId}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">Not synced</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <p className="text-sm text-zinc-400">Customer ID</p>
                  <p className="font-mono text-sm text-white mt-1">{invoice.customerId}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <p className="text-sm text-zinc-400">Invoice ID</p>
                  <p className="font-mono text-sm text-white mt-1">{invoice.id}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <p className="text-sm text-zinc-400">Status History</p>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Created as Draft — {new Date(invoice.issuedAt).toLocaleString()}</span>
                    </div>
                    {invoice.status !== "DRAFT" && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Finalized — {new Date(invoice.issuedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {invoice.status === "PAID" && invoice.paidAt && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Paid — {new Date(invoice.paidAt).toLocaleString()}</span>
                      </div>
                    )}
                    {invoice.stripeInvoiceId && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Synced to Stripe — {invoice.stripeInvoiceId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview PDF
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {invoice.status === "DRAFT" && (
                  <Button variant="outline" className="text-amber-400 border-amber-400 hover:bg-amber-400/10">
                    <FileText className="h-4 w-4 mr-2" />
                    Finalize Invoice
                  </Button>
                )}
                {invoice.status === "FINALIZED" && !invoice.stripeInvoiceId && (
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync to Stripe
                  </Button>
                )}
                {invoice.status === "FINALIZED" && invoice.stripeInvoiceId && (
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-sync to Stripe
                  </Button>
                )}
                {invoice.status === "PAID" && (
                  <Button variant="outline" className="text-rose-400 border-rose-400 hover:bg-rose-400/10">
                    <X className="h-4 w-4 mr-2" />
                    Void Invoice
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Line Items Tab */}
        <TabsContent value="line-items" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Line Items with Tier Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {invoice.lineItems.map((item, idx) => (
                  <div key={item.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                    {/* Line Item Header */}
                    <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{item.description}</p>
                          <p className="text-sm text-zinc-400 font-mono">{item.metricCode}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-zinc-400">Qty: <span className="font-mono text-white">{Number(item.quantity).toLocaleString()}</span></span>
                          <span className="text-emerald-400 font-mono font-semibold">{formatMicroDollars(item.subtotalMicros)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tier Breakdown Table */}
                    {item.tierBreakdown.length > 1 && (
                      <div className="p-4">
                        <p className="text-sm font-medium text-zinc-300 mb-3">Graduated Tier Breakdown</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tier</TableHead>
                              <TableHead className="text-right">Units in Tier</TableHead>
                              <TableHead className="text-right">Price per 1K Units</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.tierBreakdown.map((tier) => (
                              <TableRow key={tier.tierIndex}>
                                <TableCell className="font-mono text-sm">Tier {tier.tierIndex + 1}</TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {tier.unitsInTier.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {formatMicroDollars(tier.unitPriceMicros * 1000)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-emerald-400">
                                  {formatMicroDollars(tier.subtotalMicros)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}

                {/* Totals */}
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2" />
                    <div className="text-right">
                      <p className="text-zinc-400">Subtotal</p>
                      <p className="font-mono text-white text-lg">{formatMicroDollars(invoice.subtotalMicros)}</p>
                    </div>
                    {invoice.creditsAppliedMicros > 0n && (
                      <div className="text-right">
                        <p className="text-amber-400">Credits Applied</p>
                        <p className="font-mono text-amber-400 text-lg">-{formatMicroDollars(invoice.creditsAppliedMicros)}</p>
                      </div>
                    )}
                    <div className="text-right border-t border-zinc-800 pt-4">
                      <p className="text-white font-semibold">Total Payable</p>
                      <p className="font-mono text-emerald-400 text-xl">{formatMicroDollars(invoice.totalPayableMicros)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}