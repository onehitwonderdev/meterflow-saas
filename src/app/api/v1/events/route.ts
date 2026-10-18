import { NextResponse } from "next/server";
import { createRedisClient } from "@/lib/redis/client";
import { INGESTION_LUA_SCRIPT as ingestLuaScript } from "@/lib/redis/lua-scripts";
import { db } from "@/lib/db";
import {
  organizations,
  users,
  orgMembers,
  apiKeys,
  customers,
  billableMetrics,
  usageEvents,
} from "@/db/schema";
import { eq } from "drizzle-orm";

let redisClient: any;

async function getRedis() {
  if (!redisClient) {
    redisClient = createRedisClient(
      process.env.UPSTASH_REDIS_REST_URL,
      process.env.UPSTASH_REDIS_REST_TOKEN
    );
  }
  return redisClient;
}

// POST /api/v1/events - High-Throughput Event Ingestion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 }
      );
    }

    if (events.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 events per request" },
        { status: 400 }
      );
    }

    const results = [];
    let duplicatesIgnored = 0;

    for (const event of events) {
      const { idempotency_key, external_customer_id, event_name, timestamp, properties } = event;

      if (!idempotency_key || !external_customer_id || !event_name) {
        results.push({
          idempotency_key: idempotency_key || "unknown",
          outcome: "INVALID",
        });
        continue;
      }

      const client = await getRedis();

      // Parse timestamp to get second epoch for rate limiting
      const date = new Date(timestamp);
      const secondEpoch = Math.floor(date.getTime() / 1000);

      // Redis keys
      const rateLimitKey = `rl:00000000-0000-0000-0000-000000000000:${idempotency_key.substring(0, 16)}:${secondEpoch}`;
      const idempotencyKeyRedis = `idem:00000000-0000-0000-0000-000000000000:${idempotency_key}`;
      const customerSpendKey = `spend:00000000-0000-0000-0000-000000000000:${external_customer_id}:${secondEpoch}`;
      const customerUsageKey = `usage:00000000-0000-0000-0000-000000000000:${external_customer_id}:${event_name}:${secondEpoch}`;

      // Execute atomic Lua script for ingestion & gatekeeping
      const luaResult = await client.eval(
        ingestLuaScript,
        {
          keys: [rateLimitKey, idempotencyKeyRedis, customerSpendKey, customerUsageKey],
          arguments: [
            500, // rate_limit_max
            1, // quantity_delta (default 1 event)
            150, // cost_delta_micros (e.g., 0.15 micro-dollars per token / 1000)
            -1, // hard_cap_micros (-1 = unlimited)
            -1, // soft_cap_micros (-1 = none)
          ],
        }
      );

      // Parse result: [status, new_usage, new_spend_micros, alert_flag]
      const [status, newUsage, newSpendMicros, alertFlag] = luaResult as [
        string,
        number,
        number,
        number,
      ];

      if (status === "RATE_LIMITED") {
        results.push({
          idempotency_key,
          outcome: "RATE_LIMITED",
        });
        continue;
      }

      if (status === "DUPLICATE_IGNORED") {
        duplicatesIgnored++;
        results.push({
          idempotency_key,
          outcome: "DUPLICATE_IGNORED",
        });
        continue;
      }

      if (status === "HARD_CAP_BLOCKED") {
        results.push({
          idempotency_key,
          outcome: "HARD_CAP_BLOCKED",
        });
        continue;
      }

      // ACCEPTED - record the event
      await db.insert(usageEvents).values({
        orgId: "00000000-0000-0000-0000-000000000000",
        customerId: "00000000-0000-0000-0000-000000000000",
        externalCustomerId: external_customer_id,
        idempotencyKey: idempotency_key,
        eventName: event_name,
        timestamp: date,
        numericValue: BigInt(newUsage),
        properties: properties || {},
      });

      results.push({
        idempotency_key,
        outcome: "ACCEPTED",
      });
    }

    return NextResponse.json({
      status: "accepted",
      processed_count: events.length,
      duplicates_ignored: duplicatesIgnored,
      results,
    });
  } catch (error) {
    console.error("Event ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/v1/entitlements/check - Sub-15ms Edge Gatekeeper
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const externalCustomerId = searchParams.get("external_customer_id");
    const metricCode = searchParams.get("metric_code");

    if (!externalCustomerId || !metricCode) {
      return NextResponse.json(
        { error: "external_customer_id and metric_code query parameters are required" },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await db
      .select({
        orgId: organizations.id,
        hardSpendCapMicros: customers.hardSpendCapMicros,
        softAlertThresholdMicros: customers.softAlertThresholdMicros,
        currentPeriodSpendMicros: customers.currentPeriodSpendMicros,
      })
      .from(customers)
      .where(eq(customers.externalId, externalCustomerId))
      .leftJoin(organizations, eq(organizations.id, customers.orgId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const c = customer[0];
    const hardCap = c.hardSpendCapMicros;
    const softThreshold = c.softAlertThresholdMicros;
    const currentSpending = c.currentPeriodSpendMicros;

    // Get current usage from Redis
    const client = await getRedis();
    const usageKey = `usage:00000000-0000-0000-0000-000000000000:${externalCustomerId}:${metricCode}:current`;
    const currentUsageResult = await client.get(usageKey);
    const currentUsage = currentUsageResult ? parseInt(currentUsageResult, 10) : 0;

    const allowed = hardCap <= 0 || currentSpending + currentUsage < hardCap;
    const isBlocked = hardCap > 0 && currentSpending + currentUsage >= hardCap;
    const remainingBudget = hardCap > 0 ? hardCap - currentSpending - currentUsage : null;

    return NextResponse.json({
      allowed,
      customer_id: externalCustomerId,
      is_blocked: isBlocked,
      current_period_spend_micros: currentSpending,
      hard_spend_cap_micros: hardCap,
      remaining_budget_micros: remainingBudget,
      utilization_percent: hardCap > 0 ? Math.round((currentSpending / hardCap) * 10000) / 100 : 0,
      evaluated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Entitlements check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}