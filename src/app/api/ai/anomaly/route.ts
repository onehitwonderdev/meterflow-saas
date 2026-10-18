import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AnomalyRequestSchema = z.object({
  customerId: z.string().uuid(),
  metricCode: z.string(),
  currentValue: z.number(),
  meanValue: z.number(),
  stdDev: z.number(),
  zScore: z.number(),
  timeWindow: z.string(), // e.g., "1h", "24h"
  orgId: z.string().uuid(),
});

const AnomalyResponseSchema = z.object({
  title: z.string(),
  summaryMarkdown: z.string(),
  rootCause: z.string(),
  contributingFactors: z.array(z.string()),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  recommendedActions: z.array(z.string()),
  chartConfig: z.object({
    type: z.enum(["line", "area", "bar"]),
    xAxisKey: z.string(),
    yAxisKey: z.string(),
  }).optional(),
});

// Deterministic mock anomalies for demo
const MOCK_ANOMALIES: Record<string, z.infer<typeof AnomalyResponseSchema>> = {
  "techcorp-gpu": {
    title: "GPU Seconds Spike - TechCorp Industries",
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
    severity: "CRITICAL",
    recommendedActions: [
      "Contact TechCorp immediately - their $50K hard spend cap will breach in ~6 hours at this rate",
      "Implement emergency per-customer rate limit on GPU endpoints (suggest 10 req/min)",
      "Add alert webhook for Z-score > 3.0 on GPU metrics",
      "Review TechCorp's integration for missing retry/backoff logic",
      "Consider temporary block if spend cap breach is imminent",
    ],
    chartConfig: {
      type: "area",
      xAxisKey: "hour",
      yAxisKey: "gpu_seconds",
    },
  },
  "dataflow-tokens": {
    title: "LLM Token Drop - DataFlow Labs",
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
    severity: "MEDIUM",
    recommendedActions: [
      "Create a composite metric 'total_llm_tokens' aggregating across all model-specific metrics",
      "Add dimension filter support to billable metrics for model grouping",
      "Notify DataFlow Labs about the metric split to avoid confusion",
      "Set up anomaly detection on the composite metric instead",
    ],
    chartConfig: {
      type: "line",
      xAxisKey: "hour",
      yAxisKey: "tokens",
    },
  },
  "cloudnine-storage": {
    title: "Storage Growth - CloudNine Solutions",
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
    severity: "LOW",
    recommendedActions: [
      "Confirm with CloudNine this is expected feature-launch growth",
      "Adjust soft alert threshold to 20 GB to avoid false alarms",
      "Monitor for plateau - if growth continues past 20 GB, investigate",
      "Consider volume discount tier for storage > 10 GB",
    ],
    chartConfig: {
      type: "bar",
      xAxisKey: "date",
      yAxisKey: "storage_gb",
    },
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AnomalyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, metricCode, currentValue, meanValue, stdDev, zScore, timeWindow, orgId } = parsed.data;

    // Deterministic mock for demo without API keys
    if (!process.env.GEMINI_API_KEY) {
      // Pick mock based on customer/metric combination
      let mockKey = "techcorp-gpu";

      if (metricCode.includes("token") && customerId !== "cus_001") {
        mockKey = "dataflow-tokens";
      } else if (metricCode.includes("storage") || metricCode.includes("vector")) {
        mockKey = "cloudnine-storage";
      }

      const mock = MOCK_ANOMALIES[mockKey];
      return NextResponse.json(mock);
    }

    // Real AI call with Gemini for root cause analysis
    const systemPrompt = `You are MeterFlow's Anomaly Detection Analyzer. Given statistical anomaly data and raw event properties, provide a root cause analysis.

Input Context:
- Customer ID: ${customerId}
- Metric: ${metricCode}
- Current Value: ${currentValue}
- 7-day Mean: ${meanValue}
- 7-day Std Dev: ${stdDev}
- Z-Score: ${zScore}
- Time Window: ${timeWindow}
- Organization: ${orgId}

The anomaly was detected using Z-score threshold of 3.0 on hourly rollup data.

Return a JSON object with:
{
  "title": "string",
  "summaryMarkdown": "string (markdown with statistical context)",
  "rootCause": "string (primary root cause hypothesis)",
  "contributingFactors": ["string"],
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendedActions": ["string"],
  "chartConfig": { "type": "line" | "area" | "bar", "xAxisKey": "string", "yAxisKey": "string" }
}

Severity Guidelines:
- CRITICAL: Hard spend cap breach imminent, runaway loop, security issue
- HIGH: Significant cost impact, sustained anomaly, customer impact
- MEDIUM: Notable pattern change, potential misconfiguration
- LOW: Expected growth, feature launch, seasonal pattern`;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: `Analyze this anomaly and provide root cause explanation with recommended actions.`,
      temperature: 0.2,
    });

    const parsedResponse = AnomalyResponseSchema.safeParse(JSON.parse(result.text));

    if (!parsedResponse.success) {
      console.error("Anomaly response parse error:", parsedResponse.error);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse.data);
  } catch (error) {
    console.error("Anomaly analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}