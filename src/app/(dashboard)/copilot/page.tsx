"use client";

import * as React from "react";
import { Sparkles, Brain, Zap, BarChart, AlertTriangle, TrendingUp, Search, Loader2, Copy, Check, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatMicroDollars, formatMicroDollarsCompact, cn } from "@/lib/utils";

const PROMPT_CATEGORIES = {
  analytics: [
    { label: "Top customers by token usage", query: "Which 3 customers had the highest LLM token usage in the last 30 days?" },
    { label: "Revenue by metric", query: "Show me revenue breakdown by billable metric for the current month" },
    { label: "Usage trends", query: "Show me usage trends for gpu_inference_seconds over the last 90 days" },
    { label: "Customer cohort analysis", query: "Compare usage patterns between Enterprise and Startup plan customers" },
  ],
  pricing: [
    { label: "Free tier impact", query: "Simulate revenue impact of lowering the free tier for llm_tokens from 1M to 250K tokens" },
    { label: "Volume discount modeling", query: "What would happen if we added a 20% volume discount tier at 10M tokens?" },
    { label: "Plan migration impact", query: "Estimate revenue change if we migrate all Starter customers to Pro plan" },
    { label: "Package pricing", query: "Simulate block/package pricing for storage_gb at $5 per 10GB" },
  ],
  anomalies: [
    { label: "GPU spike explanation", query: "Explain the GPU seconds spike for TechCorp Industries yesterday" },
    { label: "Token drop analysis", query: "Why did DataFlow Labs' token usage drop 77% in the last 24 hours?" },
    { label: "Storage growth", query: "Analyze the vector storage growth for CloudNine Solutions this week" },
    { label: "Rate limit patterns", query: "Show me customers hitting rate limits most frequently" },
  ],
  invoices: [
    { label: "Unpaid invoices", query: "Show me all unpaid invoices over $10,000" },
    { label: "Invoice aging", query: "List invoices past due by more than 30 days with customer details" },
    { label: "Credit utilization", query: "Show me credit grant burn rates across all customers" },
    { label: "Revenue recognition", query: "Break down recognized vs deferred revenue for Q1 2026" },
  ],
};

