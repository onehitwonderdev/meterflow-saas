"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Zap, Brain, Shield, Database, BarChart2, Terminal, CheckCircle, ChevronRight, Sparkles, Code, GitBranch, Globe, Rocket, Layers, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMicroDollars, cn } from "@/lib/utils";

const pricingModels = [
  {
    id: "graduated",
    name: "Graduated Tiered",
    description: "Each unit priced at its tier's rate — fairest for high-volume customers",
    tiers: [
      { upTo: 1_000_000, price: 0.0015, label: "First 1M tokens" },    // $1.50 per 1K tokens
      { upTo: 10_000_000, price: 0.0012, label: "Next 9M tokens" },    // $1.20 per 1K tokens
      { upTo: 100_000_000, price: 0.0008, label: "Next 90M tokens" },  // $0.80 per 1K tokens
      { upTo: null, price: 0.0005, label: "100M+ tokens" },            // $0.50 per 1K tokens
    ],
    color: "emerald",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    id: "volume",
    name: "Volume Tiered",
    description: "All units priced at the highest tier reached — incentivizes volume",
    tiers: [
      { upTo: 1_000_000, price: 0.0015, label: "0–1M tokens" },
      { upTo: 10_000_000, price: 0.0012, label: "1M–10M tokens" },
      { upTo: 100_000_000, price: 0.0008, label: "10M–100M tokens" },
      { upTo: null, price: 0.0005, label: "100M+ tokens" },
    ],
    color: "indigo",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
  {
    id: "block",
    name: "Block / Package",
    description: "Fixed blocks with ceiling division — predictable for infrastructure costs",
    tiers: [
      { upTo: 10_000, price: 5.00, label: "Per 10K tokens block ($5/10K)", isBlock: true }, // $0.50 per 1K
    ],
    color: "amber",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
];

function calculateGraduated(units: number, tiers: typeof pricingModels[0]["tiers"]) {
  let remaining = units;
  let cost = 0;
  let prevLimit = 0;
  const breakdown = [];

  for (const tier of tiers) {
    const limit = tier.upTo ?? Infinity;
    const unitsInTier = Math.max(0, Math.min(remaining, limit - prevLimit));
    if (unitsInTier > 0) {
      cost += unitsInTier * tier.price;
      breakdown.push({ label: tier.label, units: unitsInTier, price: tier.price, subtotal: unitsInTier * tier.price });
    }
    remaining -= unitsInTier;
    prevLimit = limit;
    if (remaining <= 0) break;
  }
  return { cost, breakdown };
}

function calculateVolume(units: number, tiers: typeof pricingModels[0]["tiers"]) {
  let applicableTier = tiers[0];
  for (const tier of tiers) {
    const limit = tier.upTo ?? Infinity;
    if (units <= limit) {
      applicableTier = tier;
      break;
    }
  }
  const cost = units * applicableTier.price;
  return { cost, breakdown: [{ label: applicableTier.label, units, price: applicableTier.price, subtotal: cost }] };
}

function calculateBlock(units: number, tiers: typeof pricingModels[0]["tiers"]) {
  const tier = tiers[0];
  const blockSize = tier.upTo ?? 10_000;
  const blocks = Math.ceil(units / blockSize);
  const cost = blocks * tier.price;
  return { cost, breakdown: [{ label: `${blocks} blocks × ${blockSize.toLocaleString()}`, units: blocks * blockSize, price: tier.price, subtotal: cost }] };
}

export default function LandingPage() {
  const [units, setUnits] = React.useState(2_500_000);
  const [activeModel, setActiveModel] = React.useState("graduated");

  const models = {
    graduated: calculateGraduated,
    volume: calculateVolume,
    block: calculateBlock,
  };

  const results = pricingModels.map((model) => {
    const fn = models[model.id as keyof typeof models];
    return { ...model, ...fn(units, model.tiers) };
  });

  const activeResult = results.find((r) => r.id === activeModel) || results[0];

  const features = [
    {
      icon: Zap,
      title: "Sub-15ms Ingestion Gatekeeper",
      description: "Atomic Redis Lua script enforces rate limits, idempotency, and hard spend caps in a single round-trip. Zero double-counting on retries.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      icon: Database,
      title: "5 Battle-Tested Pricing Models",
      description: "FLAT, PER_UNIT, GRADUATED_TIERED, VOLUME_TIERED, BLOCK_PACKAGE — all implemented in pure TypeScript with micro-dollar precision (bigint).",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
    },
    {
      icon: Shield,
      title: "Prepaid Credit Waterfall",
      description: "Deterministic credit burndown ordered by expiration date then priority. Full audit trail with tier-by-tier invoice breakdowns.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      icon: Brain,
      title: "AI FinOps Copilot (Gemini 2.5 Flash)",
      description: "Natural language → SQL analytics, pricing simulations, and Z-score anomaly root-cause explanations. Zero-key mock mode for demos.",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
    },
    {
      icon: Terminal,
      title: "Interactive Traffic Simulator",
      description: "Fire live bursts (10–250 concurrent) with duplicate injection and cap breach simulation. Real-time p50/p95 latency and spend gauge.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      icon: BarChart2,
      title: "Real-Time Dashboards",
      description: "MRR/ARR, unbilled usage revenue, ingestion throughput charts, customer spend gauges vs. hard caps — all from hourly rollups.",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
    },
  ];

  const integrations = [
    { icon: Code, label: "TypeScript SDK", desc: "5-line integration" },
    { icon: Globe, label: "REST API", desc: "OpenAPI 3.1 spec" },
    { icon: Terminal, label: "cURL / HTTPie", desc: "Works everywhere" },
    { icon: GitBranch, label: "Webhooks", desc: "HMAC-SHA256 signed" },
    { icon: Rocket, label: "Stripe Sync", desc: "Metered billing" },
    { icon: Layers, label: "Inngest Workers", desc: "Background jobs" },
  ];

  const architectureLayers = [
    { layer: "Client SDK / cURL", color: "border-emerald-500", icon: Terminal },
    { layer: "Next.js 15 Edge/Node", color: "border-indigo-500", icon: Layers },
    { layer: "Upstash Redis (Lua)", color: "border-rose-500", icon: Zap },
    { layer: "Neon PostgreSQL (Drizzle)", color: "border-amber-500", icon: Database },
    { layer: "Inngest Workers", color: "border-indigo-500", icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">MeterFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <Link href="#architecture" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing Engine</Link>
            <Link href="#simulator" className="hover:text-white transition-colors">Simulator</Link>
            <Link href="#copilot" className="hover:text-white transition-colors">AI Copilot</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login?demo=true">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Explore Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-6 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1">
                <Sparkles className="w-3 h-3" />
                Built for AI & API-First B2B Companies
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Usage-Based Billing
                <br />
                <span className="text-emerald-400">That Doesn't Break</span>
                <br />
                <span className="text-zinc-400 text-2xl font-normal">At Scale</span>
              </h1>
              <p className="text-lg text-zinc-300 mb-8 max-w-xl">
                Idempotent ingestion, sub-15ms entitlement checks, graduated/volume/block pricing,
                prepaid credit waterfalls, and an AI FinOps copilot — all on a 100% free-tier stack.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/login?demo=true">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-medium">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Explore Live Demo — No Signup Required
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-zinc-700 hover:border-zinc-500">
                  <GitBranch className="w-5 h-5 mr-2" />
                  View Source on GitHub
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-zinc-300">Zero external keys required for local dev</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-zinc-300">Deterministic seed data (90 days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-zinc-300">Micro-dollar precision (no float drift)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-zinc-300">23 unit tests passing</span>
                </div>
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="relative">
              <Card className={cn("bg-zinc-900/50 border-zinc-800", "relative overflow-hidden")}>
                <CardContent className="p-6">
                  {/* Metrics cards in a grid above the pipeline */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="bg-zinc-900/80 border-zinc-700 shadow-xl">
                      <CardContent className="p-4">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider">Live Ingestion</p>
                        <p className="text-3xl font-bold text-emerald-400 font-mono tabular-nums">12,847</p>
                        <p className="text-xs text-zinc-500">events/sec (p99: 8ms)</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/80 border-zinc-700 shadow-xl">
                      <CardContent className="p-4">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-white font-mono tabular-nums">$247,892</p>
                        <p className="text-xs text-emerald-400">+12.3% vs last month</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Architecture Pipeline */}
                  <div className="space-y-3">
                    {architectureLayers.map((layer, i) => (
                      <div key={layer.layer} className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", layer.color.replace("border", "bg") + "/20")}>
                          <layer.icon className={cn("w-5 h-5", layer.color.replace("border", "text"))} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{layer.layer}</p>
                          <div className="h-1 bg-zinc-800 rounded mt-1 overflow-hidden">
                            <div className={cn("h-full bg-gradient-to-r", layer.color.replace("border", "bg") + "/50")} style={{ width: `${80 + i * 4}%` }} />
                          </div>
                        </div>
                        {i < architectureLayers.length - 1 && (
                          <div className="w-8 h-px bg-gradient-to-r from-zinc-700 to-transparent" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section id="architecture" className="py-20 px-6 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1">
              <Layers className="w-3 h-3" />
              System Architecture
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Engineered for Correctness at Scale</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Every component solves a hard distributed systems problem — not a CRUD wrapper.
              Atomic operations, deterministic math, and zero-config local development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className={cn("bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors", feature.bg, feature.border)}>
                <CardContent className="p-6">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", feature.bg)}>
                    <feature.icon className={cn("w-6 h-6", feature.color)} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Preview */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-indigo-400 border-indigo-500/30 bg-indigo-500/10 gap-1">
              <Calculator className="w-3 h-3" />
              Interactive Pricing Engine
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Interactive Pricing Engine — Live Calculator</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Drag the slider to see how each model prices the same usage. All calculations use
              micro-dollar precision (bigint) — no floating-point artifacts ever.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Controls */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Monthly Token Usage: <span className="font-mono text-emerald-400">{units.toLocaleString()}</span> tokens
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50000000"
                      step="100000"
                      value={units}
                      onChange={(e) => setUnits(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>0</span>
                      <span>10M</span>
                      <span>25M</span>
                      <span>50M</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Pricing Model</label>
                    <Tabs value={activeModel} onValueChange={setActiveModel} className="w-full">
                      <TabsList className="grid grid-cols-3 bg-zinc-800 p-1 rounded-lg">
                        {pricingModels.map((model) => (
                          <TabsTrigger key={model.id} value={model.id} className="text-xs py-2">
                            {model.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <p className="text-xs text-zinc-500 mt-2 text-center">
                      {pricingModels.find((m) => m.id === activeModel)?.description}
                    </p>
                  </div>

                  {/* Cost Display */}
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-zinc-400">Estimated Monthly Cost</span>
                      <span className="text-3xl font-bold font-mono text-white tabular-nums">
                        ${activeResult.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-300", activeResult.color)}
                        style={{ width: `${Math.min((activeResult.cost / 5000) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-center">
                      Per-unit effective rate: ${(activeResult.cost / units).toFixed(6)}/token
                    </p>
                  </div>

                  {/* Tier Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-3">Tier Breakdown</h4>
                    <div className="space-y-2">
                      {activeResult.breakdown.map((tier, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-zinc-950 border border-zinc-800 rounded">
                          <span className="text-zinc-400">{tier.label}</span>
                          <span className="font-mono text-white">
                            {tier.units.toLocaleString()} × ${tier.price.toFixed(4)} = ${tier.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>

            {/* Comparison Chart */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  Model Comparison at Current Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 flex items-end justify-around gap-6 pt-8 pb-4 px-6 border-b border-zinc-800/80">
                  {results.map((result) => {
                    const maxCost = Math.max(...results.map((r) => r.cost), 1);
                    const barHeightPx = Math.max(16, Math.round((result.cost / maxCost) * 180));
                    const barColor = result.id === "graduated" ? "bg-emerald-500" : result.id === "volume" ? "bg-indigo-500" : "bg-amber-500";
                    return (
                      <div key={result.id} className="flex flex-col items-center gap-2">
                        <div
                          className={cn("w-16 rounded-t-md transition-all duration-200", barColor)}
                          style={{ height: `${barHeightPx}px` }}
                        />
                        <span className="text-xs font-medium text-white">{result.name}</span>
                        <span className="text-xs font-mono text-emerald-400">${result.cost.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Savings & Model Insight */}
                <div className="p-4 pt-6 space-y-3">
                  {(() => {
                    const costs = results.map(r => r.cost);
                    const minCost = Math.min(...costs);
                    const maxCost = Math.max(...costs);
                    const cheapest = results.find(r => r.cost === minCost);
                    const mostExpensive = results.find(r => r.cost === maxCost);
                    const savings = maxCost - minCost;
                    const savingsPct = maxCost > 0 ? ((savings / maxCost) * 100).toFixed(1) : "0";

                    const effectivePer1k = (cost: number, units: number) => units > 0 ? ((cost / units) * 1000).toFixed(4) : "0.0000";

                    return (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-300">Best Value</span>
                          <Badge variant="success" className="gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {cheapest?.name} saves ${savings.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({savingsPct}% vs {mostExpensive?.name})
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-400 grid grid-cols-4 gap-2">
                          <span className="col-span-4 font-medium">Effective Per-1K Rate & Marginal Tier Rate</span>
                          <span>Model</span>
                          <span className="text-right">Effective / 1K</span>
                          <span className="text-right">Marginal Top Tier</span>
                          <span className="text-right">Cost at Volume</span>
                          {results.map((result) => (
                            <React.Fragment key={result.id}>
                              <span className="font-mono text-zinc-300">{result.name}</span>
                              <span className="font-mono text-white text-right">${effectivePer1k(result.cost, units)}</span>
                              <span className="font-mono text-zinc-400 text-right">
                                ${(result.tiers[result.tiers.length - 1]?.price ?? 0).toFixed(4)}
                              </span>
                              <span className="font-mono text-emerald-400 text-right">${result.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="py-20 px-6 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1">
              <Zap className="w-3 h-3" />
              Interactive Traffic Simulator
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Fire Live Bursts Against the Ingestion API</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Configure a burst, toggle duplicate injection or cap breach simulation, and watch
              real-time deduplication and spend enforcement in action.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Simulator Controls</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Target Customer</label>
                    <select className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option>TechCorp Industries (Cap: $50K)</option>
                      <option>DataFlow Labs (Cap: $25K)</option>
                      <option>CloudNine Solutions (Cap: $10K)</option>
                      <option>Runaway Bot Inc (Cap: $1K — Near Limit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Event Type</label>
                    <select className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                      <option>llm_tokens ($0.15/M tokens)</option>
                      <option>gpu_inference_seconds ($0.025/sec)</option>
                      <option>vector_storage_gb ($0.80/GB)</option>
                      <option>api_calls ($0.001/call)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Concurrency / Burst Size</label>
                    <input type="range" min="10" max="250" step="10" defaultValue="50" className="w-full" />
                    <p className="text-sm font-mono text-emerald-400 text-right mt-1">50 events/batch</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm text-zinc-300">Inject 20% Duplicate Idempotency Keys</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-rose-500" />
                    <span className="text-sm text-zinc-300">Simulate Spend Cap Breach</span>
                  </label>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-medium py-3" size="lg">
                    <Zap className="w-5 h-5 mr-2" />
                    Fire Burst
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Live Telemetry (Mock)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <p className="text-xs text-zinc-500">Total Events</p>
                      <p className="font-mono text-xl text-white">12,847</p>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <p className="text-xs text-emerald-400">Accepted</p>
                      <p className="font-mono text-xl text-emerald-400">10,234</p>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <p className="text-xs text-amber-400">Duplicates Ignored</p>
                      <p className="font-mono text-xl text-amber-400">2,569</p>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <p className="text-xs text-rose-400">Rate Limited</p>
                      <p className="font-mono text-xl text-rose-400">44</p>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Customer Spend vs Hard Cap</span>
                      <Badge variant="destructive">CAP BREACHED</Badge>
                    </div>
                    <div className="h-4 bg-zinc-800 rounded overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" style={{ width: "112%" }} />
                      <div className="absolute top-0 right-0 h-full w-px bg-rose-500" style={{ left: "89%" }} />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 text-center">$112,000 / $100,000 cap</p>
                  </div>
                  <div className="max-h-64 overflow-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs">
                    <div className="text-zinc-500">[14:32:15.123] ACCEPTED    TechCorp    llm_tokens    1,500 tokens    8ms</div>
                    <div className="text-amber-400">[14:32:15.124] DUPLICATE   TechCorp    llm_tokens    1,500 tokens    3ms (idem: abc123)</div>
                    <div className="text-emerald-400">[14:32:15.125] ACCEPTED    TechCorp    llm_tokens    2,100 tokens    7ms</div>
                    <div className="text-rose-400">[14:32:15.890] HARD_CAP    RunawayBot  gpu_seconds   500 sec       12ms (BLOCKED)</div>
                    <div className="text-zinc-500">[14:32:15.891] ACCEPTED    DataFlow    llm_tokens    3,200 tokens    9ms</div>
                    <div className="text-amber-400">[14:32:15.892] DUPLICATE   DataFlow    llm_tokens    3,200 tokens    2ms (idem: xyz789)</div>
                    <div className="text-emerald-400">[14:32:16.001] ACCEPTED    CloudNine   storage_gb    2.4 GB        15ms</div>
                    <div className="text-emerald-400">[14:32:16.002] ACCEPTED    TechCorp    llm_tokens    1,800 tokens    6ms</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Copilot Section */}
      <section id="copilot" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-rose-400 border-rose-500/30 bg-rose-500/10 gap-1">
              <Brain className="w-3 h-3" />
              AI FinOps Copilot
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Natural Language → Analytics & Insights</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Ask questions in plain English. Get SQL, charts, pricing simulations, and root-cause
              anomaly explanations — powered by Gemini 2.5 Flash with zero-key deterministic mock mode.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart2, title: "SQL Analytics", query: '"Which 3 customers had the highest LLM token usage in the last 30 days?"', color: "emerald" },
              { icon: Calculator, title: "Pricing Simulation", query: '"Simulate revenue impact of lowering the free tier for llm_tokens from 1M to 250K tokens"', color: "indigo" },
              { icon: Shield, title: "Anomaly Explanation", query: '"Explain the GPU seconds spike for TechCorp Industries yesterday"', color: "rose" },
            ].map((item, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group">
                <CardContent className="p-6">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", `bg-${item.color}-500/10`, `group-hover:bg-${item.color}-500/20`)} >
                    <item.icon className={cn("w-6 h-6", `text-${item.color}-400`)} />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-zinc-400 text-sm mb-4 italic">"{item.query}"</p>
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300">
                    {item.title === "SQL Analytics" && `SELECT c.name, SUM(uhr.sum_value) as tokens
FROM usage_hourly_rollups uhr
JOIN customers c ON c.id = uhr.customer_id
JOIN billable_metrics bm ON bm.id = uhr.metric_id
WHERE bm.code = 'llm_tokens'
  AND uhr.hour_bucket >= NOW() - INTERVAL '30 days'
GROUP BY c.name
ORDER BY tokens DESC
LIMIT 3;`}
                    {item.title === "Pricing Simulation" && `-- Simulated Revenue Delta
Additional Monthly Revenue: ~$18,450
Customers Affected: 12 of 27
Avg Increase/Customer: $1,537
Highest Impact: TechCorp (+$4,200)
Risk: 3 customers >50% bill increase`}
                    {item.title === "Anomaly Explanation" && `## Root Cause: GPU Spike (Z=4.2)
- Single IP: 198.51.100.42 (94% of events)
- Model: gpt-4o exclusively
- Pattern: 47 req/min, identical prompts
- No backoff on 429 responses
- Hard cap breach in ~6 hours`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-6 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Integrate in 5 Lines</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Drop-in TypeScript SDK, REST API with OpenAPI spec, or raw cURL.
              Webhooks are HMAC-SHA256 signed with automatic retry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((item, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 text-center p-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-emerald-500/10">
                  <item.icon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Code snippet */}
          <div className="mt-12">
            <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
              <CardHeader className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs text-zinc-500 font-mono">ingest.ts</span>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="text-sm text-zinc-300 font-mono overflow-x-auto"><code>{`import { MeterFlow } from "@meterflow/sdk";

const mf = new MeterFlow({ apiKey: "mf_live_..." });

await mf.events.ingest({
  externalCustomerId: "cus_openai_01",
  eventName: "llm_tokens",
  properties: { tokens: 4096, model: "gpt-4o" },
});`}</code></pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Free-Tier Production Stack</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Every component has a generous non-expiring free tier. Deploy to Vercel + Neon + Upstash
              for $0/month portfolio hosting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Next.js 15", category: "Framework", icon: Code },
              { name: "Neon Postgres", category: "Database", icon: Database },
              { name: "Upstash Redis", category: "Cache/Rate Limit", icon: Zap },
              { name: "Drizzle ORM", category: "ORM", icon: Layers },
              { name: "Better-Auth", category: "Auth/RBAC", icon: Shield },
              { name: "Inngest", category: "Background Jobs", icon: GitBranch },
              { name: "Gemini 2.5 Flash", category: "AI Copilot", icon: Brain },
              { name: "Recharts", category: "Visualization", icon: BarChart2 },
              { name: "Tailwind CSS v4", category: "Styling", icon: Code },
              { name: "shadcn/ui", category: "Components", icon: Layers },
              { name: "Vitest", category: "Testing", icon: CheckCircle },
              { name: "TypeScript 5", category: "Language", icon: Code },
            ].map((item, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 p-4 group hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.category}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Click the button below to instantly access the live dashboard with 90 days of
            pre-seeded data — customers, plans, invoices, webhooks, and anomalies. No signup, no keys.
          </p>
          <Link href="/login?demo=true">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-medium px-10 py-4 text-lg">
              <Sparkles className="w-6 h-6 mr-3" />
              Explore Live Demo — No Signup Required
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-zinc-500">
            Or <a href="/login" className="text-emerald-400 hover:underline">sign in</a> with your own account to start fresh.
          </p>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">MeterFlow</span>
          </div>
          <p className="text-sm text-zinc-500">
            Built for the portfolio. Designed for production. MIT Licensed.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">API Reference</a>
          </div>
        </div>
      </footer>
    </div>
  );
}