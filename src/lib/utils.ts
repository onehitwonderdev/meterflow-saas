import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMicroDollars(micros: bigint | number): string {
  const num = typeof micros === "bigint" ? Number(micros) : micros;
  if (num === 0) return "$0.00";

  const dollars = num / 1_000_000;
  if (dollars >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  }

  return `$${dollars.toFixed(6)}`;
}

export function formatMicroDollarsCompact(micros: bigint | number): string {
  const num = typeof micros === "bigint" ? Number(micros) : micros;
  if (num === 0) return "$0";

  const dollars = num / 1_000_000;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}K`;
  }
  if (dollars >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  }

  return `$${dollars.toFixed(6)}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}