const MOCK_ANOMALIES = [
  {
    id: "anom_001",
    title: "GPU Seconds Spike - TechCorp Industries",
    customerName: "TechCorp Industries",
    customerId: "cus_001",
    metricCode: "gpu_inference_seconds",
    zScore: 4.2,
    severity: "CRITICAL" as const,
    detectedAt: "2026-01-15T15:00:00Z",
    summaryMarkdown: `## Anomaly Detected: GPU Inference Seconds Spike

**Customer**: TechCorp Industries (cus_001)
**Metric**: gpu_inference_seconds
**Time Window**: Last 1 hour (2026-01-15 14:00-15:00 UTC)
**Z-Score**: 4.2 (threshold: 3.0)
**Expected**: ~1,200 seconds/hour
**Actual**: 8,750 seconds/hour

### Statistical Context
- 7-day rolling mean (μ): 1,180 seconds/hour
- 7-day rolling std dev (σ): 1,800 seconds/hour
- Current hour (xₜ): 8,750 seconds
- Z = (8,750 - 1,180) / 1,800 = **4.21**`,
    rootCause: "Uncontrolled batch job from a single IP (198.51.100.42) making 47 requests/minute to the GPU inference endpoint with identical prompts. The customer's Python script appears to be in a tight loop without proper rate limiting or error handling.",
    contributingFactors: [
      "Single source IP: 198.51.100.42 (94% of events)",
      "Model: gpt-4o exclusively",
      "Request pattern: 47 req/min, identical prompts",
      "User-Agent: OpenAI/1.0 Python/3.11",
      "No exponential backoff on 429 responses",
      "Customer has no per-endpoint rate limits configured",
    ],
    recommendedActions: [
      "Contact TechCorp immediately - their $50K hard spend cap will breach in ~6 hours at this rate",
      "Implement emergency per-customer rate limit on GPU endpoints (suggest 10 req/min)",
      "Add alert webhook for Z-score > 3.0 on GPU metrics",
      "Review TechCorp's integration for missing retry/backoff logic",
      "Consider temporary block if spend cap breach is imminent",
    ],
    chartConfig: { type: "area", xAxisKey: "hour", yAxisKey: "gpu_seconds" },
  },
  {
    id: "anom_002",
    title: "LLM Token Drop - DataFlow Labs",
    customerName: "DataFlow Labs",
    customerId: "cus_002",
    metricCode: "llm_input_tokens",
    zScore: -3.8,
    severity: "MEDIUM" as const,
    detectedAt: "2026-01-15T14:00:00Z",
    summaryMarkdown: `## Anomaly Detected: LLM Input Tokens Drop

**Customer**: DataFlow Labs (cus_002)
**Metric**: llm_input_tokens
**Time Window**: Last 24 hours
**Z-Score**: -3.8 (threshold: ±3.0)
**Expected**: ~180,000 tokens/hour
**Actual**: 42,000 tokens/hour (77% drop)

### Statistical Context
- 7-day rolling mean (μ): 182,000 tokens/hour
- 7-day rolling std dev (σ): 36,500 tokens/hour
- Current 24h avg (xₜ): 42,000 tokens/hour
- Z = (42,000 - 182,000) / 36,500 = **-3.84**`,
    rootCause: "Customer migrated 80% of their workload to a new model (claude-3-5-sonnet) which uses a different event name (llm_tokens_claude). The original llm_input_tokens metric only tracks gpt-4o usage. Total combined token volume is actually up 12%.",
    contributingFactors: [
      "New model adoption: claude-3-5-sonnet (separate metric)",
      "80% traffic shifted to new event name",
      "No automated metric aggregation across models",
      "Dashboard shows partial picture without combined view",
    ],
    recommendedActions: [
      "Create a composite metric 'total_llm_tokens' aggregating across all model-specific metrics",
      "Add dimension filter support to billable metrics for model grouping",
      "Notify DataFlow Labs about the metric split to avoid confusion",
      "Set up anomaly detection on the composite metric instead",
    ],
    chartConfig: { type: "line", xAxisKey: "hour", yAxisKey: "tokens" },
  },
  {
    id: "anom_003",
    title: "Storage Growth - CloudNine Solutions",
    customerName: "CloudNine Solutions",
    customerId: "cus_003",
    metricCode: "vector_storage_gb",
    zScore: 3.5,
    severity: "LOW" as const,
    detectedAt: "2026-01-15T13:00:00Z",
    summaryMarkdown: `## Anomaly Detected: Vector Storage Growth

**Customer**: CloudNine Solutions (cus_003)
**Metric**: vector_storage_gb
**Time Window**: Last 7 days
**Z-Score**: 3.5 (threshold: 3.0)
**Expected**: ~2.1 GB (stable)
**Actual**: 12.4 GB (5.9x growth)

### Statistical Context
- 7-day rolling mean (μ): 2.3 GB
- 7-day rolling std dev (σ): 2.9 GB
- Current value (xₜ): 12.4 GB
- Z = (12.4 - 2.3) / 2.9 = **3.48**`,
    rootCause: "Customer enabled a new RAG pipeline that ingests their entire document corpus (4.2M documents) into vector storage. This is expected growth from a new feature launch, not a runaway process.",
    contributingFactors: [
      "New RAG feature launched 2026-01-08",
      "Bulk ingestion of 4.2M documents",
      "Embedding model: text-embedding-3-large (1,536 dims)",
      "Storage growth rate: ~1.5 GB/day during ingestion",
      "Expected to plateau at ~15 GB after ingestion completes",
    ],
    recommendedActions: [
      "Confirm with CloudNine this is expected feature-launch growth",
      "Adjust soft alert threshold to 20 GB to avoid false alarms",
      "Monitor for plateau - if growth continues past 20 GB, investigate",
      "Consider volume discount tier for storage > 10 GB",
    ],
    chartConfig: { type: "bar", xAxisKey: "date", yAxisKey: "storage_gb" },
  },
];

const severityConfig = {
  LOW: { variant: "secondary" as const, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: AlertTriangle },
  MEDIUM: { variant: "default" as const, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle },
  HIGH: { variant: "destructive" as const, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: Zap },
  CRITICAL: { variant: "destructive" as const, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: Zap },
};

