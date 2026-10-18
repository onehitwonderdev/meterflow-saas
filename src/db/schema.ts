import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("member_role", ["owner", "admin", "developer", "finance", "viewer"]);
export const aggregationTypeEnum = pgEnum("aggregation_type", ["COUNT", "SUM", "MAX", "UNIQUE_COUNT"]);
export const pricingModelEnum = pgEnum("pricing_model", ["FLAT", "PER_UNIT", "GRADUATED_TIERED", "VOLUME_TIERED", "BLOCK_PACKAGE"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["DRAFT", "FINALIZED", "PAID", "VOID", "UNCOLLECTIBLE"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["PENDING", "DELIVERED", "FAILED", "DEAD_LETTER"]);

// 1. Multi-Tenant Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeWebhookSecret: text("stripe_webhook_secret"),
  defaultCurrency: text("default_currency").default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Users & Organization Memberships (RBAC)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  isDemoUser: boolean("is_demo_user").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orgMembers = pgTable("org_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").default("developer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("org_user_unique_idx").on(t.orgId, t.userId),
]);

// 3. Ingestion API Keys (Prefix + SHA-256 Hash Only)
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(), // e.g., "mf_live_9a8b"
  keyHash: text("key_hash").notNull().unique(), // SHA-256 hex digest
  scopes: jsonb("scopes").$type<string[]>().default(["events:write", "entitlements:read"]).notNull(),
  rateLimitPerSec: integer("rate_limit_per_sec").default(500).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. End-Customers (The B2B Customers of the Tenant)
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  externalId: text("external_id").notNull(), // Customer ID in Tenant's own system (e.g. "cus_acme_01")
  name: text("name").notNull(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  hardSpendCapMicros: bigint("hard_spend_cap_micros", { mode: "bigint" }), // Null = unlimited
  softAlertThresholdMicros: bigint("soft_alert_threshold_micros", { mode: "bigint" }),
  currentPeriodSpendMicros: bigint("current_period_spend_micros", { mode: "bigint" }).default(0n).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("org_external_customer_idx").on(t.orgId, t.externalId),
]);

// 5. Billable Metrics (How Raw Events translate into Billable Quantities)
export const billableMetrics = pgTable("billable_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "LLM Input Tokens"
  code: text("code").notNull(), // e.g., "llm_tokens" matches event_name
  aggregationType: aggregationTypeEnum("aggregation_type").notNull(), // COUNT, SUM, MAX, UNIQUE_COUNT
  aggregationProperty: text("aggregation_property"), // e.g., "tokens" inside properties JSONB
  dimensionFilters: jsonb("dimension_filters").$type<Record<string, string>>().default({}), // e.g. {"model": "gpt-4o"}
  unitName: text("unit_name").default("units").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("org_metric_code_idx").on(t.orgId, t.code),
]);

// 6. Pricing Plans & Tier Configurations
export interface PricingTier {
  upToUnits: number | null; // null represents infinity (last tier)
  unitPriceMicros: number;  // Price per unit in micro-dollars ($1 = 1,000,000)
  flatFeeMicros: number;    // Optional flat fee upon entering this tier
  packageSizeUnits?: number; // Used if pricingModel === "BLOCK_PACKAGE" (e.g. per 1,000 units)
}

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "Pro Scale Usage Plan"
  code: text("code").notNull(),
  baseFeeMicros: bigint("base_fee_micros", { mode: "bigint" }).default(0n).notNull(), // Monthly platform fee
  billingInterval: text("billing_interval").default("MONTHLY").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const planPrices = pgTable("plan_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  metricId: uuid("metric_id").references(() => billableMetrics.id, { onDelete: "restrict" }).notNull(),
  pricingModel: pricingModelEnum("pricing_model").notNull(),
  includedFreeUnits: bigint("included_free_units", { mode: "bigint" }).default(0n).notNull(),
  tiers: jsonb("tiers").$type<PricingTier[]>().notNull(),
});

