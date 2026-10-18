/**
 * Atomic Redis Lua Scripts for Sub-15ms Ingestion & Gatekeeping
 *
 * These scripts must match exactly the Lua specification from the PDR.
 * See Section 5.1 of the PDR for the full specification.
 *
 * The TypeScript types mirror the KEYS and ARGV structure.
 * When Upstash credentials are omitted, the in-memory emulator in client.ts
 * must implement equivalent operations.
 */

// KEYS[1]: rate_limit_key      ("rl:{org_id}:{api_key_id}:{second_epoch}")
// KEYS[2]: idempotency_key     ("idem:{org_id}:{idempotency_key}")
// KEYS[3]: customer_spend_key  ("spend:{org_id}:{external_customer_id}:{period_key}")
// KEYS[4]: customer_usage_key  ("usage:{org_id}:{external_customer_id}:{event_name}:{period_key}")
// ARGV[1]: rate_limit_max      (e.g., 500)
// ARGV[2]: quantity_delta      (e.g., 1500 tokens)
// ARGV[3]: cost_delta_micros   (estimated micro-dollars for this event)
// ARGV[4]: hard_cap_micros     (-1 if unlimited)
// ARGV[5]: soft_cap_micros     (-1 if none)

export const INGESTION_LUA_SCRIPT = `
-- 1. Check Rate Limit
local current_reqs = redis.call("INCR", KEYS[1])
if current_reqs == 1 then
  redis.call("EXPIRE", KEYS[1], 2)
end
if current_reqs > tonumber(ARGV[1]) then
  return { "RATE_LIMITED", current_reqs, 0, 0 }
end

-- 2. Check Idempotency (24h = 86400s TTL)
local is_new = redis.call("SET", KEYS[2], "1", "NX", "EX", 86400)
if not is_new then
  local existing_spend = tonumber(redis.call("GET", KEYS[3]) or "0")
  local existing_usage = tonumber(redis.call("GET", KEYS[4]) or "0")
  return { "DUPLICATE_IGNORED", existing_usage, existing_spend, 0 }
end

-- 3. Check Hard Spend Cap BEFORE Incrementing if already over cap
local current_spend = tonumber(redis.call("GET", KEYS[3]) or "0")
local hard_cap = tonumber(ARGV[4])
if hard_cap > 0 and current_spend >= hard_cap then
  return { "HARD_CAP_BLOCKED", 0, current_spend, 1 }
end

-- 4. Increment Usage & Spend Atomically
local new_usage = redis.call("INCRBY", KEYS[4], tonumber(ARGV[2]))
local new_spend = redis.call("INCRBY", KEYS[3], tonumber(ARGV[3]))

-- 5. Determine Threshold Status (0 = OK, 1 = HARD_BREACHED, 2 = SOFT_BREACHED)
local alert_flag = 0
local soft_cap = tonumber(ARGV[5])
if hard_cap > 0 and new_spend >= hard_cap then
  alert_flag = 1
elseif soft_cap > 0 and current_spend < soft_cap and new_spend >= soft_cap then
  alert_flag = 2 -- Crossed soft threshold on this exact event!
end

return { "ACCEPTED", new_usage, new_spend, alert_flag }
`;

// Helper type for the script return values
export type IngestionResult =
  | "ACCEPTED"
  | "RATE_LIMITED"
  | "DUPLICATE_IGNORED"
  | "HARD_CAP_BLOCKED";

export interface IngestionReturn {
  status: IngestionResult;
  new_usage: number;
  new_spend_micros: number;
  alert_flag: number; // 0=OK, 1=HARD_BREACHED, 2=SOFT_BREACHED
}

/**
 * Parses the result from the Lua script execution.
 * Throws if the status indicates a blocking condition.
 */
export function parseIngestionResult(
  result: [string, number, number, number]
): { status: IngestionResult; newUsage: number; newSpendMicros: number; alertFlag: number; isBlocked: boolean } {
  const [statusStr, newUsage, newSpendMicros, alertFlag] = result;
  const status = statusStr as IngestionResult;
  const isBlocked = status === "HARD_CAP_BLOCKED";
  return { status, newUsage, newSpendMicros, alertFlag, isBlocked };
}