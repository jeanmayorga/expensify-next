import * as cheerio from "cheerio";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

const ECUADOR_TZ = "America/Guayaquil";

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function normalizeAmount(raw: string): string {
  const cleaned = raw
    .replace(/\u00A0/g, " ")
    .replace(/[^\d,.\-]/g, "")
    .trim();
  if (!cleaned) return raw;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;

  if (hasComma && hasDot)
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  else if (hasComma && !hasDot) normalized = cleaned.replace(",", ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? String(n) : raw;
}

export function parseAmountToNumber(raw: string): number | null {
  const s = normalizeAmount(raw);
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extract last 4 digits from card text like "554574XXXXXXX439" or "XXX3733"
 */
export function extractLast4(cardText: string): string | null {
  const match = cardText.match(/X*(\d{3,4})$/);
  return match ? match[1] : null;
}

export function stripToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, img").remove();

  const text = $.text()
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => clean(l))
    .filter(Boolean)
    .join("\n");

  return text;
}

/** Interpret YYYY, MM, DD, HH, mm, ss as Ecuador local time and return UTC ISO */
function ecuadorToUtcIso(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  sec: number = 0,
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const localStr = `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(sec)}`;
  const utcDate = fromZonedTime(localStr, ECUADOR_TZ);
  return utcDate.toISOString();
}

/**
 * Parse date from common Spanish email formats to ISO string (UTC).
 * Las horas en los emails de bancos ecuatorianos son en hora Ecuador (America/Guayaquil).
 */
export function parseOccurredAt(
  text: string | null,
  fallbackIso: string,
): string {
  if (!text || !clean(text)) return fallbackIso;

  const t = clean(text);

  // "2026-01-05 a las 13:29" → 13:29 Ecuador
  const isoTimeMatch = t.match(
    /(\d{4})-(\d{2})-(\d{2})\s+(?:a\s+las\s+)?(\d{1,2}):(\d{2})/i,
  );
  if (isoTimeMatch) {
    const [, y, m, d, h, min] = isoTimeMatch;
    return ecuadorToUtcIso(
      Number(y),
      Number(m),
      Number(d),
      Number(h),
      Number(min),
      0,
    );
  }

  // "30/Enero/2026 10:03" o "30/Enero/2026 14:54" → hora Ecuador
  const spanishMatch = t.match(
    /(\d{1,2})\/(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/i,
  );
  if (spanishMatch) {
    const [, day, monthName, year, h = "0", min = "0"] = spanishMatch;
    const month = SPANISH_MONTHS[monthName.toLowerCase()];
    if (month) {
      return ecuadorToUtcIso(
        Number(year),
        month,
        Number(day),
        Number(h),
        Number(min),
        0,
      );
    }
  }

  // "16/01/2026 13:23:21" (DD/MM/YYYY HH:mm:ss, Ecuador) → when middle ≤ 12
  const dmYTimeMatch = t.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (dmYTimeMatch) {
    const [, d, m, y, h, min, sec = "0"] = dmYTimeMatch;
    const month = Number(m);
    const day = Number(d);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return ecuadorToUtcIso(
        Number(y),
        month,
        day,
        Number(h),
        Number(min),
        Number(sec),
      );
    }
  }

  // "01/29/2026 15:13:45" (MM/DD/YYYY HH:mm:ss) → hora Ecuador
  const usDateMatch = t.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (usDateMatch) {
    const [, month, day, year, h, min, sec = "0"] = usDateMatch;
    return ecuadorToUtcIso(
      Number(year),
      Number(month),
      Number(day),
      Number(h),
      Number(min),
      Number(sec),
    );
  }

  // "19/01/2026" (DD/MM/YYYY, date only) → date from email + time from received email (Ecuador)
  const dmYMatch = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmYMatch) {
    const [, day, month, year] = dmYMatch;
    try {
      const received = new Date(fallbackIso);
      if (!Number.isFinite(received.getTime())) return fallbackIso;
      const h = Number(formatInTimeZone(received, ECUADOR_TZ, "H"));
      const min = Number(formatInTimeZone(received, ECUADOR_TZ, "m"));
      const sec = Number(formatInTimeZone(received, ECUADOR_TZ, "s"));
      return ecuadorToUtcIso(
        Number(year),
        Number(month),
        Number(day),
        h,
        min,
        sec,
      );
    } catch {
      return ecuadorToUtcIso(Number(year), Number(month), Number(day), 0, 0, 0);
    }
  }

  // "2026-01-30" (YYYY-MM-DD, date only) → date from email + time from received email (Ecuador)
  const isoDateOnlyMatch = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnlyMatch) {
    const [, y, m, d] = isoDateOnlyMatch;
    try {
      const received = new Date(fallbackIso);
      if (!Number.isFinite(received.getTime())) return fallbackIso;
      const h = Number(formatInTimeZone(received, ECUADOR_TZ, "H"));
      const min = Number(formatInTimeZone(received, ECUADOR_TZ, "m"));
      const sec = Number(formatInTimeZone(received, ECUADOR_TZ, "s"));
      return ecuadorToUtcIso(Number(y), Number(m), Number(d), h, min, sec);
    } catch {
      return ecuadorToUtcIso(Number(y), Number(m), Number(d), 0, 0, 0);
    }
  }

  return fallbackIso;
}
