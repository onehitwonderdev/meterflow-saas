import { NextResponse } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Deterministic mock responses for demo without API keys
const MOCK_RESPONSES = [
  {
    intent: "SQL_ANALYTICS",
    summaryMarkdown: "## Top Customers by LLM Token Usage (Last 30 Days)\n\nBased on the hourly rollups, here are the top 5 customers by token consumption:\n\n| Customer | Tokens Used | Est. Cost | Trend |\n|----------|-------------|-----------|-------|\n| TechCorp Industries | 4.2M | $630.00 | ↗️ +12% |\n| DataFlow Labs | 3.8M | $570.00 | → Stable |\n| CloudNine Solutions | 2.1M | $315.00 | ↘️ -8% |\n| APIFirst Startup | 1.5M | $225.00 | ↗️ +23% |\n| ScaleUp Ventures | 980K | $147.00 | → Stable |",
    chartConfig: {
      type: "bar",
      xAxisKey: "customer",
      yAxisKey: "tokens",
    },
    recommendedAction: "Consider reaching out to TechCorp and APIFirst Startup about volume discounts as their usage is trending upward.",
  },
  {
    intent: "PRICING_SIMULATION",
    summaryMarkdown: "## Pricing Simulation: Lowering Free Tier from 1M to 250K Tokens\n\nIf you reduce the free tier for `llm_tokens` from 1,000,000 to 250,000 tokens:\n\n- **Additional Monthly Revenue**: ~$18,450\n- **Customers Affected**: 12 of 27 active customers\n- **Average Increase per Customer**: $1,537/month\n- **Highest Impact**: TechCorp Industries (+$4,200/month)\n\n**Risk Assessment**: 3 customers (11%) would see >50% bill increase. Consider grandfathering or phased rollout.",
    chartConfig: {
      type: "line",
      xAxisKey: "customer",
      yAxisKey: "revenue_delta",
    },
    recommendedAction: "Implement a 60-day notice period with usage alerts at 75% of new free tier to minimize churn risk.",
  },
  {
    intent: "ANOMALY_EXPLANATION",
    summaryMarkdown: "## Anomaly Detected: TechCorp Industries - GPU Seconds Spike\n\n**Z-Score**: 4.2 (threshold: 3.0)\n**Time**: 2026-01-15 14:00-15:00 UTC\n**Expected**: ~1,200 GPU seconds/hour\n**Actual**: 8,750 GPU seconds/hour\n\n### Root Cause Analysis\nThe spike correlates with:\n- **Single IP**: 198.51.100.42 (94% of events)\n- **Model**: `gpt-4o` exclusively\n- **Pattern**: Tight loop - 47 requests/minute with identical prompts\n- **Customer Agent**: `OpenAI/1.0 Python/3.11`\n\nThis appears to be an uncontrolled batch job or runaway script rather than organic growth.",
    chartConfig: {
      type: "area",
      xAxisKey: "hour",
      yAxisKey: "gpu_seconds",
    },
    recommendedAction: "Contact TechCorp immediately. Their hard spend cap ($50K) will be breached within 6 hours at this rate. Suggest implementing per-customer rate limits on GPU endpoints.",
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, orgId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // If no API key, return deterministic mock response
    if (!process.env.GEMINI_API_KEY) {
      // Simulate streaming by returning a mock response
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let mockIndex = 0;

      if (lastMessage.includes("spike") || lastMessage.includes("anomaly") || lastMessage.includes("unusual")) {
        mockIndex = 2;
      } else if (lastMessage.includes("simulat") || lastMessage.includes("pricing") || lastMessage.includes("free tier")) {
        mockIndex = 1;
      }

      const mockResponse = MOCK_RESPONSES[mockIndex];

      // Return as a stream-like response
      return NextResponse.json({
        ...mockResponse,
        generatedSql: mockResponse.intent === "SQL_ANALYTICS"
          ? `SELECT c.name as customer, SUM(uhr.sum_value) as tokens, SUM(uhr.sum_value) * 0.15 / 1000000 as est_cost
             FROM usage_hourly_rollups uhr
             JOIN customers c ON c.id = uhr.customer_id
             JOIN billable_metrics bm ON bm.id = uhr.metric_id
             WHERE uhr.org_id = '${orgId || "demo"}'
               AND bm.code = 'llm_tokens'
               AND uhr.hour_bucket >= NOW() - INTERVAL '30 days'
             GROUP BY c.id, c.name
             ORDER BY tokens DESC
             LIMIT 5;`
          : undefined,
      });
    }

    // Real AI call with Gemini
    const systemPrompt = `You are MeterFlow's FinOps Copilot. You help B2B SaaS companies understand their usage-based billing data.

Database Schema (PostgreSQL with Drizzle ORM):
- organizations: id, name, slug, stripe_customer_id, default_currency
- customers: id, org_id, external_id, name, email, hard_spend_cap_micros, soft_alert_threshold_micros, current_period_spend_micros, is_blocked
- billable_metrics: id, org_id, name, code, aggregation_type, aggregation_property, dimension_filters, unit_name
- plans: id, org_id, name, code, base_fee_micros, billing_interval
- plan_prices: id, plan_id, metric_id, pricing_model, included_free_units, tiers (JSONB)
- subscriptions: id, org_id, customer_id, plan_id, status, current_period_start, current_period_end
- usage_hourly_rollups: id, org_id, customer_id, metric_id, hour_bucket, event_count, sum_value, max_value
- invoices: id, org_id, customer_id, subscription_id, invoice_number, status, period_start, period_end, subtotal_micros, credits_applied_micros, total_payable_micros
- credit_grants: id, org_id, customer_id, name, initial_amount_micros, remaining_amount_micros, priority, expires_at
- webhook_endpoints: id, org_id, url, signing_secret, subscribed_events, is_active
- webhook_deliveries: id, org_id, endpoint_id, event_type, payload, status, attempt_count, response_status, response_body, next_retry_at

All monetary values are in micro-dollars (1 USD = 1,000,000 micro-dollars).

Return a structured JSON response matching this schema:
{
  "intent": "SQL_ANALYTICS" | "PRICING_SIMULATION" | "ANOMALY_EXPLANATION",
  "generatedSql": "SELECT ... (only for SQL_ANALYTICS, must start with SELECT, no DML/DDL)",
  "summaryMarkdown: "string",
  "chartConfig": { "type": "bar" | "line" | "area", "xAxisKey": "string", "yAxisKey": "string" },
  "recommendedAction": "string"
}

Constraints:
- generatedSql must be a single SELECT statement scoped to org_id = current org
- Reject any query with INSERT, UPDATE, DELETE, DROP, CREATE, ALTER
- Statement timeout: 2000ms`;

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
      temperature: 0.1,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Copilot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}