/**
 * Pure mathematical Rating Engine supporting all 5 standard SaaS pricing models.
 *
 * All monetary values are in micro-dollars ($1 = 1,000,000 micro-dollars).
 * Let Q_billable = max(0, Q_total - Q_free) as specified in the PDR Section 5.2.
 */

// Pricing tier interface (matches PDR Section 5.2)
export interface PricingTier {
  upToUnits: number | null; // null represents infinity (last tier)
  unitPriceMicros: number;  // Price per unit in micro-dollars ($1 = 1,000,000)
  flatFeeMicros: number;    // Optional flat fee upon entering this tier
  packageSizeUnits?: number; // Used if pricingModel === "BLOCK_PACKAGE"
}

/**
 * PER_UNIT Model:
 * Cost = Q_billable × P_unit
 */
export function calculatePerUnit(
  billableUnits: number,
  unitPriceMicros: number
): number {
  return Math.round(billableUnits * unitPriceMicros);
}

/**
 * GRADUATED_TIERED Model:
 * Each unit is priced according to the band it falls into.
 * For tier i with bounds (L_{i-1}, L_i], unit price P_i, and tier flat fee F_i:
 * q_i = max(0, min(Q_billable, L_i) - L_{i-1})
 * Cost = sum over i of (q_i > 0 ? (q_i × P_i + F_i) : 0)
 */
export function calculateGraduatedTiered(
  billableUnits: number,
  tiers: PricingTier[]
): { costMicros: number; tierBreakdown: Array<{ tierIndex: number; fromUnits: number; toUnits: number; unitsInTier: number; unitPriceMicros: number; subtotalMicros: number }> } {
  let totalCost = 0;
  const breakdown: Array<{
    tierIndex: number;
    fromUnits: number;
    toUnits: number;
    unitsInTier: number;
    unitPriceMicros: number;
    subtotalMicros: number;
  }> = [];

  let cumulativeFrom = 0;

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const tierTo = tier.upToUnits ?? Number.MAX_SAFE_INTEGER;

    // Units in this tier: min(billable, tierTo) - cumulativeFrom, but not below 0
    const unitsInTier = Math.max(0, Math.min(billableUnits, tierTo) - cumulativeFrom);

    if (unitsInTier > 0) {
      const tierCost = Math.round(unitsInTier * tier.unitPriceMicros + tier.flatFeeMicros);
      totalCost += tierCost;

      breakdown.push({
        tierIndex: i,
        fromUnits: cumulativeFrom,
        toUnits: tier.upToUnits ?? 0,
        unitsInTier,
        unitPriceMicros: tier.unitPriceMicros,
        subtotalMicros: tierCost,
      });
    }

    cumulativeFrom = tierTo;
    if (tier.upToUnits === null) break; // last tier with infinity
  }

  return {
    costMicros: totalCost,
    tierBreakdown: breakdown,
  };
}

/**
 * VOLUME_TIERED Model:
 * The entire billable quantity Q_billable is multiplied by the unit price
 * of the single tier k where L_{k-1} < Q_billable <= L_k:
 * Cost = Q_billable × P_k + F_k
 */
export function calculateVolumeTiered(
  billableUnits: number,
  tiers: PricingTier[]
): { costMicros: number; tierName: string } {
  let selectedTier: PricingTier | null = null;

  let prevBound = 0;
  for (const tier of tiers) {
    const tierTo = tier.upToUnits ?? Number.MAX_SAFE_INTEGER;
    if (billableUnits > prevBound && billableUnits <= tierTo) {
      selectedTier = tier;
      break;
    }
    prevBound = tierTo;
  }

  // If billableUnits exceeds all tiers, use the last tier
  if (!selectedTier && tiers.length > 0) {
    const lastTier = tiers[tiers.length - 1];
    selectedTier = lastTier;
  }

  if (!selectedTier) {
    return { costMicros: 0, tierName: "none" };
  }

  const cost = Math.round(billableUnits * selectedTier.unitPriceMicros + selectedTier.flatFeeMicros);
  return {
    costMicros: cost,
    tierName: `volume_tier_${selectedTier.upToUnits ?? "infinity"}`,
  };
}

/**
 * BLOCK_PACKAGE Model (e.g., "$5.00 per 10,000 requests, rounded up"):
 * Blocks = ceil(Q_billable / B), Cost = Blocks × P_block
 */
export function calculateBlockPackage(
  billableUnits: number,
  blockSize: number,
  blockPriceMicros: number
): { blocks: number; costMicros: number } {
  const blocks = Math.ceil(billableUnits / blockSize);
  const cost = blocks * blockPriceMicros;
  return { blocks, costMicros: cost };
}

/**
 * FLAT Model:
 * Cost = flat fee (includedFreeUnits are already subtracted beforehand)
 */
export function calculateFlat(
  flatFeeMicros: number
): number {
  return flatFeeMicros;
}

/**
 * Main rating function that dispatches to the correct model.
 *
 * @param model The pricing model enum
 * @param billableUnits The billable quantity AFTER subtracting includedFreeUnits
 * @param config Model-specific configuration (tiers, block size, etc.)
 */
export function rate(
  model: "FLAT" | "PER_UNIT" | "GRADUATED_TIERED" | "VOLUME_TIERED" | "BLOCK_PACKAGE",
  billableUnits: number,
  config: any
): { costMicros: number; breakdown?: { blocks?: number } } {
  billableUnits = Math.max(0, billableUnits); // ensure non-negative

  switch (model) {
    case "FLAT":
      return { costMicros: calculateFlat(config.flatFeeMicros ?? 0) };

    case "PER_UNIT":
      return { costMicros: calculatePerUnit(billableUnits, config.unitPriceMicros ?? 0) };

    case "GRADUATED_TIERED":
      return { costMicros: calculateGraduatedTiered(billableUnits, config.tiers ?? []).costMicros };

    case "VOLUME_TIERED":
      return { costMicros: calculateVolumeTiered(billableUnits, config.tiers ?? []).costMicros };

    case "BLOCK_PACKAGE":
      const blockResult = calculateBlockPackage(
        billableUnits,
        config.blockSize ?? 1000,
        config.blockPriceMicros ?? 100
      );
      return {
        costMicros: blockResult.costMicros,
        breakdown: { blocks: blockResult.blocks },
      };

    default:
      throw new Error(`Unknown pricing model: ${model}`);
  }
}

export default {
  rate,
  calculatePerUnit,
  calculateGraduatedTiered,
  calculateVolumeTiered,
  calculateBlockPackage,
  calculateFlat,
};