"use client";

import * as React from "react";
import { Plus, Search, Filter, ChevronDown, ChevronRight, Eye, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
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

const mockCustomers: Customer[] = [
  {
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
  },
  {
    id: "cus_002",
    externalId: "cus_dataflow_001",
    name: "DataFlow Labs",
    email: "finance@dataflow.io",
    hardSpendCapMicros: 20000000000n,
    softAlertThresholdMicros: 15000000000n,
    currentPeriodSpendMicros: 8900000000n,
    isBlocked: false,
    metadata: { account_manager: "mike@meterflow.io", tier: "pro" },
    createdAt: "2026-01-05T14:30:00Z",
    planName: "Pro Scale Usage Plan",
    totalEvents: 32100,
  },
  {
    id: "cus_003",
    externalId: "cus_cloudnine_001",
    name: "CloudNine Solutions",
    email: "ops@cloudnine.io",
    hardSpendCapMicros: 10000000000n,
    softAlertThresholdMicros: 8000000000n,
    currentPeriodSpendMicros: 9500000000n,
    isBlocked: false,
    metadata: { account_manager: "lisa@meterflow.io", tier: "pro" },
    createdAt: "2026-01-10T09:15:00Z",
    planName: "Startup Essentials",
    totalEvents: 28900,
  },
  {
    id: "cus_004",
    externalId: "cus_apifirst_001",
    name: "APIFirst Startup",
    email: "cto@apifirst.io",
    hardSpendCapMicros: 5000000000n,
    softAlertThresholdMicros: 4000000000n,
    currentPeriodSpendMicros: 5200000000n,
    isBlocked: true,
    metadata: { account_manager: "tom@meterflow.io", tier: "startup" },
    createdAt: "2026-01-12T16:45:00Z",
    planName: "Startup Essentials",
    totalEvents: 19800,
  },
  {
    id: "cus_005",
    externalId: "cus_scaleup_001",
    name: "ScaleUp Ventures",
    email: "billing@scaleup.io",
    hardSpendCapMicros: null,
    softAlertThresholdMicros: null,
    currentPeriodSpendMicros: 3100000000n,
    isBlocked: false,
    metadata: { account_manager: "sarah@meterflow.io", tier: "growth" },
    createdAt: "2026-01-15T11:20:00Z",
    planName: "Enterprise Volume",
    totalEvents: 15600,
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isGrantCreditsOpen, setIsGrantCreditsOpen] = React.useState(false);
  const [grantCreditsCustomer, setGrantCreditsCustomer] = React.useState<Customer | null>(null);

  const filteredCustomers = React.useMemo(() => {
    return mockCustomers.filter((customer) => {
      if (searchQuery && !customer.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !customer.externalId.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !customer.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "blocked" && !customer.isBlocked) return false;
        if (statusFilter === "warning" && (!customer.softAlertThresholdMicros || customer.currentPeriodSpendMicros < customer.softAlertThresholdMicros)) return false;
        if (statusFilter === "active" && (customer.isBlocked || (customer.softAlertThresholdMicros && customer.currentPeriodSpendMicros >= customer.softAlertThresholdMicros))) return false;
      }
      return true;
    });
  }, [searchQuery, statusFilter]);

  const handleGrantCredits = (customer: Customer) => {
    setGrantCreditsCustomer(customer);
    setIsGrantCreditsOpen(true);
  };

  const getStatus = (customer: Customer) => {
    if (customer.isBlocked) return { label: "Blocked", variant: "destructive" as const, icon: AlertTriangle };
    if (customer.softAlertThresholdMicros && customer.currentPeriodSpendMicros >= customer.softAlertThresholdMicros) {
      return { label: "Warning", variant: "warning" as const, icon: AlertTriangle };
    }
    return { label: "Active", variant: "success" as const, icon: CheckCircle };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-zinc-400 mt-1">Manage customer accounts, spend caps, and credit grants</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by name, external ID, email..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Current Spend</TableHead>
                  <TableHead className="text-right">Hard Cap</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                      No customers match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const status = getStatus(customer);
                    const utilization = customer.hardSpendCapMicros
                      ? Math.min((Number(customer.currentPeriodSpendMicros) / Number(customer.hardSpendCapMicros)) * 100, 100)
                      : 0;

                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Link href={`/customers/${customer.id}`} className="hover:text-emerald-400 transition-colors">
                            <p className="font-medium text-white">{customer.name}</p>
                            <p className="text-xs text-zinc-400 font-mono">{customer.externalId}</p>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{customer.planName}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-white">
                          {formatMicroDollars(customer.currentPeriodSpendMicros)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-400">
                          {customer.hardSpendCapMicros ? formatMicroDollars(customer.hardSpendCapMicros) : "Unlimited"}
                        </TableCell>
                        <TableCell className="text-right text-zinc-300 font-mono">
                          {formatNumber(customer.totalEvents)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <status.icon className="h-3 w-3" /> {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/customers/${customer.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleGrantCredits(customer)}
                              disabled={customer.isBlocked}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer account with spend controls.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4 py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Display Name</Label>
                <Input id="customerName" placeholder="e.g., Acme Corporation" required />
              </div>
              <div>
                <Label htmlFor="externalId">External ID</Label>
                <Input id="externalId" placeholder="e.g., cus_acme_001" required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="billing@acme.io" required />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="hardCap">Hard Spend Cap (USD)</Label>
                <Input id="hardCap" type="number" placeholder="50000" />
              </div>
              <div>
                <Label htmlFor="softThreshold">Soft Alert Threshold (USD)</Label>
                <Input id="softThreshold" type="number" placeholder="40000" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Customer</Button>
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
              Add prepaid credits for {grantCreditsCustomer?.name}. Credits burn down first before invoicing.
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