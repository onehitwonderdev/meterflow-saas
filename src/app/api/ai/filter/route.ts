import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const FilterRequestSchema = z.object({
  naturalLanguage: z.string(),
  schema: z.enum(["events", "customers", "invoices", "metrics"]),
  orgId: z.string().uuid(),
});

const FilterResponseSchema = z.object({
  filters: z.record(z.string(), z.unknown()),
  sqlWhereClause: z.string(),
  humanReadable: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = FilterRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { naturalLanguage, schema, orgId } = parsed.data;

    // Deterministic mock responses for demo without API keys
    if (!process.env.GEMINI_API_KEY) {
      const nl = naturalLanguage.toLowerCase();

      // Events filter mock
      if (schema === "events") {
        if (nl.includes("rate limited") && nl.includes("techcorp")) {
          return NextResponse.json({
            filters: {
              outcome: "RATE_LIMITED",
              customerName: "TechCorp Industries",
              dateRange: { start: "2026-01-08", end: "2026-01-15" },
            },
            sqlWhereClause: `outcome = 'RATE_LIMITED' AND customer_name = 'TechCorp Industries' AND timestamp >= '2026-01-08' AND timestamp <= '2026-01-15'`,
            humanReadable: "Showing rate limited events for TechCorp Industries from the last week",
          });
        }

        if (nl.includes("duplicate") && nl.includes("last week")) {
          return NextResponse.json({
            filters: {
              outcome: "DUPLICATE_IGNORED",
              dateRange: { start: "2026-01-08", end: "2026-01-15" },
            },
            sqlWhereClause: `outcome = 'DUPLICATE_IGNORED' AND timestamp >= '2026-01-08' AND timestamp <= '2026-01-15'`,
            humanReadable: "Showing duplicate events from the last week",
          });
        }

        if (nl.includes("blocked") || nl.includes("hard cap")) {
          return NextResponse.json({
            filters: {
              outcome: "HARD_CAP_BLOCKED",
            },
            sqlWhereClause: `outcome = 'HARD_CAP_BLOCKED'`,
            humanReadable: "Showing all hard cap blocked events",
          });
        }

        if (nl.includes("accepted") && nl.includes("tokens")) {
          return NextResponse.json({
            filters: {
              outcome: "ACCEPTED",
              eventName: "llm_tokens",
            },
            sqlWhereClause: `outcome = 'ACCEPTED' AND event_name = 'llm_tokens'`,
            humanReadable: "Showing accepted LLM token events",
          });
        }

        // Default: last 7 days accepted
        return NextResponse.json({
          filters: {
            outcome: "ACCEPTED",
            dateRange: { start: "2026-01-08", end: "2026-01-15" },
          },
          sqlWhereClause: `outcome = 'ACCEPTED' AND timestamp >= '2026-01-08' AND timestamp <= '2026-01-15'`,
          humanReadable: "Showing accepted events from the last week",
        });
      }

      // Customers filter mock
      if (schema === "customers") {
        if (nl.includes("past due") || nl.includes("overdue")) {
          return NextResponse.json({
            filters: { status: "Past Due" },
            sqlWhereClause: `status = 'Past Due'`,
            humanReadable: "Showing customers with past due status",
          });
        }

        if (nl.includes("active") && nl.includes("pro")) {
          return NextResponse.json({
            filters: { status: "Active", plan: "Pro Scale" },
            sqlWhereClause: `status = 'Active' AND plan_code = 'pro_scale'`,
            humanReadable: "Showing active customers on Pro Scale plan",
          });
        }

        if (nl.includes("churned")) {
          return NextResponse.json({
            filters: { status: "Churned" },
            sqlWhereClause: `status = 'Churned'`,
            humanReadable: "Showing churned customers",
          });
        }

        if (nl.includes("high spend") || nl.includes("top spend")) {
          return NextResponse.json({
            filters: { minSpend: 10000000000 }, // $10K in micros
            sqlWhereClause: `current_period_spend_micros >= 10000000000`,
            humanReadable: "Showing customers with spend over $10,000",
          });
        }

        return NextResponse.json({
          filters: { status: "Active" },
          sqlWhereClause: `status = 'Active'`,
          humanReadable: "Showing all active customers",
        });
      }

      // Invoices filter mock
      if (schema === "invoices") {
        if (nl.includes("draft")) {
          return NextResponse.json({
            filters: { status: "DRAFT" },
            sqlWhereClause: `status = 'DRAFT'`,
            humanReadable: "Showing draft invoices",
          });
        }

        if (nl.includes("unpaid") || nl.includes("overdue")) {
          return NextResponse.json({
            filters: { status: "FINALIZED", unpaid: true },
            sqlWhereClause: `status = 'FINALIZED' AND paid_at IS NULL`,
            humanReadable: "Showing unpaid finalized invoices",
          });
        }

        if (nl.includes("this month")) {
          return NextResponse.json({
            filters: { periodStart: "2026-01-01", periodEnd: "2026-01-31" },
            sqlWhereClause: `period_start >= '2026-01-01' AND period_end <= '2026-01-31'`,
            humanReadable: "Showing invoices from January 2026",
          });
        }

        return NextResponse.json({
          filters: { status: "FINALIZED" },
          sqlWhereClause: `status = 'FINALIZED'`,
          humanReadable: "Showing finalized invoices",
        });
      }

      // Metrics filter mock
      if (schema === "metrics") {
        if (nl.includes("tiered") || nl.includes("graduated")) {
          return NextResponse.json({
            filters: { pricingModel: "GRADUATED_TIERED" },
            sqlWhereClause: `pricing_model = 'GRADUATED_TIERED'`,
            humanReadable: "Showing metrics with graduated tiered pricing",
          });
        }

        if (nl.includes("per unit") || nl.includes("simple")) {
          return NextResponse.json({
            filters: { pricingModel: "PER_UNIT" },
            sqlWhereClause: `pricing_model = 'PER_UNIT'`,
            humanReadable: "Showing metrics with per-unit pricing",
          });
        }

        return NextResponse.json({
          filters: {},
          sqlWhereClause: `1=1`,
          humanReadable: "Showing all metrics",
        });
      }

      return NextResponse.json({
        filters: {},
        sqlWhereClause: `1=1`,
        humanReadable: "No filters applied",
      });
    }

    // Real AI call with Gemini
    let schemaDescription = "";
    let exampleFilters = "";

    switch (schema) {
      case "events":
        schemaDescription = `Events table columns: id, idempotency_key, customer_id, customer_name, event_name, timestamp, outcome (ACCEPTED|DUPLICATE_IGNORED|RATE_LIMITED|HARD_CAP_BLOCKED|INVALID), properties (JSONB)`;
        exampleFilters = `{ outcome: "ACCEPTED", customerName: "TechCorp", eventName: "llm_tokens", dateRange: { start: "2026-01-01", end: "2026-01-31" } }`;
        break;
      case "customers":
        schemaDescription = `Customers table columns: id, external_id, name, email, status (Active|Past Due|Paused|Churned), plan_code, current_period_spend_micros, hard_spend_cap_micros, credit_balance_micros`;
        exampleFilters = `{ status: "Active", plan: "pro_scale", minSpend: 5000000000 }`;
        break;
      case "invoices":
        schemaDescription = `Invoices table columns: id, invoice_number, customer_id, customer_name, status (DRAFT|FINALIZED|PAID|VOID|UNCOLLECTIBLE), period_start, period_end, subtotal_micros, credits_applied_micros, total_payable_micros, stripe_invoice_id`;
        exampleFilters = `{ status: "FINALIZED", periodStart: "2026-01-01", periodEnd: "2026-01-31", unpaid: true }`;
        break;
      case "metrics":
        schemaDescription = `Billable Metrics table columns: id, name, code, aggregation_type (COUNT|SUM|MAX|UNIQUE_COUNT), unit_name, pricing_model (FLAT|PER_UNIT|GRADUATED_TIERED|VOLUME_TIERED|BLOCK_PACKAGE), included_free_units`;
        exampleFilters = `{ pricingModel: "GRADUATED_TIERED", aggregationType: "SUM" }`;
        break;
    }

    const systemPrompt = `You are a natural language to filter converter for MeterFlow's dashboard.
Convert the user's natural language query into structured filters for the ${schema} table.

${schemaDescription}

Return a JSON object with:
{
  "filters": ${exampleFilters},
  "sqlWhereClause": "SQL WHERE clause for PostgreSQL (parameterized, org_id = $1)",
  "humanReadable": "Human readable description of the filter"
}

Rules:
- Only return valid JSON
- sqlWhereClause must be a valid PostgreSQL WHERE clause (without WHERE keyword)
- Use parameterized queries with $1 for org_id, $2, $3 for other params
- Filters object keys should match the column names
- dateRange should use ISO 8601 dates`;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: naturalLanguage,
      temperature: 0,
    });

    const parsedResponse = FilterResponseSchema.safeParse(JSON.parse(result.text));

    if (!parsedResponse.success) {
      console.error("Filter response parse error:", parsedResponse.error);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse.data);
  } catch (error) {
    console.error("Filter conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}