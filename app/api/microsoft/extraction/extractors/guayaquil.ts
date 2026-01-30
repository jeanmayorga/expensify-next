import * as cheerio from "cheerio";
import { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { ExtractedTransactionData } from "../types";
import {
  clean,
  parseAmountToNumber,
  parseOccurredAt,
  extractLast4,
} from "../utils";

/**
 * Transferencias Internas - Banco Guayaquil (Banca Móvil Personas)
 * Comprobante de transferencia interna: Titular ordenante/beneficiario, Valor Transferido, Total Debitado, Concepto, fecha en pie (DD/MM/YYYY HH:mm:ss).
 */
export function extractGuayaquilTransferenciasInternas(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes("transferencias internas")) return null;

  const $ = cheerio.load(body);

  const amountRaw =
    clean($("#txtTotalDebitado").text()) ||
    clean($("#txtValorTransferidoUSD").text());
  const amount = amountRaw ? parseAmountToNumber(amountRaw) : null;
  if (amount === null) return null;

  const beneficiario = clean($("#txtNombreDeLaCuentaB").text());
  const concepto = clean($("span#txtConcepto").first().text());
  const cuentaOrdenante = clean($("#txtNumerodeCuentaO").text());

  const fullText = $("body").text();
  const dateTimeMatch = fullText.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/,
  );
  const fechaRaw = dateTimeMatch
    ? `${dateTimeMatch[1]}/${dateTimeMatch[2]}/${dateTimeMatch[3]} ${dateTimeMatch[4]}:${dateTimeMatch[5]}:${dateTimeMatch[6]}`
    : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    (beneficiario?.trim() ? `Transferencia a ${beneficiario.trim()}` : null) ||
    concepto?.trim() ||
    "BANCO GUAYAQUIL - Transferencia interna";

  const card_last4Raw = cuentaOrdenante ? extractLast4(cuentaOrdenante) : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const commentParts: string[] = [];
  if (beneficiario?.trim())
    commentParts.push(`Beneficiario: ${beneficiario.trim()}`);
  if (cuentaOrdenante?.trim())
    commentParts.push(`Cuenta origen: ${cuentaOrdenante.trim()}`);
  const cuentaBeneficiario = clean($("#txtNumerodeCuentaB").text());
  if (cuentaBeneficiario?.trim())
    commentParts.push(`Cuenta destino: ${cuentaBeneficiario.trim()}`);

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    card_last4,
    comment: commentParts.length > 0 ? commentParts.join(" | ") : undefined,
  };
}

/**
 * Pago Exitoso (Comprobante de Pago de Servicios) - Banco Guayaquil
 * Luz, agua, etc. Subject "PAGO EXITOSO [EMPRESA]", body: Comprobante de Pago de Servicios, Total Pagado, Empresa, Referencia, fecha.
 */
export function extractGuayaquilPagoExitoso(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes("pago exitoso")) return null;

  const $ = cheerio.load(body);

  const totalPagadoRaw = clean($("#lblTotal_Pagado").text());
  const amount = totalPagadoRaw ? parseAmountToNumber(totalPagadoRaw) : null;
  if (amount === null) return null;

  const empresa = clean($("#lblNombreEmpresa").text());
  const categoria = clean($("#lblCategoria").text());
  const referencia = clean($("#lblReferencia").text());
  const cuenta = clean($("#lblNumeroCT").text());

  const fullText = $("body").text();
  const dateTimeMatch = fullText.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/,
  );
  const fechaRaw = dateTimeMatch
    ? `${dateTimeMatch[1]}/${dateTimeMatch[2]}/${dateTimeMatch[3]} ${dateTimeMatch[4]}:${dateTimeMatch[5]}:${dateTimeMatch[6]}`
    : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    [empresa, referencia].filter(Boolean).join(" - ") ||
    (categoria?.trim() ? `Pago ${categoria.trim()}` : null) ||
    "BANCO GUAYAQUIL - Pago de servicio";

  const card_last4Raw = cuenta ? extractLast4(cuenta) : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const commentParts: string[] = [];
  if (categoria?.trim()) commentParts.push(`Categoría: ${categoria.trim()}`);
  if (referencia?.trim()) commentParts.push(`Ref: ${referencia.trim()}`);
  const comprobante = clean($("#lblNumeroComprobante").text());
  if (comprobante?.trim())
    commentParts.push(`Comprobante: ${comprobante.trim()}`);

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    card_last4,
    comment: commentParts.length > 0 ? commentParts.join(" | ") : undefined,
  };
}

