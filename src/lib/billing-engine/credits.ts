/**
 * Prepaid Credit Waterfall Burndown Logic
 *
 * When finalizing an invoice with subtotalMicros > 0:
 * 1. Query all active creditGrants for the customer where remainingAmountMicros > 0 and expiresAt > periodEnd
 * 2. Sort deterministically by: expiresAt ASC (soonest expiring first), then priority ASC
 * 3. Iterate inside a PostgreSQL transaction, deducting min(grant.remainingAmountMicros, remainingInvoiceBalance)
 *    until either the invoice balance hits 0n or grants are exhausted
 * 4. Record exact grant deductions in audit logs and set totalPayableMicros = subtotalMicros - creditsAppliedMicros
 */

// Credit grant interface matching the DB schema from PDR Section 5.3
export interface CreditGrant {
  id: string;
  orgId: string;
  customerId: string;
  name: string;
  initialAmountMicros: bigint;
  remainingAmountMicros: bigint;
  priority: number; // Lower number burns first
  expiresAt: Date; // Must be > periodEnd to be active
  createdAt: Date;
}

/**
 * Sorts credit grants by expiration date (ASC) then priority (ASC).
 * This matches the deterministic ordering specified in PDR Section 5.3.
 */
export function sortGrantsByBurndownOrder(grants: CreditGrant[]): CreditGrant[] {
  return grants.sort((a, b) => {
    // First: sort by expiresAt ASC (soonest expiring credits burn first)
    if (a.expiresAt.getTime() !== b.expiresAt.getTime()) {
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    }
    // Then: sort by priority ASC (lower priority number burns first)
    return a.priority - b.priority;
  });
}

/**
 * Waterfall burndown calculation.
 * Iterates through grants and deducts from the invoice balance.
 *
 * @param grants Sorted array of credit grants (by burndown order)
 * @param subtotalMicros The invoice subtotal in micro-dollars (bigint)
 * @param periodEnd The invoice period end date (grants with expiresAt > periodEnd are active)
 * @returns An object with creditsApplied, remainingBalance, and grantDeductions details
 */
export function calculateCreditBurndown(
  grants: CreditGrant[],
  subtotalMicros: bigint,
  periodEnd: Date
): {
  creditsAppliedMicros: bigint;
  remainingBalanceMicros: bigint;
  grantDeductions: Array<{
    grantId: string;
    grantName: string;
    amountUsedMicros: bigint;
    remainingGrantMicros: bigint;
  }>;
} {
  let remainingBalance = subtotalMicros;
  let totalCreditsApplied = 0n;
  const grantDeductions: Array<{
    grantId: string;
    grantName: string;
    amountUsedMicros: bigint;
    remainingGrantMicros: bigint;
  }> = [];

  // Process grants in burndown order
  for (const grant of grants) {
    if (remainingBalance <= 0n) break;

    // Only use grants that haven't expired beyond periodEnd
    if (grant.remainingAmountMicros <= 0n) continue;
    if (grant.expiresAt.getTime() <= periodEnd.getTime()) continue;

    // Amount to deduct: min(grant remaining, remaining balance)
    const amountToDeduct = grant.remainingAmountMicros < remainingBalance
      ? grant.remainingAmountMicros
      : remainingBalance;

    if (amountToDeduct > 0n) {
      grant.remainingAmountMicros -= amountToDeduct;
      remainingBalance -= amountToDeduct;
      totalCreditsApplied += amountToDeduct;

      grantDeductions.push({
        grantId: grant.id,
        grantName: grant.name,
        amountUsedMicros: amountToDeduct,
        remainingGrantMicros: grant.remainingAmountMicros,
      });
    }
  }

  return {
    creditsAppliedMicros: totalCreditsApplied,
    remainingBalanceMicros: remainingBalance,
    grantDeductions,
  };
}

/**
 * Finalizes an invoice by applying credit grants and computing the total payable.
 *
 * This function encapsulates the full credit waterfall logic from PDR Section 5.3:
 * 1. Filters active grants (remaining > 0, expiresAt > periodEnd)
 * 2. Sorts by (expiresAt ASC, priority ASC)
 * 3. Iteratively deducts from grants
 * 4. Returns totalPayableMicros = subtotalMicros - creditsAppliedMicros
 */
export function finalizeInvoiceWithCredits(
  grants: CreditGrant[],
  subtotalMicros: bigint,
  periodEnd: Date
): {
  creditsAppliedMicros: bigint;
  remainingBalanceMicros: bigint;
  totalPayableMicros: bigint;
  grantDeductions: Array<{
    grantId: string;
    grantName: string;
    amountUsedMicros: bigint;
    remainingGrantMicros: bigint;
  }>;
} {
  // Step 1: Filter active grants
  const activeGrants = grants.filter(
    (g) => g.remainingAmountMicros > 0n && g.expiresAt.getTime() > periodEnd.getTime()
  );

  // Step 2: Sort deterministically
  const sortedGrants = sortGrantsByBurndownOrder(activeGrants);

  // Step 3: Calculate waterfall burndown
  const result = calculateCreditBurndown(sortedGrants, subtotalMicros, periodEnd);

  // Step 4: Compute total payable
  const totalPayableMicros = subtotalMicros - result.creditsAppliedMicros;

  return {
    creditsAppliedMicros: result.creditsAppliedMicros,
    remainingBalanceMicros: result.remainingBalanceMicros,
    totalPayableMicros,
    grantDeductions: result.grantDeductions,
  };
}

export default {
  calculateCreditBurndown,
  finalizeInvoiceWithCredits,
  sortGrantsByBurndownOrder,
};