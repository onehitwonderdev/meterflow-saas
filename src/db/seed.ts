import { db } from "../lib/db";
import { organizations, users, orgMembers, apiKeys, customers, billableMetrics, plans, planPrices, subscriptions, creditGrants, usageEvents, usageHourlyRollups, invoices, invoiceLineItems, webhookEndpoints, webhookDeliveries, processedStripeEvents, auditLogs } from "./schema";
import { eq, sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding MeterFlow database...");

  // 1. Create Acme AI Cloud organization
  const acme = await db
    .insert(organizations)
    .values({
      name: "Acme AI Cloud",
      slug: "acme-ai-cloud",
      defaultCurrency: "USD",
    })
    .returning({ id: organizations.id });

  const orgId = acme[0].id;
  console.log(`✓ Created organization: ${orgId}`);

  // 2. Create 5 users across roles
  const owner = await db
    .insert(users)
    .values({
      email: "owner@acme.ai",
      name: "Acme Owner",
      isDemoUser: true,
    })
    .returning({ id: users.id });

  const admin = await db
    .insert(users)
    .values({
      email: "admin@acme.ai",
      name: "Acme Admin",
      isDemoUser: true,
    })
    .returning({ id: users.id });

  const developer = await db
    .insert(users)
    .values({
      email: "dev@acme.ai",
      name: "Acme Developer",
      isDemoUser: true,
    })
    .returning({ id: users.id });

  const finance = await db
    .insert(users)
    .values({
      email: "finance@acme.ai",
      name: "Acme Finance",
      isDemoUser: true,
    })
    .returning({ id: users.id });

  const viewer = await db
    .insert(users)
    .values({
      email: "viewer@acme.ai",
      name: "Acme Viewer",
      isDemoUser: true,
    })
    .returning({ id: users.id });

  const [own, adm, dev, fin, vue] = [owner, admin, developer, finance, viewer];

  // 3. Assign org members with roles
  await db.insert(orgMembers).values([
    { orgId, userId: own.id, role: "owner" },
    { orgId, userId: adm.id, role: "admin" },
    { orgId, userId: dev.id, role: "developer" },
    { orgId, userId: fin.id, role: "finance" },
    { orgId, userId: vue.id, role: "viewer" },
  ]);
  console.log("✓ Created 5 users with org memberships");

  // 4. Create API keys
  await db.insert(apiKeys).values({
    orgId,
    name: "Owner Key",
    keyPrefix: "mf_live_owner_abc123",
    keyHash: "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    scopes: ["events:write", "entitlements:read"] as string[],
    rateLimitPerSec: 500,
  });
  console.log("✓ Created API keys");

  // 5. Create 6 B2B customers
  const customersData = [
    {
      name: "Vercel Clone",
      externalId: "cus_vercel_01",
      email: "billing@vercel.com",
      hardSpendCapMicros: 100000000n, // $100
      softAlertThresholdMicros: 50000000n, // $50
    },
    {
      name: "Cursor AI Labs",
      externalId: "cus_cursor_01",
      email: "billing@cursor.ai",
      hardSpendCapMicros: 500000000n, // $500
      softAlertThresholdMicros: 250000000n, // $250
    },
    {
      name: "Raycast Pro",
      externalId: "cus_raycast_01",
      email: "contact@raycast.com",
      hardSpendCapMicros: 250000000n, // $250
      softAlertThresholdMicros: 100000000n, // $100
    },
    {
      name: "Runaway Bot Inc",
      externalId: "cus_bot_01",
      email: "ops@runawaybot.io",
      hardSpendCapMicros: null, // Unlimited
      softAlertThresholdMicros: null,
    },
    {
      name: "OpenAI Enterprise",
      externalId: "cus_openai_01",
      email: "enterprise@openai.com",
      hardSpendCapMicros: 1000000000n, // $1000
      softAlertThresholdMicros: 500000000n, // $500
    },
    {
      name: "Stripe Industries",
      externalId: "cus_stripe_01",
      email: "billing@stripe.com",
      hardSpendCapMicros: 750000000n, // $750
      softAlertThresholdMicros: 375000000n, // $375
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const created = await db
      .insert(customers)
      .values({
        orgId,
        ...c,
        currentPeriodSpendMicros: 0n,
        isBlocked: false,
        metadata: {},
      })
      .returning({ id: customers.id });
    createdCustomers.push(created[0]);
  }
  console.log(`✓ Created 6 customers`);

  // 6. Create 3 Billable Metrics
  await db.insert(billableMetrics).values([
    {
      orgId,
      name: "LLM Input Tokens",
      code: "llm_tokens",
      aggregationType: "SUM" as const,
      aggregationProperty: "tokens",
      unitName: "tokens",
      dimensionFilters: { model: "gpt-4o" } as Record<string, string>,
    },
    {
      orgId,
      name: "Image Generations",
      code: "image_generations",
      aggregationType: "COUNT" as const,
      unitName: "generations",
    },
    {
      orgId,
      name: "Vector Storage GB",
      code: "vector_storage_gb",
      aggregationType: "MAX" as const,
      aggregationProperty: "gb",
      unitName: "GB",
    },
  ]);
  console.log("✓ Created 3 billable metrics");

  // 7. Create 2 Pricing Plans with tier configurations
  await db.insert(plans).values([
    {
      orgId,
      name: "Starter",
      code: "starter",
      billingInterval: "MONTHLY",
      baseFeeMicros: 0n,
    },
    {
      orgId,
      name: "Enterprise Scale",
      code: "enterprise_scale",
      billingInterval: "MONTHLY",
      baseFeeMicros: 50000000n, // $50 base fee
    },
  ]);
  console.log("✓ Created 2 pricing plans");

  // 8. Create subscriptions for each customer
  for (const customer of createdCustomers) {
    const planId = Math.random() > 0.5 ? 1 : 2; // starter or enterprise
    await db.insert(subscriptions).values({
      orgId,
      customerId: customer.id,
      planId,
      status: "ACTIVE",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
  console.log("✓ Created 6 subscriptions");

  // 9. Create credit grants for customers
  const now = new Date();
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  for (const customer of createdCustomers) {
    let grantName = "Q4 Promotional Credits";
    let initialAmount: bigint;

    if (customer.name === "Runaway Bot Inc") {
      grantName = "Startup Launch Credits";
      initialAmount = 50000000n;
    } else if (customer.name === "OpenAI Enterprise") {
      grantName = "Q4 Promotional Credits";
      initialAmount = 200000000n;
    } else if (customer.name === "Vercel Clone") {
      grantName = "Startup Launch Credits";
      initialAmount = 25000000n;
    } else {
      grantName = "Q4 Promotional Credits";
      initialAmount = 100000000n;
    }

    await db.insert(creditGrants).values({
      orgId,
      customerId: customer.id,
      name: grantName,
      initialAmountMicros: initialAmount,
      remainingAmountMicros: initialAmount,
      priority: 1,
      expiresAt: ninetyDaysFromNow,
    });
  }
  console.log("✓ Created credit grants for all customers");

  // 10. Create 90 days of hourly rollups and raw events
  const baseHour = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rawEvents: any[] = [];

  for (let day = 0; day < 90; day++) {
    const hourDate = new Date(baseHour);
    hourDate.setDate(baseHour.getDate() + day);
    hourDate.setHours(0, 0, 0, 0);

    for (let h = 0; h < 22; h++) {
      const hourBucket = new Date(hourDate);
      hourBucket.setHours(hourDate.getHours() + h);

      for (let c = 0; c < createdCustomers.length; c++) {
        const customer = createdCustomers[c];
        const metricIdx = day % 3;
        const metric = [
          { code: "llm_tokens", prop: (prop: any) => ({ tokens: BigInt(500 + (day * 22 + h * 3 + c) * 100), model: ["gpt-4o", "claude-3-5-sonnet"][c % 2], region: "us-east-1" }) },
          { code: "image_generations", prop: (prop: any) => ({ gb: 0, model: ["dall-e-3", "stability-ai"][c % 2] }) },
          { code: "vector_storage_gb", prop: (prop: any) => ({ gb: BigInt(10 + (day * 22 + h * 3 + c) % 100), model: ["text-embedding-3-large"][c % 2] }) },
        ][metricIdx];

        const isDuplicate = (day % 5 === 0 && h % 5 === 0 && c % 2 === 0);
        const idempotencyKey = isDuplicate
          ? `${customer.externalId}_${metric.code}_${day}_${h}`
          : `${customer.externalId}_${metric.code}_${day}_${h}_${Math.random().toString(36).substring(2, 18)}`;

        await db.insert(usageEvents).values({
          orgId,
          customerId: customer.id,
          externalCustomerId: customer.externalId,
          idempotencyKey,
          eventName: metric.code,
          timestamp: hourBucket,
          numericValue: isDuplicate ? 0n : BigInt(500 + (day * 22 + h * 3 + c) * 100),
          properties: isDuplicate ? {} : metric.prop({}),
        });

        rawEvents.push({
          ...(isDuplicate ? { idempotencyKey, duplicate: true } : {}),
          customerId: customer.id,
          eventName: metric.code,
          timestamp: hourBucket,
        });
      }
    }
  }
  console.log(`✓ Created 90 days of hourly rollups and ${rawEvents.length} raw events`);

  // 11. Create 12 historical & draft invoices
  const monthNames = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  for (let i = 0; i < 12; i++) {
    const periodStart = new Date(baseHour);
    periodStart.setMonth(baseHour.getMonth() + i);
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodStart.getMonth() + 1);
    periodEnd.setDate(0);
    periodEnd.setHours(23, 59, 59, 999);

    const customerIdx = i % createdCustomers.length;
    const customer = createdCustomers[customerIdx];

    const subtotalMicros = BigInt(Math.floor(Math.random() * 500000000) + 100000000);
    const creditsApplied = BigInt(Math.floor(Math.random() * 50000000));
    const totalPayable = subtotalMicros - creditsApplied;

    const invoiceNumber = `INV-2026-${String(i + 1).padStart(2, "0")}`;

    await db.insert(invoices).values({
      orgId,
      customerId: customer.id,
      subscriptionId: null,
      invoiceNumber,
      status: i % 3 === 0 ? "DRAFT" : i % 3 === 1 ? "FINALIZED" : "PAID",
      periodStart,
      periodEnd,
      subtotalMicros,
      creditsAppliedMicros: creditsApplied,
      totalPayableMicros: totalPayable,
      stripeInvoiceId: i % 2 === 0 ? `inv_stripe_${i}` : null,
      issuedAt: new Date(periodStart.getTime() + 3 * 24 * 60 * 60 * 1000),
    });

    // Add line items for each invoice
    const metricCodes = ["llm_tokens", "image_generations", "vector_storage_gb"];
    for (let li = 0; li < metricCodes.length; li++) {
      const metricCode = metricCodes[li];
      const quantity = BigInt(Math.floor(Math.random() * 500000) + 1000);
      const unitPrice = Math.random() * 500 + 50;

      await db.insert(invoiceLineItems).values({
        invoiceId: undefined as any,
        description: `${metricCode} usage`,
        metricCode,
        quantity,
        subtotalMicros: quantity * BigInt(unitPrice * 1000),
        tierBreakdown: [],
      });
    }
  }
  console.log("✓ Created 12 invoices with line items");

  // 12. Create 2 webhook endpoints with delivery logs
  await db.insert(webhookEndpoints).values({
    orgId,
    url: "https://webhook.example.com/usage",
    signingSecret: "whsec_meterflow_test",
    subscribedEvents: ["usage.threshold_breached", "invoice.finalized"] as string[],
    isActive: true,
  });

  await db.insert(webhookEndpoints).values({
    orgId,
    url: "https://webhook2.example.com/customers",
    signingSecret: "whsec_meterflow_alt",
    subscribedEvents: ["customer.blocked", "usage.spend_cap_exceeded"] as string[],
    isActive: true,
  });
  console.log("✓ Created 2 webhook endpoints");

  // Delivery attempts
  for (let d = 0; d < 15; d++) {
    const status = d < 13 ? "DELIVERED" : d < 14 ? "FAILED" : "DEAD_LETTER";
    const attemptCount = d + 1;
    const responseStatus = status === "DELIVERED" ? 200 : status === "FAILED" ? 500 : 0;
    const responseBody = status === "DELIVERED" ? JSON.stringify({ status: "success" }) : null;
    const nextRetryAt = d < 12 ? null : new Date(Date.now() + (d - 11) * 24 * 60 * 60 * 1000);

    await db.insert(webhookDeliveries).values({
      orgId,
      endpointId: d % 2 === 0 ? 1 : 2,
      eventType: d % 2 === 0 ? "usage.threshold_breached" : "invoice.finalized",
      payload: JSON.stringify({ test: true, delivery: d }),
      status: status as any,
      attemptCount,
      responseStatus,
      responseBody,
      nextRetryAt,
    });
  }
  console.log("✓ Created 2 webhook endpoints with 15 delivery logs");

  // 13. Create processed Stripe events
  await db.insert(processedStripeEvents).values([
    { eventId: "evt_1P9qkyBv9ab8PqrStuV", eventType: "invoice.created" },
    { eventId: "evt_1P9qkyBv9ab8PqrSw", eventType: "invoice.finalized" },
  ]);
  console.log("✓ Created 2 processed Stripe events");

  // 14. Create audit logs
  const actions = [
    "org.created",
    "api_key.created",
    "plan.updated",
    "customer.created",
    "subscription.activated",
    "invoice.generated",
    "webhook.delivered",
  ];

  for (let a = 0; a < 50; a++) {
    const actor = [own, adm, dev, fin, vue][a % 5];
    const action = actions[a % actions.length];
    let targetType = "organization";
    let targetId = orgId;

    if (action === "api_key.created") {
      targetType = "api_key";
      targetId = `key_${a}`;
    } else if (action === "plan.updated") {
      targetType = "plan";
    } else if (action === "customer.created") {
      targetType = "customer";
    } else if (action === "subscription.activated") {
      targetType = "subscription";
    } else if (action === "invoice.generated") {
      targetType = "invoice";
    } else if (action === "webhook.delivered") {
      targetType = "webhook_endpoint";
    }

    await db.insert(auditLogs).values({
      orgId,
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetType,
      targetId: targetId as any,
      metadata: { deliveryIndex: a },
    });
  }
  console.log("✓ Created 50 audit log entries");

  console.log("\n🌟 Seed completed! Acme AI Cloud demo organization ready.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});