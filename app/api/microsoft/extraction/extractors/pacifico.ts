import * as cheerio from "cheerio";
import { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { ExtractedTransactionData } from "../types";
import {
  clean,
  parseAmountToNumber,
  extractLast4,
  parseOccurredAt,
} from "../utils";

/** Subject: Confirmación de Pago (débito mensual PacifiCard) */
const PACIFICARD_SUBJECT_CONFIRMACION_PAGO = "Confirmacion de Pago";

/**
 * Confirmación de Pago - Banco del Pacífico
 * Ej. asunto "Confirmacion de Pago", cuerpo: Establecimiento, Fecha de la transacción YYYY-MM-DD, Monto, tarjeta PacifiCard ... XXXXXX439
 * Tipo: gasto (débito mensual).
 */
export function extractPacifiCardConfirmacionPago(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes(PACIFICARD_SUBJECT_CONFIRMACION_PAGO.toLowerCase()))
    return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // "tarjeta PacifiCard TITULAR MASTERCARD 554574XXXXXXX439" → last4 "0439" or "5439"
  const cardMatch = text.match(
    /tarjeta\s+PacifiCard\s+[\s\S]*?(\d{6,}\s*X+\s*\d{3,4})/i,
  );
  const card_last4Raw = cardMatch
    ? extractLast4(cardMatch[1].replace(/\s/g, ""))
    : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const establecimientoMatch = text.match(
    /Establecimiento:\s*([^\n]+?)(?=\s*Fecha|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  const fechaMatch = text.match(
    /Fecha de la transacci[oó]n\s*(\d{4}-\d{2}-\d{2})/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  // "Monto: $ 26.09" or "Monto $ 26.09"
  const montoMatch = text.match(/Monto\s*:?\s*\$?\s*([\d.,]+)/i);
  const montoRaw = montoMatch
    ? montoMatch[1].replace(/\.\s*$/, "").trim()
    : null;
  const amount = montoRaw ? parseAmountToNumber(montoRaw) : null;
  if (amount === null) return null;

  const description =
    establecimiento?.trim() || "Banco del Pacífico - Confirmación de Pago";

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    payment_method: "card",
    card_last4,
  };
}

/**
 * PacifiCard: Consumos - Banco del Pacífico
 * Ej. asunto "PacifiCard: Consumos", cuerpo: Establecimiento, Fecha de la transacción YYYY-MM-DD a las HH:mm, Monto, tarjeta PacifiCard ... XXXXXX439
 */
export function extractPacifiCardConsumos(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes("pacificard: consumos")) return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // "tarjeta PacifiCard TITULAR MASTERCARD 554574XXXXXXX439" → last4 "0439"
  const cardMatch = text.match(
    /tarjeta\s+PacifiCard\s+[\s\S]*?(\d{6,}\s*X+\s*\d{3,4})/i,
  );
  const card_last4Raw = cardMatch
    ? extractLast4(cardMatch[1].replace(/\s/g, ""))
    : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  // "establecimiento: PEDIDOSYA*PIZZA HUT LA QUITO" or "en el establecimiento: ..."
  const establecimientoMatch = text.match(
    /(?:en el )?[Ee]stablecimiento:\s*([^\n]+?)(?=\s*Fecha|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  // "Fecha de la transacción 2026-01-11 a las 15:01" or "Fecha de la transacción NO exitosa: 2026-01-11 a las 15:01"
  const fechaMatch = text.match(
    /Fecha de la transacci[oó?]n(?:\s*NO\s+exitosa)?\s*:?\s*(\d{4}-\d{2}-\d{2}\s+a\s+las\s+\d{1,2}:\d{2})/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  // "Monto: $ 26.09" or "Monto $ 26.09"
  const montoMatch = text.match(/Monto\s*:?\s*\$?\s*([\d.,]+)/i);
  const montoRaw = montoMatch
    ? montoMatch[1].replace(/\.\s*$/, "").trim()
    : null;
  const amount = montoRaw ? parseAmountToNumber(montoRaw) : null;
  if (amount === null) return null;

  const description =
    establecimiento?.trim() || "BANCO DEL PACÍFICO - PacifiCard Consumo";

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    payment_method: "card",
    card_last4,
  };
}

/**
 * Solicitud de Transacción de Devolución - Banco del Pacífico
 * Ej. asunto "Solicitud de Transaccion de Devolucion", cuerpo: Establecimiento, Fecha de la transaccion YYYY-MM-DD a las HH:mm Monto $ X.XX
 * Tipo: ingreso (devolución acreditada).
 */
export function extractPacifiCardSolicitudDevolucion(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (
    !subject.includes("solicitud") ||
    (!subject.includes("devolucion") && !subject.includes("devolución"))
  )
    return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // "tarjeta PacifiCard TITULAR/ADICIONAL marca MASTERCARD 554574XXXXXXX439"
  const cardMatch = text.match(
    /tarjeta\s+PacifiCard\s+[\s\S]*?(\d{6,}\s*X+\s*\d{3,4})/i,
  );
  const card_last4Raw = cardMatch
    ? extractLast4(cardMatch[1].replace(/\s/g, ""))
    : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const establecimientoMatch = text.match(
    /Establecimiento:\s*([^\n]+?)(?=\s*Fecha|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  // "Fecha de la transaccion 2026-01-10 a las 22:38" (sin tilde en transaccion)
  const fechaMatch = text.match(
    /Fecha de la transacci[oó?]n\s*(\d{4}-\d{2}-\d{2}\s+a\s+las\s+\d{1,2}:\d{2})/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const montoMatch = text.match(/Monto\s*:?\s*\$?\s*([\d.,]+)/i);
  const montoRaw = montoMatch
    ? montoMatch[1].replace(/\.\s*$/, "").trim()
    : null;
  const amount = montoRaw ? parseAmountToNumber(montoRaw) : null;
  if (amount === null) return null;

  const description =
    establecimiento?.trim() || "BANCO DEL PACÍFICO - Solicitud de Devolución";

  return {
    type: "income",
    description,
    amount,
    occurred_at,
    payment_method: "card",
    card_last4,
  };
}
