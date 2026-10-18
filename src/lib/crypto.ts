import { createHash, createHmac } from "crypto";

// SHA-256 API Key Hashing
// Generates an mf_live_ prefix + 32 random characters, and its SHA-256 hash
export function generateApiKeyPrefix(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 20);
  return `mf_live_${timestamp}${randomPart}`.substring(0, 32);
}

export function generateApiKey(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 28);
  return `${prefix}${random}`.toLowerCase();
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Validate API key format and extract org ID from prefix
export function validateApiKey(key: string): { valid: boolean; orgPrefix: string | null; keyId: string | null } {
  // Format: mf_live_<32_chars>
  const match = key.match(/^mf_live_[a-z0-9]{32}$/i);
  if (!match) {
    return { valid: false, orgPrefix: null, keyId: null };
  }
  const prefix = match[0].substring(0, 32); // the mf_live_<prefix> part
  const keyId = match[0].substring(32); // the random suffix part
  return { valid: true, orgPrefix: prefix, keyId };
}

// HMAC-SHA256 Webhook Payload Signing
// Generates MeterFlow webhook signature: X-MeterFlow-Signature: t=...,v1=...
export function signWebhookPayload(
  payload: Buffer | string,
  signingSecret: string
): { t: string; v1: string } {
  const timestamp = Date.now().toString(10);

  // v1 signature: HMAC-SHA256 of "t={timestamp}\n" + payload using signingSecret
  const hmac = createHmac("sha256", signingSecret);
  hmac.update(`t=${timestamp}\n`);
  if (Buffer.isBuffer(payload)) {
    hmac.update(payload);
  } else {
    hmac.update(payload as string);
  }
  const v1 = hmac.digest("hex");

  return { t: timestamp, v1 };
}

// Verify MeterFlow webhook signature
export function verifyWebhookSignature(
  payload: Buffer | string,
  signingSecret: string,
  headerTimestamp: string,
  headerV1: string
): boolean {
  const { t: expectedT, v1: expectedV1 } = signWebhookPayload(payload, signingSecret);

  // Check timestamp is within 5 minutes
  const toleranceMs = 5 * 60 * 1000; // 5 minutes
  const headerTsNum = parseInt(headerTimestamp, 10);
  const now = Date.now();
  if (Math.abs(now - headerTsNum) > toleranceMs) {
    return false;
  }

  // Constant-time comparison of v1 signatures
  const expectedBuffer = Buffer.from(expectedV1, "hex");
  const actualBuffer = Buffer.from(headerV1, "hex");
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < expectedBuffer.length; i++) {
    result |= expectedBuffer[i] ^ actualBuffer[i];
  }
  return result === 0;
}

export default {
  generateApiKeyPrefix,
  generateApiKey,
  hashApiKey,
  validateApiKey,
  signWebhookPayload,
  verifyWebhookSignature,
};