function PromptChip({ label, query, onClick }: { label: string; query: string; onClick: (q: string) => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-auto px-3 py-2 text-left w-full justify-start"
      onClick={() => onClick(query)}
    >
      <Sparkles className="h-3 w-3 mr-2 text-emerald-400 flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}

function AnomalyCard({ anomaly }: { anomaly: typeof MOCK_ANOMALIES[0] }) {
  const config = severityConfig[anomaly.severity];
  const Icon = config.icon;

  return (
    <Card className={cn("hover:border-zinc-700 transition-colors cursor-pointer", config.border, "bg-zinc-900/50")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded", config.bg)}>
                <Icon className={cn("h-3 w-3", config.color)} />
              </div>
              <Badge variant={config.variant} className={cn("text-xs", config.color)}>
                {anomaly.severity}
              </Badge>
              <span className="text-xs text-zinc-500">Z: {anomaly.zScore.toFixed(1)}</span>
            </div>
            <h4 className="font-medium text-white truncate mb-1">{anomaly.title}</h4>
            <p className="text-xs text-zinc-400 font-mono">{anomaly.customerName} • {anomaly.metricCode}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {new Date(anomaly.detectedAt).toLocaleString()}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CopilotPage() {
  const [activeTab, setActiveTab] = React.useState<keyof typeof PROMPT_CATEGORIES>("analytics");
  const [query, setQuery] = React.useState("");
  const [response, setResponse] = React.useState<{
    intent: string;
    summaryMarkdown: string;
    chartConfig?: { type: string; xAxisKey: string; yAxisKey: string };
    recommendedAction: string;
    generatedSql?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleQuery = async (q: string) => {
    setQuery(q);
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
          orgId: "00000000-0000-0000-0000-000000000000",
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Copilot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderMarkdown = (markdown: string) => {
    return (
      <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
        {markdown.split("\n").map((line, i) => {
          if (line.startsWith("## ")) {
            return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.slice(3)}</h3>;
          }
          if (line.startsWith("### ")) {
            return <h4 key={i} className="text-base font-medium text-white mt-3 mb-1">{line.slice(4)}</h4>;
          }
          if (line.startsWith("|")) {
            return <div key={i} className="font-mono text-xs text-zinc-400">{line}</div>;
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return <li key={i} className="ml-4 mb-1">{line.slice(2)}</li>;
          }
          if (line.trim() === "") {
            return <br key={i} />;
          }
          return <p key={i} className="mb-2">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Brain className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI FinOps Copilot</h1>
              <p className="text-zinc-400 mt-1">Natural language analytics, pricing simulation, and anomaly explanation</p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by Gemini 2.5 Flash (Mock Mode)
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel - Prompt Library */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Prompt Library
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as keyof typeof PROMPT_CATEGORIES)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 text-xs">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>
              <TabsContent value="analytics" className="mt-4 space-y-2">
                {PROMPT_CATEGORIES.analytics.map((p, i) => (
                  <PromptChip key={i} label={p.label} query={p.query} onClick={handleQuery} />
                ))}
              </TabsContent>
              <TabsContent value="pricing" className="mt-4 space-y-2">
                {PROMPT_CATEGORIES.pricing.map((p, i) => (
                  <PromptChip key={i} label={p.label} query={p.query} onClick={handleQuery} />
                ))}
              </TabsContent>
              <TabsContent value="anomalies" className="mt-4 space-y-2">
                {PROMPT_CATEGORIES.anomalies.map((p, i) => (
                  <PromptChip key={i} label={p.label} query={p.query} onClick={handleQuery} />
                ))}
              </TabsContent>
              <TabsContent value="invoices" className="mt-4 space-y-2">
                {PROMPT_CATEGORIES.invoices.map((p, i) => (
                  <PromptChip key={i} label={p.label} query={p.query} onClick={handleQuery} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Panel - Chat & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Input */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuery((e.target as HTMLInputElement).value)}
                    placeholder="Ask anything: 'Why did TechCorp's GPU usage spike?' or 'Simulate 20% volume discount at 10M tokens'"
                    className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    disabled={isLoading}
                  />
                  {query && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-zinc-300"
                      onClick={() => setQuery("")}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => handleQuery(query)}
                  disabled={!query.trim() || isLoading}
                  size="lg"
                  className="whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Ask
                    </>
                  )}
                </Button>
              </div>
              {query && (
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Data stays in your org. SQL runs in read-only transactions with 2s timeout.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Response */}
          {response && (
            <Card className="border-l-4 border-emerald-500/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-400" />
                    Response
                  </CardTitle>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1">
                    {response.intent}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  {renderMarkdown(response.summaryMarkdown)}
                </div>

                {response.chartConfig && (
                  <Badge variant="outline" className="gap-1 text-zinc-300 border-zinc-700">
                    <BarChart className="h-3 w-3" />
                    Suggested Chart: {response.chartConfig.type} ({response.chartConfig.xAxisKey} vs {response.chartConfig.yAxisKey})
                  </Badge>
                )}

                {response.recommendedAction && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-emerald-400 mb-1">
                      <Zap className="h-4 w-4" />
                      Recommended Action
                    </div>
                    <p className="text-zinc-300">{response.recommendedAction}</p>
                  </div>
                )}

                {response.generatedSql && (
                  <details className="group">
                    <summary className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <AlertTriangle className="h-4 w-4" />
                      Generated SQL (read-only)
                      <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg relative">
                      <pre className="text-xs text-emerald-300 font-mono overflow-x-auto">{response.generatedSql}</pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-zinc-500 hover:text-zinc-300"
                        onClick={() => copyToClipboard(response.generatedSql!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* No response yet */}
          {!response && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="p-3 bg-emerald-500/20 rounded-full w-fit mx-auto mb-4">
                  <Brain className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to help</h3>
                <p className="text-zinc-400 mb-4 max-w-md mx-auto">
                  Select a prompt from the library or type your own question. I can analyze usage patterns, simulate pricing changes, explain anomalies, and query your billing data.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">Analytics</Badge>
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">Pricing Simulation</Badge>
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">Anomaly Detection</Badge>
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">Invoice Queries</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomaly Detection Center */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Anomaly Detection Center
                </CardTitle>
                <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                  {MOCK_ANOMALIES.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-96">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {MOCK_ANOMALIES.map((anomaly) => (
                    <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}