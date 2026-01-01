// Formatting utilities for currency, percentages, and numbers

export function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: absValue >= 1000 ? 0 : 2,
  }).format(absValue);

  return value < 0 ? `-${formatted}` : formatted;
}

export function formatCurrencyCompact(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${value < 0 ? "-" : ""}$${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${value < 0 ? "-" : ""}$${(absValue / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function parseCurrency(value: string): number {
  // Remove $, commas, and handle negative values with parentheses or minus sign
  const cleaned = value
    .replace(/[$,]/g, "")
    .replace(/^\((.+)\)$/, "-$1")
    .replace(/^-\$/, "-");
  return parseFloat(cleaned) || 0;
}

export function parsePercent(value: string): number {
  // Remove % sign and parse
  const cleaned = value.replace(/%/g, "").replace(/^\+/, "");
  return parseFloat(cleaned) || 0;
}

export function parseDate(dateStr: string): Date {
  // Handle dates like "12/30/25" or "5/4/25 11:54p ET"
  const parts = dateStr.split(" ")[0].split("/");
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    // Handle 2-digit years
    if (year < 100) {
      year += 2000;
    }
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
