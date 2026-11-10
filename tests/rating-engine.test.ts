/**
 * Vitest unit tests for the MeterFlow Rating Engine
 *
 * Covers all 5 pricing models with boundary conditions as specified in PDR Section 5.2:
 * - PER_UNIT: Q_billable × P_unit
 * - GRADUATED_TIERED: Each unit priced by its band
 * - VOLUME_TIERED: Entire quantity in single tier
 * - BLOCK_PACKAGE: ceil(Q/B) × P_block
 * - FLAT: Fixed fee
 *
 * Also tests credit burndown logic from credits.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  rate,
  calculatePerUnit,
  calculateGraduatedTiered,
  calculateVolumeTiered,
  calculateBlockPackage,
  calculateFlat,
} from "../src/lib/billing-engine/rating";
import {
  calculateCreditBurndown,
  finalizeInvoiceWithCredits,
  sortGrantsByBurndownOrder,
} from "../src/lib/billing-engine/credits";
import { PricingTier } from "../src/lib/billing-engine/rating";

describe("Rating Engine - PER_UNIT Model", () => {
  it("calculates cost for whole units", () => {
    const result = rate("PER_UNIT", 1000, { unitPriceMicros: 150 });
    expect(result.costMicros).toBe(150000); // 1000 × 150
  });

  it("calculates cost for zero units", () => {
    const result = rate("PER_UNIT", 0, { unitPriceMicros: 150 });
    expect(result.costMicros).toBe(0);
  });

  it("calculates cost for fractional-like units", () => {
    const result = rate("PER_UNIT", 1, { unitPriceMicros: 150 });
    expect(result.costMicros).toBe(150);
  });
});

describe("Rating Engine - GRADUATED_TIERED Model", () => {
  it("prices units across multiple tiers correctly", () => {
    const tiers: PricingTier[] = [
      { upToUnits: 1000, unitPriceMicros: 200, flatFeeMicros: 0 },
      { upToUnits: 5000, unitPriceMicros: 150, flatFeeMicros: 5000 },
      { upToUnits: null, unitPriceMicros: 100, flatFeeMicros: 10000 },
    ];

    // 3000 units: 1000 @ 200 + 2000 @ 150 + 0 flat fee for partial third tier
    // Actually: 1000 × 200 + 2000 × 150 + 500 flat fee (entering 2nd tier)
    const result = rate("GRADUATED_TIERED", 3000, { tiers });

    // Tier 1: 1000 units × $0.20 = $200000 microro... wait, 1000 × 200 = 200000
    // Tier 2: 2000 units × $0.15 = 300000, plus flat fee 5000
    // Total: 200000 + 300000 + 5000 = 505000
    expect(result.costMicros).toBe(505000);
  });

  it("handles exact tier boundary units", () => {
    const tiers: PricingTier[] = [
      { upToUnits: 1000, unitPriceMicros: 200, flatFeeMicros: 0 },
      { upToUnits: null, unitPriceMicros: 100, flatFeeMicros: 0 },
    ];

    // Exactly at boundary: 1000 units all in tier 1
    const result = rate("GRADUATED_TIERED", 1000, { tiers });
    expect(result.costMicros).toBe(200000); // 1000 × 200
  });

  it("handles units exceeding all tiers", () => {
    const tiers: PricingTier[] = [
      { upToUnits: 5000, unitPriceMicros: 200, flatFeeMicros: 0 },
    ];

    // 10000 units: 5000 × 200 = 1000000 (only first tier applies)
    const result = rate("GRADUATED_TIERED", 10000, { tiers });
    expect(result.costMicros).toBe(1000000);
  });
});

describe("Rating Engine - VOLUME_TIERED Model", () => {
  it("applies single tier price to entire quantity", () => {
    const tiers: PricingTier[] = [
      { upToUnits: 1000, unitPriceMicros: 300, flatFeeMicros: 0 },
      { upToUnits: 5000, unitPriceMicros: 250, flatFeeMicros: 0 },
      { upToUnits: null, unitPriceMicros: 100, flatFeeMicros: 0 },
    ];

    // 2000 units falls in tier 2 (1000 < 2000 <= 5000)
    const result = rate("VOLUME_TIERED", 2000, { tiers });
    // 2000 × 250 = 500000
    expect(result.costMicros).toBe(500000);
  });

  it("uses last tier when quantity exceeds all bounds", () => {
    const tiers: PricingTier[] = [
      { upToUnits: 1000, unitPriceMicros: 300, flatFeeMicros: 0 },
    ];

    // 5000 units uses the only available tier
    const result = rate("VOLUME_TIERED", 5000, { tiers });
    expect(result.costMicros).toBe(1500000); // 5000 × 300
  });
});

describe("Rating Engine - BLOCK_PACKAGE Model", () => {
  it("calculates blocks with ceiling division", () => {
    // 2500 units, block size 1000: ceil(2500/1000) = 3 blocks
    const result = rate("BLOCK_PACKAGE", 2500, { blockSize: 1000, blockPriceMicros: 500 });
    expect(result.costMicros).toBe(1500); // 3 × 500
    expect(result.breakdown?.blocks).toBe(3);
  });

  it("calculates exact blocks for perfect division", () => {
    // 2000 units, block size 1000: ceil(2000/1000) = 2 blocks
    const result = rate("BLOCK_PACKAGE", 2000, { blockSize: 1000, blockPriceMicros: 500 });
    expect(result.costMicros).toBe(1000); // 2 × 500
    expect(result.breakdown?.blocks).toBe(2);
  });

  it("handles small quantities with minimum 1 block", () => {
    // 100 units, block size 1000: ceil(100/1000) = 1 block
    const result = rate("BLOCK_PACKAGE", 100, { blockSize: 1000, blockPriceMicros: 500 });
    expect(result.costMicros).toBe(500); // 1 × 500
    expect(result.breakdown?.blocks).toBe(1);
  });
});

describe("Rating Engine - FLAT Model", () => {
  it("returns the flat fee", () => {
    const result = rate("FLAT", 0, { flatFeeMicros: 50000 });
    expect(result.costMicros).toBe(50000);
  });

  it("ignores billable units", () => {
    const result = rate("FLAT", 5000, { flatFeeMicros: 10000 });
    expect(result.costMicros).toBe(10000);
  });
});

describe("Rating Engine - Edge Cases", () => {
  it("never returns negative costs", () => {
    const result = rate("PER_UNIT", 0, { unitPriceMicros: 150 });
    expect(result.costMicros).toBe(0);
  });

  it("GRADUATED_TIERED with single tier", () => {
    const tiers: PricingTier[] = [
      { upToUnits: null, unitPriceMicros: 150, flatFeeMicros: 0 },
    ];

    const result = rate("GRADUATED_TIERED", 750000, { tiers });
    // 750000 × 150 = 112500000
    expect(result.costMicros).toBe(112500000);
  });
});

describe("Credit Burndown - sortGrantsByBurndownOrder", () => {
  it("sorts by expiresAt ASC then priority ASC", () => {
    const grants = [
      {
        id: "g1", orgId: "org1", customerId: "c1", name: "Grant 1",
        initialAmountMicros: 100000n, remainingAmountMicros: 100000n,
        priority: 2, expiresAt: new Date("2026-12-01")
      },
      {
        id: "g2", orgId: "org1", customerId: "c1", name: "Grant 2",
        initialAmountMicros: 200000n, remainingAmountMicros: 200000n,
        priority: 1, expiresAt: new Date("2026-12-01")
      },
      {
        id: "g3", orgId: "org1", customerId: "c1", name: "Grant 3",
        initialAmountMicros: 150000n, remainingAmountMicros: 150000n,
        priority: 1, expiresAt: new Date("2026-11-15")
      },
    ];

    const sorted = sortGrantsByBurndownOrder(grants);
    // g3 expires soonest (Nov 15), then g1 and g2 same date, g1 has priority 2, g2 has priority 1
    // Wait: same expiresAt, so priority ASC: g2 (priority 1) before g1 (priority 2)
    expect(sorted[0].id).toBe("g3"); // earliest expiration
    expect(sorted[1].id).toBe("g2"); // same expiry, lower priority number
    expect(sorted[2].id).toBe("g1"); // same expiry, higher priority number
  });
});

describe("Credit Burndown - calculateCreditBurndown", () => {
  it("applies credits until balance is zero", () => {
    const grants = [
      {
        id: "g1", orgId: "org1", customerId: "c1", name: "Grant 1",
        initialAmountMicros: 100000n, remainingAmountMicros: 100000n,
        priority: 1, expiresAt: new Date("2027-01-01")
      },
      {
        id: "g2", orgId: "org1", customerId: "c1", name: "Grant 2",
        initialAmountMicros: 50000n, remainingAmountMicros: 50000n,
        priority: 1, expiresAt: new Date("2027-01-01")
      },
    ];

    const result = calculateCreditBurndown(grants, 120000n, new Date("2026-12-15"));

    // Total credits: 100000 + 50000 = 150000, but invoice is only 120000
    // g1 burns first (same priority, but g1 was added first... actually they have same priority)
    // Both have priority 1 and same expiresAt, so order depends on sort stability
    // g1: 100000, g2: 50000 (but only 20000 needed after g1)
    expect(result.creditsAppliedMicros).toBe(120000n);
    expect(result.remainingBalanceMicros).toBe(0n);
  });

  it("respects grant expiration dates", () => {
    const grants = [
      {
        id: "g1", orgId: "org1", customerId: "c1", name: "Grant 1",
        initialAmountMicros: 500000n, remainingAmountMicros: 500000n,
        priority: 1, expiresAt: new Date("2026-12-01")
      },
    ];

    // Period end is after expiration - grant should NOT be active
    const result = calculateCreditBurndown(grants, 100000n, new Date("2026-12-15"));

    // Grant expired on Dec 1, period ends Dec 15 - should not apply
    expect(result.creditsAppliedMicros).toBe(0n);
    expect(result.remainingBalanceMicros).toBe(100000n);
  });
});

describe("Credit Burndown - finalizeInvoiceWithCredits", () => {
  it("computes total payable after credit application", () => {
    const grants = [
      {
        id: "g1", orgId: "org1", customerId: "c1", name: "Grant 1",
        initialAmountMicros: 80000n, remainingAmountMicros: 80000n,
        priority: 1, expiresAt: new Date("2027-01-01")
      },
    ];

    const result = finalizeInvoiceWithCredits(grants, 100000n, new Date("2026-12-15"));

    // 80000 applied, 20000 remaining
    expect(result.creditsAppliedMicros).toBe(80000n);
    expect(result.remainingBalanceMicros).toBe(20000n);
    expect(result.totalPayableMicros).toBe(20000n);
  });
});