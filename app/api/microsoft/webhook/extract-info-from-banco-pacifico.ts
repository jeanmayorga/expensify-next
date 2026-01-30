import * as cheerio from "cheerio";
import { MicrosoftMeMessage } from "../me/messages/model";

function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function normalizeAmount(raw: string) {
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

function stripToText(html: string) {
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

/**
 * Extract last 4 digits from card number like "554574XXXXXXX439"
 */
function extractLast4(cardText: string): string | null {
  // Match pattern like XXXXXXX followed by 3-4 digits at the end
  const match = cardText.match(/X+(\d{3,4})$/);
  return match ? match[1] : null;
}

export function extractInfoFromBancoPacifico(
  message: MicrosoftMeMessage,
): string {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return "";

  // PacifiCard: Consumos
  if (subject.includes("PacifiCard: Consumos".toLowerCase())) {
    const $ = cheerio.load(body);
    const text = $.text();

    // Extract card info - look for pattern like "TITULAR MASTERCARD 554574XXXXXXX439"
    const cardMatch = text.match(/tarjeta\s+PacifiCard\s+([A-Z\s]+\d+X+\d+)/i);
    const tarjeta = cardMatch ? clean(cardMatch[1]) : null;
    const last4 = tarjeta ? extractLast4(tarjeta) : null;

    // Extract establishment - after "Establecimiento:"
    const establecimientoMatch = text.match(
      /Establecimiento:\s*([^\n]+?)(?=\s*Fecha|$)/i,
    );
    const establecimiento = establecimientoMatch
      ? clean(establecimientoMatch[1])
      : null;

    // Extract date - "Fecha de la transacción 2026-01-05 a las 13:29"
    const fechaMatch = text.match(
      /Fecha de la transacci[oó]n\s*(\d{4}-\d{2}-\d{2}\s+a\s+las\s+\d{2}:\d{2})/i,
    );
    const fecha = fechaMatch ? clean(fechaMatch[1]) : null;

    // Extract amount - "Monto $ 13.05"
    const montoMatch = text.match(/Monto\s*\$?\s*([\d.,]+)/i);
    const monto = montoMatch ? normalizeAmount(montoMatch[1]) : null;

    const parts = [
      "BANCO DEL PACIFICO - PacifiCard Consumo",
      monto ? `Monto: ${monto}` : null,
      establecimiento ? `Establecimiento: ${establecimiento}` : null,
      tarjeta ? `Tarjeta: ${tarjeta}` : null,
      last4 ? `Últimos 4 dígitos: ${last4}` : null,
      fecha ? `Fecha: ${fecha}` : null,
    ].filter(Boolean);

    return parts.join("\n");
  }

  // Fallback: return plain text from HTML
  return stripToText(body);
}
