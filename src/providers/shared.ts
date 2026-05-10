/** Collapse whitespace and return null for anything that is effectively empty. */
export function cleanText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

/** "1.250 €" -> 1250, "450,50" -> 450.5. Serbian grouping: "." groups, "," decimals. */
export function parsePrice(raw: string | null | undefined): number | null {
  const text = cleanText(raw);
  if (!text) {
    return null;
  }

  const digits = text
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

export function inferCurrency(raw: string | null | undefined): string | null {
  const text = cleanText(raw);
  if (!text) {
    return null;
  }

  if (text.includes("€") || /\bEUR\b/i.test(text)) {
    return "EUR";
  }
  if (/RSD|din/i.test(text)) {
    return "RSD";
  }

  return null;
}

/** ISO yyyy-mm-dd from an ISO string or a Serbian date anywhere in the text ("Ažurirano 21.08.2026."). */
export function parseDate(raw: string | null | undefined): string | null {
  const text = cleanText(raw);
  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?/);
  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  const year = Number.parseInt(match[3] ?? "", 10);

  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate ? date.toISOString().slice(0, 10) : null;
}

/**
 * Resolves a href against the site base, stripping hash and query. Listing URLs
 * are the dedupe key, so they have to be byte-stable across pages.
 */
export function absoluteUrl(
  raw: string | null | undefined,
  baseUrl: string,
): string | null {
  const text = cleanText(raw);
  if (!text) {
    return null;
  }

  try {
    const absolute = new URL(text, baseUrl);
    absolute.hash = "";
    absolute.search = "";
    return absolute.toString();
  } catch {
    return null;
  }
}