// 7. Customer Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "restrict" }).notNull(),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, CANCELED, PAST_DUE
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Prepaid Credit Grants (Waterfall Burndown Ledger)
export const creditGrants = pgTable("credit_grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "Q4 Promotional Credits"
  initialAmountMicros: bigint("initial_amount_micros", { mode: "bigint" }).notNull(),
  remainingAmountMicros: bigint("remaining_amount_micros", { mode: "bigint" }).notNull(),
  priority: integer("priority").default(1).notNull(), // Lower number burns first
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Raw Usage Events (High-Throughput Idempotent Ledger)
export const usageEvents = pgTable("usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  externalCustomerId: text("external_customer_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  eventName: text("event_name").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  numericValue: bigint("numeric_value", { mode: "bigint" }).default(1n).notNull(), // Extracted property for fast SQL rollup
  properties: jsonb("properties").$type<Record<string, unknown>>().default({}).notNull(),
  ingestedAt: timestamp("ingested_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("org_idempotency_unique_idx").on(t.orgId, t.idempotencyKey),
  index("org_customer_event_time_idx").on(t.orgId, t.customerId, t.eventName, t.timestamp),
]);

// 10. Hourly Usage Rollups (Pre-aggregated Time-Series for Instant Dashboards)
export const usageHourlyRollups = pgTable("usage_hourly_rollups", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  metricId: uuid("metric_id").references(() => billableMetrics.id, { onDelete: "cascade" }).notNull(),
  hourBucket: timestamp("hour_bucket").notNull(), // Truncated to YYYY-MM-DD HH:00:00 UTC
  eventCount: bigint("event_count", { mode: "bigint" }).default(0n).notNull(),
  sumValue: bigint("sum_value", { mode: "bigint" }).default(0n).notNull(),
  maxValue: bigint("max_value", { mode: "bigint" }).default(0n).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("hourly_rollup_unique_idx").on(t.orgId, t.customerId, t.metricId, t.hourBucket),
]);

// 11. Invoices & Deterministic Line Items
export interface InvoiceTierBreakdown {
  tierIndex: number;
  fromUnits: number;
  toUnits: number | null;
  unitsInTier: number;
  unitPriceMicros: number;
  subtotalMicros: number;
}

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  invoiceNumber: text("invoice_number").notNull().unique(), // e.g., "INV-2026-0042"
  status: invoiceStatusEnum("status").default("DRAFT").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  subtotalMicros: bigint("subtotal_micros", { mode: "bigint" }).notNull(),
  creditsAppliedMicros: bigint("credits_applied_micros", { mode: "bigint" }).default(0n).notNull(),
  totalPayableMicros: bigint("total_payable_micros", { mode: "bigint" }).notNull(),
  stripeInvoiceId: text("stripe_invoice_id"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  metricCode: text("metric_code"),
  quantity: bigint("quantity", { mode: "bigint" }).notNull(),
  subtotalMicros: bigint("subtotal_micros", { mode: "bigint" }).notNull(),
  tierBreakdown: jsonb("tier_breakdown").$type<InvoiceTierBreakdown[]>().default([]).notNull(),
});

// 12. Outbound Webhook Endpoints & Delivery Attempts
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  signingSecret: text("signing_secret").notNull(), // e.g. "whsec_..."
  subscribedEvents: jsonb("subscribed_events").$type<string[]>().notNull(), // ["usage.threshold_breached", "invoice.finalized", "customer.blocked"]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  endpointId: uuid("endpoint_id").references(() => webhookEndpoints.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: webhookStatusEnum("status").default("PENDING").notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. Processed Inbound Stripe Webhooks (Idempotency Lock)
export const processedStripeEvents = pgTable("processed_stripe_events", {
  eventId: text("event_id").primaryKey(), // e.g., "evt_1P9..."
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// 14. Immutable System Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  actorId: uuid("actor_id"),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(), // e.g., "api_key.created", "plan.updated", "customer.spend_cap_modified"
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: jsonb("metadata").default({}),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});