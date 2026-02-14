import * as cheerio from "cheerio";
import { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { ExtractedTransactionData } from "../types";
import {
  clean,
  parseAmountToNumber,
  parseOccurredAt,
  extractLast4,
} from "../utils";

function extractPairs(html: string) {
  const $ = cheerio.load(html);
  $("script, style, img").remove();

  const pairs: Array<{ label: string; value: string }> = [];

  $("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 2) return;

    const label = clean($(tds[0]).text());
    const value = clean($(tds[1]).text());

    if (!label || !value) return;

    pairs.push({ label, value });
  });

  return pairs;
}

function getExact(
  pairs: Array<{ label: string; value: string }>,
  label: string,
): string | null {
  const found = pairs.find(
    (p) => p.label.toLowerCase() === label.toLowerCase(),
  );
  return found?.value ?? null;
}

/**
 * Notificación de consumos - Banco Pichincha
 * Ej. asunto "Notificación de Consumos", cuerpo: Valor $ 35,93, Establecimiento, Tarjeta usada 015, Fecha 2026-01-19 17:51
 */
export function extractPichinchaNotificacionConsumos(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();
  const subjectNorm = subject.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (!body.trim()) return null;
  if (!subjectNorm.includes("notificacion de consumos")) return null;

  const pairs = extractPairs(body);
  const valorRaw = getExact(pairs, "Valor");
  const establecimiento = getExact(pairs, "Establecimiento");
  const tarjeta = getExact(pairs, "Tarjeta usada");
  const fechaRaw = getExact(pairs, "Fecha");

  const amount = valorRaw ? parseAmountToNumber(valorRaw) : null;
  if (amount === null) return null;

  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    establecimiento?.trim() || "BANCO PICHINCHA - Notificación de Consumos";

  const card_last4Raw = tarjeta
    ? tarjeta.replace(/\D/g, "").trim().slice(-4)
    : "";
  const card_last4 =
    card_last4Raw.length >= 3
      ? card_last4Raw.padStart(4, "0").slice(-4)
      : undefined;

  const comment = tarjeta ? `Tarjeta: ${tarjeta}` : undefined;

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    payment_method: "card",
    card_last4,
    comment,
  };
}

/**
 * Transferencia Banca Electrónica - Banco Pichincha
 * Ej. asunto "TRANSFERENCIA BANCA ELECTRONICA BANCO PICHINCHA", cuerpo: Cuenta de origen XXXXXX2801, Monto USD 8.75, Fecha 19/01/2026, Nombre del beneficiario, etc.
 */
export function extractPichinchaTransferencia(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes("transferencia banca electronica banco pichincha"))
    return null;

  const pairs = extractPairs(body);
  const montoRaw = getExact(pairs, "Monto:");
  const beneficiario = getExact(pairs, "Nombre del beneficiario:");
  const concepto = getExact(pairs, "Concepto:");
  const fechaRaw = getExact(pairs, "Fecha:");
  const cuentaOrigen = getExact(pairs, "Cuenta de origen:");

  const amount = montoRaw ? parseAmountToNumber(montoRaw) : null;
  if (amount === null) return null;

  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const card_last4Raw = cuentaOrigen ? extractLast4(cuentaOrigen) : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const description =
    concepto?.trim() ||
    (beneficiario?.trim() ? `Transferencia a ${beneficiario.trim()}` : null) ||
    "BANCO PICHINCHA - Transferencia";

  const commentParts: string[] = [];
  if (beneficiario?.trim())
    commentParts.push(`Beneficiario: ${beneficiario.trim()}`);
  if (cuentaOrigen?.trim())
    commentParts.push(`Cuenta origen: ${cuentaOrigen.trim()}`);
  const cuentaAcreditada = getExact(pairs, "Cuenta acreditada:");
  if (cuentaAcreditada?.trim())
    commentParts.push(`Cuenta acreditada: ${cuentaAcreditada.trim()}`);

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    payment_method: "transfer",
    card_last4,
    comment: commentParts.length > 0 ? commentParts.join(" | ") : undefined,
  };
}

/** Normalize for subject match: lowercase, remove accents */
function subjectNorm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Notificación Banco Pichincha (transferencia genérica o Transferencia Interbancaria).
 * Asunto: "NOTIFICACION BANCO PICHINCHA" (con o sin tilde).
 * Cuerpo Transferencia Interbancaria: tabla con Cuenta de origen, Banco destino, Cuenta acreditada,
 * Nombre del beneficiario, Monto, Fecha, Descripción, Documento.
 */
export function extractPichinchaNotificacionBanco(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = message.subject || "";

  if (!body.trim()) return null;
  if (!subjectNorm(subject).includes("notificacion banco pichincha"))
    return null;

  const pairs = extractPairs(body);
  const montoRaw = getExact(pairs, "Monto:");
  const fechaRaw = getExact(pairs, "Fecha:");
  const amount = montoRaw ? parseAmountToNumber(montoRaw) : null;
  if (amount === null) return null;

  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  // Template "Transferencia Interbancaria": tiene Banco destino, Cuenta de origen, etc.
  const cuentaOrigen = getExact(pairs, "Cuenta de origen:");
  const bancoDestino = getExact(pairs, "Banco destino:");
  const cuentaAcreditada = getExact(pairs, "Cuenta acreditada:");
  const beneficiario = getExact(pairs, "Nombre del beneficiario:");
  const descripcion = getExact(pairs, "Descripción:");
  const documento = getExact(pairs, "Documento:");
  const isInterbancaria =
    body.includes("Transferencia Interbancaria") &&
    (bancoDestino != null || cuentaOrigen != null);

  let description: string;
  let comment: string | undefined;
  let card_last4: string | undefined;

  if (isInterbancaria) {
    description =
      descripcion?.trim() ||
      (beneficiario?.trim()
        ? `Transferencia a ${beneficiario.trim()}`
        : "Transferencia Interbancaria");
    const commentParts: string[] = [];
    if (beneficiario?.trim())
      commentParts.push(`Beneficiario: ${beneficiario.trim()}`);
    if (bancoDestino?.trim())
      commentParts.push(`Banco destino: ${bancoDestino.trim()}`);
    if (cuentaOrigen?.trim())
      commentParts.push(`Cuenta origen: ${cuentaOrigen.trim()}`);
    if (cuentaAcreditada?.trim())
      commentParts.push(`Cuenta acreditada: ${cuentaAcreditada.trim()}`);
    if (documento?.trim()) commentParts.push(`Documento: ${documento.trim()}`);
    comment =
      commentParts.length > 0 ? commentParts.join(" | ") : undefined;
    const card_last4Raw = cuentaOrigen ? extractLast4(cuentaOrigen) : null;
    card_last4 = card_last4Raw
      ? card_last4Raw.padStart(4, "0").slice(-4)
      : undefined;
  } else {
    description =
      descripcion?.trim() ||
      (beneficiario?.trim() || "BANCO PICHINCHA - Notificación");
    comment = beneficiario?.trim()
      ? `Beneficiario: ${beneficiario.trim()}`
      : undefined;
  }

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    payment_method: "transfer",
    card_last4,
    comment,
  };
}