/** Build label -> value map from h4 + next p pairs (Nota de Crédito email layout). */
function extractH4Pairs($: cheerio.CheerioAPI): Map<string, string> {
  const map = new Map<string, string>();
  $("h4").each((_, el) => {
    const label = clean($(el).text());
    const value = clean($(el).next("p").text());
    if (label) map.set(label.toLowerCase(), value);
  });
  return map;
}

/**
 * Recibiste una Nota de Crédito - Banco Guayaquil
 * Valor devuelto por consumo no exitoso. Type: income. Body: Valor devuelto, Cuenta, Local, Fecha (h4/p layout).
 */
export function extractGuayaquilNotaCredito(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (
    !subject.includes("nota de crédito") &&
    !subject.includes("nota de credito")
  )
    return null;

  const $ = cheerio.load(body);
  const pairs = extractH4Pairs($);

  const valorRaw = pairs.get("valor devuelto");
  const amount = valorRaw ? parseAmountToNumber(valorRaw) : null;
  if (amount === null) return null;

  const cuenta = pairs.get("cuenta") ?? "";
  const local = pairs.get("local") ?? "";
  const fechaRaw = pairs.get("fecha");

  const occurred_at = parseOccurredAt(
    fechaRaw || null,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description = local?.trim() || "BANCO GUAYAQUIL - Nota de crédito";

  const card_last4Raw = cuenta ? extractLast4(cuenta.replace(/-/g, "")) : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const commentParts: string[] = [];
  if (cuenta?.trim()) commentParts.push(`Cuenta: ${cuenta.trim()}`);

  return {
    type: "income",
    description,
    amount,
    occurred_at,
    card_last4,
    comment: commentParts.length > 0 ? commentParts.join(" | ") : undefined,
  };
}

/**
 * Consumo por $ X.XX en [establecimiento] - Banco Guayaquil
 * Notificación de consumo (débito/crédito). Subject: "Consumo por $ 33.47 en ATIMASA PLAZA DANIN".
 * Body: Detalle de tu consumo, h2 amount, p establishment, MASTERCARD DEBIT – 514440-XXXXXX-4008, "Consumo nacional YYYY/MM/DD A LAS HH:mm:ss".
 */
export function extractGuayaquilConsumo(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").trim();

  if (!subject.toLowerCase().includes("consumo por")) return null;

  const $ = cheerio.load(body);

  let amount: number | null = null;
  const subjectAmountMatch = subject.match(/Consumo por\s*\$?\s*([\d.,]+)/i);
  if (subjectAmountMatch) {
    amount = parseAmountToNumber(subjectAmountMatch[1]);
  }
  if (amount === null) {
    const h2Amount = clean($("h2").first().text());
    amount = h2Amount ? parseAmountToNumber(h2Amount) : null;
  }
  if (amount === null) return null;

  let establishment = "";
  const subjectEnMatch = subject.match(/\s+en\s+(.+)$/i);
  if (subjectEnMatch) establishment = clean(subjectEnMatch[1]);
  if (!establishment) {
    const innerTables = $(".container.post").first().find("p");
    innerTables.each((_, el) => {
      const t = clean($(el).text());
      if (t && !t.startsWith("$") && !/^\d/.test(t) && t.length > 2) {
        establishment = t;
        return false;
      }
    });
  }
  const description = establishment?.trim() || "BANCO GUAYAQUIL - Consumo";

  const fullText = $("body").text();
  const cardMatch = fullText.match(/\d{6,}-X+-\d{4}/);
  const card_last4Raw = cardMatch
    ? extractLast4(cardMatch[0].replace(/-/g, ""))
    : null;
  const card_last4 = card_last4Raw
    ? card_last4Raw.padStart(4, "0").slice(-4)
    : undefined;

  const dateMatch = fullText.match(
    /(\d{4})\/(\d{2})\/(\d{2})\s+A LAS\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/i,
  );
  const fechaRaw = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}${dateMatch[6] ? `:${dateMatch[6]}` : ":00"}`
    : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    card_last4,
    prefer_card_type: "debit",
  };
}
