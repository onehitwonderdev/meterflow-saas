"use client";

import * as React from "react";
import { Plus, Search, Edit, Trash2, Calculator, ChevronDown, ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatMicroDollars } from "@/lib/utils";

interface PricingTier {
  upToUnits: number | null;
  unitPriceMicros: number;
  flatFeeMicros: number;
  packageSizeUnits?: number;
}

interface PlanPrice {
  metricId: string;
  metricName: string;
  metricCode: string;
  pricingModel: "FLAT" | "PER_UNIT" | "GRADUATED_TIERED" | "VOLUME_TIERED" | "BLOCK_PACKAGE";
  includedFreeUnits: number;
  tiers: PricingTier[];
}

interface Plan {
  id: string;
  name: string;
  code: string;
  baseFeeMicros: bigint;
  billingInterval: "MONTHLY" | "ANNUAL";
  prices: PlanPrice[];
  createdAt: string;
}

const mockPlans: Plan[] = [
  {
    id: "plan_001",
    name: "Pro Scale Usage Plan",
    code: "pro_scale",
    baseFeeMicros: 5000000000n, // $5,000/month
    billingInterval: "MONTHLY",
    prices: [
      {
        metricId: "met_001",
        metricName: "LLM Input Tokens",
        metricCode: "llm_input_tokens",
        pricingModel: "GRADUATED_TIERED",
        includedFreeUnits: 1000000,
        tiers: [
          { upToUnits: 1000000, unitPriceMicros: 150, flatFeeMicros: 0 }, // $0.15/1K tokens
          { upToUnits: 10000000, unitPriceMicros: 120, flatFeeMicros: 0 }, // $0.12/1K tokens
          { upToUnits: null, unitPriceMicros: 100, flatFeeMicros: 0 }, // $0.10/1K tokens
        ],
      },
      {
        metricId: "met_002",
        metricName: "LLM Output Tokens",
        metricCode: "llm_output_tokens",
        pricingModel: "GRADUATED_TIERED",
        includedFreeUnits: 500000,
        tiers: [
          { upToUnits: 500000, unitPriceMicros: 600, flatFeeMicros: 0 }, // $0.60/1K tokens
          { upToUnits: 5000000, unitPriceMicros: 480, flatFeeMicros: 0 }, // $0.48/1K tokens
          { upToUnits: null, unitPriceMicros: 400, flatFeeMicros: 0 }, // $0.40/1K tokens
        ],
      },
      {
        metricId: "met_003",
        metricName: "API Calls",
        metricCode: "api_calls",
        pricingModel: "PER_UNIT",
        includedFreeUnits: 100000,
        tiers: [{ upToUnits: null, unitPriceMicros: 50, flatFeeMicros: 0 }], // $0.05/1K calls
      },
    ],
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "plan_002",
    name: "Startup Essentials",
    code: "startup_essentials",
    baseFeeMicros: 99000000n, // $99/month
    billingInterval: "MONTHLY",
    prices: [
      {
        metricId: "met_001",
        metricName: "LLM Input Tokens",
        metricCode: "llm_input_tokens",
        pricingModel: "PER_UNIT",
        includedFreeUnits: 100000,
        tiers: [{ upToUnits: null, unitPriceMicros: 200, flatFeeMicros: 0 }], // $0.20/1K tokens
      },
      {
        metricId: "met_003",
        metricName: "API Calls",
        metricCode: "api_calls",
        pricingModel: "PER_UNIT",
        includedFreeUnits: 10000,
        tiers: [{ upToUnits: null, unitPriceMicros: 100, flatFeeMicros: 0 }], // $0.10/1K calls
      },
    ],
    createdAt: "2026-01-12T14:30:00Z",
  },
  {
    id: "plan_003",
    name: "Enterprise Volume",
    code: "enterprise_volume",
    baseFeeMicros: 25000000000n, // $25,000/month
    billingInterval: "ANNUAL",
    prices: [
      {
        metricId: "met_001",
        metricName: "LLM Input Tokens",
        metricCode: "llm_input_tokens",
        pricingModel: "VOLUME_TIERED",
        includedFreeUnits: 5000000,
        tiers: [
          { upToUnits: 10000000, unitPriceMicros: 80, flatFeeMicros: 0 },
          { upToUnits: 50000000, unitPriceMicros: 60, flatFeeMicros: 0 },
          { upToUnits: null, unitPriceMicros: 40, flatFeeMicros: 0 },
        ],
      },
    ],
    createdAt: "2026-01-08T09:15:00Z",
  },
];

const pricingModelLabels = {
  FLAT: "Flat Fee",
  PER_UNIT: "Per Unit",
  GRADUATED_TIERED: "Graduated Tiered",
  VOLUME_TIERED: "Volume Tiered",
  BLOCK_PACKAGE: "Block/Package",
};

export default function PlansPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"plans" | "calculator">("plans");
  const [calculatorInput, setCalculatorInput] = React.useState({
    planId: "plan_001",
    metricId: "met_001",
    units: 5000000,
  });
  const [calculatorResult, setCalculatorResult] = React.useState<{ breakdown: any[]; total: number } | null>(null);

  const handleCalculatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = mockPlans.find((p) => p.id === calculatorInput.planId);
    const price = plan?.prices.find((p) => p.metricId === calculatorInput.metricId);
    if (!plan || !price) return;

    let total = 0;
    const breakdown = [];
    let remainingUnits = calculatorInput.units - price.includedFreeUnits;
    remainingUnits = Math.max(0, remainingUnits);

    for (const tier of price.tiers) {
      if (remainingUnits <= 0) break;
      const tierUnits = tier.upToUnits ? Math.min(remainingUnits, tier.upToUnits) : remainingUnits;
      const tierCost = (tierUnits * tier.unitPriceMicros) / 1000 + tier.flatFeeMicros;
      breakdown.push({
        fromUnits: calculatorInput.units - remainingUnits,
        toUnits: tier.upToUnits ? calculatorInput.units - remainingUnits + tierUnits : null,
        unitsInTier: tierUnits,
        unitPriceMicros: tier.unitPriceMicros,
        flatFeeMicros: tier.flatFeeMicros,
        subtotalMicros: tierCost,
      });
      total += tierCost;
      remainingUnits -= tierUnits;
    }

    setCalculatorResult({ breakdown, total });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pricing Plans</h1>
          <p className="text-zinc-400 mt-1">Manage pricing plans and test tier calculations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setActiveTab("calculator")}>
            <Calculator className="h-4 w-4 mr-2" />
            Tier Calculator
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "plans" | "calculator")}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="calculator">Tier Calculator</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-4">
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPlans
              .filter((plan) =>
                plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plan.code.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((plan) => (
                <Card key={plan.id} className="hover:border-zinc-700 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-zinc-400 font-mono">{plan.code}</p>
                      </div>
                      <Badge variant="outline">{plan.billingInterval}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-white">{formatMicroDollars(plan.baseFeeMicros)}</span>
                      <span className="text-zinc-400 ml-2">/ {plan.billingInterval === "MONTHLY" ? "month" : "year"}</span>
                    </div>
                    <div className="space-y-2">
                      {plan.prices.map((price) => (
                        <div key={price.metricId} className="text-sm">
                          <span className="text-zinc-300">{price.metricName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {pricingModelLabels[price.pricingModel]}
                          </Badge>
                          <div className="text-xs text-zinc-500 mt-1">
                            Free: {price.includedFreeUnits.toLocaleString()} {price.metricCode.includes("tokens") ? "tokens" : "units"} ·{" "}
                            {price.tiers.length} tier{price.tiers.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                      <Button variant="ghost" size="icon" className="flex-1" onClick={() => setActiveTab("calculator")}>
                        <Calculator className="h-4 w-4 mx-auto" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => console.log("Edit", plan.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-300" onClick={() => console.log("Delete", plan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {mockPlans.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-zinc-400 mb-4">No pricing plans defined yet</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Tier Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCalculatorSubmit} className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="planId">Pricing Plan</Label>
                      <Select value={calculatorInput.planId} onValueChange={(v) => setCalculatorInput({ ...calculatorInput, planId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} ({formatMicroDollars(plan.baseFeeMicros)}/{plan.billingInterval === "MONTHLY" ? "mo" : "yr"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="metricId">Billable Metric</Label>
                      <Select value={calculatorInput.metricId} onValueChange={(v) => setCalculatorInput({ ...calculatorInput, metricId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockPlans.find((p) => p.id === calculatorInput.planId)?.prices.map((price) => (
                            <SelectItem key={price.metricId} value={price.metricId}>
                              {price.metricName} ({pricingModelLabels[price.pricingModel]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="units">Units to Calculate</Label>
                    <Input
                      id="units"
                      type="number"
                      placeholder="e.g., 5000000"
                      value={calculatorInput.units}
                      onChange={(e) => setCalculatorInput({ ...calculatorInput, units: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Calculate Cost
                  </Button>
                </form>

                {calculatorResult && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                      <div className="flex items-baseline justify-between">
                        <span className="text-zinc-300">Total Cost (excluding base fee)</span>
                        <span className="text-2xl font-bold text-emerald-400">{formatMicroDollars(calculatorResult.total)}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-zinc-300 mb-2">Tier Breakdown</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tier</TableHead>
                            <TableHead className="text-right">Units</TableHead>
                            <TableHead className="text-right">Price/Unit</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculatorResult.breakdown.map((tier, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-sm">Tier {idx + 1}</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {tier.unitsInTier.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatMicroDollars(tier.unitPriceMicros * 1000)}/1K
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-emerald-400">
                                {formatMicroDollars(tier.subtotalMicros)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Graduated Tiered Pricing</h4>
                  <p className="text-sm text-zinc-400">
                    Units are priced at each tier's rate as they pass through. First 1M units at $0.15/1K, next 9M at $0.12/1K, etc.
                  </p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Volume Tiered Pricing</h4>
                  <p className="text-sm text-zinc-400">
                    All units priced at the highest applicable tier rate. If you use 15M units, all 15M priced at the $0.12/1K tier.
                  </p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Block/Package Pricing</h4>
                  <p className="text-sm text-zinc-400">
                    Units sold in fixed blocks (e.g., per 1,000). 1,500 units = 2 blocks. Uses ceiling division.
                  </p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Per Unit Pricing</h4>
                  <p className="text-sm text-zinc-400">
                    Simple flat rate per unit. Includes free units allowance before billing starts.
                  </p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Flat Fee</h4>
                  <p className="text-sm text-zinc-400">
                    Fixed price regardless of usage. Useful for platform access fees or feature bundles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>Define a new pricing plan with base fee and metric pricing.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4 py-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="planName">Plan Name</Label>
                <Input id="planName" placeholder="e.g., Pro Scale Usage Plan" />
              </div>
              <div>
                <Label htmlFor="planCode">Code</Label>
                <Input id="planCode" placeholder="e.g., pro_scale" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="baseFee">Base Fee (USD)</Label>
                <Input id="baseFee" type="number" placeholder="5000" />
              </div>
              <div>
                <Label htmlFor="billingInterval">Billing Interval</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="MONTHLY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}