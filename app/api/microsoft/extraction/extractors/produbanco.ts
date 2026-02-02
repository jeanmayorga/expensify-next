import * as cheerio from "cheerio";
import { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { ExtractedTransactionData } from "../types";
import { clean, parseAmountToNumber, parseOccurredAt } from "../utils";

/**
 * Produbanco envía varios tipos de email; cada uno tiene su extractor:
 *
 * 1) Crédito — asunto: "Consumo Tarjeta de Crédito por USD 1.54"
 *    Cuerpo: Valor, Establecimiento, Tarjeta XXX3733, Fecha y Hora
 *
 * 2) Débito  — asunto: "Consumo tarjeta de débito por USD 2.88"
 *    Cuerpo: Valor, Establecimiento, Cuenta Débito CNA XXXXXX90214, Fecha y Hora
 *
 * 3a) Reverso débito — asunto: "Notificación Reverso Consumo Tarjeta de Débito Produbanco"
 *     Cuerpo: Valor, Establecimiento, tarjeta VISA XXXXXXXXXXXX5073, Fecha y Hora (MM/DD/YYYY HH:mm:ss)
 *     Tipo: ingreso (reverso = devolución)
 *
 * 3b) Reverso crédito — asunto: "Reverso Consumo Tarjeta de Crédito Produbanco"
 *     Cuerpo: Valor, Establecimiento, tarjeta MasterCard XXX3733, Fecha y Hora (igual que consumo crédito)
 *     Tipo: ingreso (reverso = devolución)
 *
 * 4) Transferencia recibida — asunto: "Transferencia recibida desde Produbanco"
 *    Cuerpo: Monto, Descripción, Enviada por, Cuenta Contacto XXXXX88802, Fecha y Hora
 *    Tipo: ingreso
 *
 * 5) Transferencia enviada — asunto: "Transferencia enviada por $9.00 desde Produbanco"
 *    Cuerpo: Monto, Descripción, Contacto, Cuenta Contacto XXXXX88802, Fecha y Hora (igual que recibida)
 *    Tipo: gasto
 *
 * Las tarjetas/cuentas se guardan siempre con last4 de 4 dígitos.
 */

/** Asunto tipo 1: Consumo Tarjeta de Crédito — ej. "Consumo Tarjeta de Crédito por USD 1.54" */
export const PRODUBANCO_SUBJECT_CREDITO = "Consumo Tarjeta de Crédito";

/** Asunto tipo 2: Consumo tarjeta de débito — ej. "Consumo tarjeta de débito por USD 2.88" */
export const PRODUBANCO_SUBJECT_DEBITO = "Consumo tarjeta de débito";

/** Asunto tipo 3a: Reverso consumo tarjeta de débito */
export const PRODUBANCO_SUBJECT_REVERSO_DEBITO =
  "Notificación Reverso Consumo Tarjeta de Débito Produbanco";

/** Asunto tipo 3b: Reverso consumo tarjeta de crédito */
export const PRODUBANCO_SUBJECT_REVERSO_CREDITO =
  "Reverso Consumo Tarjeta de Crédito";

/** Asunto tipo 4: Transferencia recibida */
export const PRODUBANCO_SUBJECT_TRANSFERENCIA_RECIBIDA =
  "Transferencia recibida desde Produbanco";

/** Asunto tipo 5: Transferencia enviada */
export const PRODUBANCO_SUBJECT_TRANSFERENCIA_ENVIADA = "Transferencia enviada";

/**
 * 1) Consumo Tarjeta de Crédito — ej. "Consumo Tarjeta de Crédito por USD 1.54"
 */
export function extractProdubancoConsumoTarjeta(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes(PRODUBANCO_SUBJECT_CREDITO.toLowerCase())) return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // Valor: USD 1.54
  const valorMatch = text.match(/(?:Valor|valor):\s*(?:USD\s*)?([\d.,]+)/i);
  const amount = valorMatch ? parseAmountToNumber(valorMatch[1]) : null;
  if (amount === null) return null;

  // Establecimiento: DIDI RIDES EC KS
  const establecimientoMatch = text.match(
    /Establecimiento:\s*([^\n]+?)(?=\s*Atentamente|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  // Tarjeta de Crédito: XXX3733 → last4 siempre 4 dígitos
  const tarjetaMatch = text.match(/XXX\s*(\d{3,4})/);
  const raw = tarjetaMatch ? tarjetaMatch[1] : null;
  const card_last4 = raw ? raw.slice(-4).padStart(4, "0") : undefined;

  // Fecha y Hora: 30/Enero/2026 10:03
  const fechaMatch = text.match(
    /Fecha\s+y\s+Hora:\s*([^\n]+?)(?=\s*Transacción|$)/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    establecimiento?.trim() || "Produbanco - Consumo Tarjeta de Crédito";

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    card_last4,
  };
}

/**
 * 2) Consumo tarjeta de débito — ej. "Consumo tarjeta de débito por USD 2.88"
 */
export function extractProdubancoConsumoDebito(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes(PRODUBANCO_SUBJECT_DEBITO.toLowerCase())) return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // Valor: USD 2.88
  const valorMatch = text.match(/(?:Valor|valor):\s*(?:USD\s*)?([\d.,]+)/i);
  const amount = valorMatch ? parseAmountToNumber(valorMatch[1]) : null;
  if (amount === null) return null;

  // Establecimiento: DLC* UBER RIDES SAN JOSE CR
  const establecimientoMatch = text.match(
    /Establecimiento:\s*([^\n]+?)(?=\s*Cuenta|\s*Atentamente|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  // Cuenta Débito: CNA XXXXXX90214 → last4 siempre 4 dígitos (90214 → 0214)
  // Regex flexible: tras "Cuenta Débito:" permite cualquier texto hasta X+ dígitos
  const cuentaMatch = text.match(/Cuenta\s+D[ée]bito:\s*[\s\S]*?X+(\d{4,5})/i);
  const raw = cuentaMatch ? cuentaMatch[1] : null;
  const card_last4 = raw ? raw.slice(-4) : undefined;

  // Fecha y Hora: 30/Enero/2026 14:54
  const fechaMatch = text.match(
    /Fecha\s+y\s+Hora:\s*([^\n]+?)(?=\s*Transacción|$)/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    establecimiento?.trim() || "Produbanco - Consumo Tarjeta de Débito";

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    card_last4,
    prefer_card_type: "debit",
  };
}

/**
 * 3) Reverso consumo tarjeta de débito — ej. "Notificación Reverso Consumo Tarjeta de Débito Produbanco"
 * Tipo: ingreso (devolución).
 */
export function extractProdubancoReversoDebito(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes(PRODUBANCO_SUBJECT_REVERSO_DEBITO.toLowerCase()))
    return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // Valor: USD 2.11
  const valorMatch = text.match(/(?:Valor|valor):\s*(?:USD\s*)?([\d.,]+)/i);
  const amount = valorMatch ? parseAmountToNumber(valorMatch[1]) : null;
  if (amount === null) return null;

  // Establecimiento: UBR* PENDING.UBER.COM Amsterdam IE
  const establecimientoMatch = text.match(
    /Establecimiento:\s*([^\n]+?)(?=\s*Atentamente|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  // tarjeta VISA Produbanco XXXXXXXXXXXX5073 → last4 siempre 4 dígitos
  const tarjetaMatch = text.match(/X+(\d{4})/);
  const card_last4 = tarjetaMatch ? tarjetaMatch[1] : undefined;

  // Fecha y Hora: 02/01/2026 19:02:07 (MM/DD/YYYY HH:mm:ss)
  const fechaMatch = text.match(
    /Fecha\s+y\s+Hora:\s*([^\n]+?)(?=\s*Transacción|$)/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  // Reverso débito usa formato MM/DD/YYYY (estadounidense)
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
    "mdy",
  );

  const description =
    establecimiento?.trim() || "Produbanco - Reverso Consumo Tarjeta de Débito";

  return {
    type: "income",
    description,
    amount,
    occurred_at,
    card_last4,
  };
}

/**
 * 3b) Reverso consumo tarjeta de crédito — ej. "Reverso Consumo Tarjeta de Crédito Produbanco"
 * Tipo: ingreso (devolución).
 */
export function extractProdubancoReversoCredito(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes(PRODUBANCO_SUBJECT_REVERSO_CREDITO.toLowerCase()))
    return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // Valor: USD 1.00
  const valorMatch = text.match(/(?:Valor|valor):\s*(?:USD\s*)?([\d.,]+)/i);
  const amount = valorMatch ? parseAmountToNumber(valorMatch[1]) : null;
  if (amount === null) return null;

  // Establecimiento: KSH DIDI
  const establecimientoMatch = text.match(
    /Establecimiento:\s*([^\n]+?)(?=\s*Atentamente|$)/i,
  );
  const establecimiento = establecimientoMatch
    ? clean(establecimientoMatch[1])
    : null;

  // tarjeta MasterCard Produbanco XXX3733 → last4 siempre 4 dígitos
  const tarjetaMatch = text.match(/XXX\s*(\d{3,4})/);
  const raw = tarjetaMatch ? tarjetaMatch[1] : null;
  const card_last4 = raw ? raw.slice(-4).padStart(4, "0") : undefined;

  // Fecha y Hora: 14/Enero/2026 15:56
  const fechaMatch = text.match(
    /Fecha\s+y\s+Hora:\s*([^\n]+?)(?=\s*Transacción|$)/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    establecimiento?.trim() ||
    "Produbanco - Reverso Consumo Tarjeta de Crédito";

  return {
    type: "income",
    description,
    amount,
    occurred_at,
    card_last4,
  };
}

/**
 * 4) Transferencia recibida — ej. "Transferencia recibida desde Produbanco"
 * Tipo: ingreso.
 */
export function extractProdubancoTransferenciaRecibida(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (
    !subject.includes(PRODUBANCO_SUBJECT_TRANSFERENCIA_RECIBIDA.toLowerCase())
  )
    return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // Monto: $9.00
  const montoMatch = text.match(/Monto:\s*\$?\s*([\d.,]+)/i);
  const amount = montoMatch ? parseAmountToNumber(montoMatch[1]) : null;
  if (amount === null) return null;

  // Descripción: Transferencia Local
  const descMatch = text.match(
    /Descripción:\s*([^\n]+?)(?=\s*Referencia|\s*Atentamente|$)/i,
  );
  const descripcion = descMatch ? clean(descMatch[1]) : null;

  // Cuenta Contacto: XXXXX88802 → last4 siempre 4 dígitos (88802 → 8802)
  const cuentaMatch = text.match(/Cuenta\s+Contacto:\s*X+(\d{4,5})/i);
  const raw = cuentaMatch ? cuentaMatch[1] : null;
  const card_last4 = raw ? raw.slice(-4) : undefined;

  // Fecha y Hora: 11/Enero/2026 11:15
  const fechaMatch = text.match(
    /Fecha\s+y\s+Hora:\s*([^\n]+?)(?=\s*Transacción|$)/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const description =
    descripcion?.trim() || "Produbanco - Transferencia recibida";

  return {
    type: "income",
    description,
    amount,
    occurred_at,
    card_last4,
  };
}

/**
 * 5) Transferencia enviada — ej. "Transferencia enviada por $9.00 desde Produbanco"
 * Tipo: gasto. Description fija "Transferencia a contacto"; comment con Contacto, Banco, Cuenta, Canal.
 */
export function extractProdubancoTransferenciaEnviada(
  message: MicrosoftMeMessage,
): ExtractedTransactionData | null {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return null;
  if (!subject.includes(PRODUBANCO_SUBJECT_TRANSFERENCIA_ENVIADA.toLowerCase()))
    return null;

  const $ = cheerio.load(body);
  const text = $.text();

  // Monto: $9.00
  const montoMatch = text.match(/Monto:\s*\$?\s*([\d.,]+)/i);
  const amount = montoMatch ? parseAmountToNumber(montoMatch[1]) : null;
  if (amount === null) return null;

  // Contacto: JEAN PAUL MAYORGA COBO
  const contactoMatch = text.match(
    /Contacto:\s*([^\n]+?)(?=\s*Banco|\s*Atentamente|$)/i,
  );
  const contacto = contactoMatch ? clean(contactoMatch[1]) : null;

  // Banco Contacto: BANCO DE GUAYAQUIL
  const bancoMatch = text.match(
    /Banco\s+Contacto:\s*([^\n]+?)(?=\s*Cuenta|\s*Atentamente|$)/i,
  );
  const bancoContacto = bancoMatch ? clean(bancoMatch[1]) : null;

  // Cuenta Contacto: XXXXX88802 → para comment; last4 siempre 4 dígitos (88802 → 8802)
  const cuentaMatch = text.match(/Cuenta\s+Contacto:\s*(X+)(\d{4,5})/i);
  const cuentaContacto = cuentaMatch ? cuentaMatch[1] + cuentaMatch[2] : null;
  const card_last4 = cuentaMatch ? cuentaMatch[2].slice(-4) : undefined;

  // Canal: App Móvil
  const canalMatch = text.match(
    /Canal:\s*([^\n]+?)(?=\s*Referencia|\s*Atentamente|$)/i,
  );
  const canal = canalMatch ? clean(canalMatch[1]) : null;

  // Fecha y Hora: 11/Enero/2026 11:15
  const fechaMatch = text.match(
    /Fecha\s+y\s+Hora:\s*([^\n]+?)(?=\s*Transacción|$)/i,
  );
  const fechaRaw = fechaMatch ? clean(fechaMatch[1]) : null;
  const occurred_at = parseOccurredAt(
    fechaRaw,
    message.receivedDateTime || new Date().toISOString(),
  );

  const commentParts = [
    contacto ? `Contacto: ${contacto}` : null,
    bancoContacto ? `Banco Contacto: ${bancoContacto}` : null,
    cuentaContacto ? `Cuenta Contacto: ${cuentaContacto}` : null,
    canal ? `Canal: ${canal}` : null,
  ].filter(Boolean);
  const comment = commentParts.length > 0 ? commentParts.join(". ") : null;

  const description = contacto
    ? `Transferencia a ${contacto.trim()}`
    : "Transferencia a contacto";

  return {
    type: "expense",
    description,
    amount,
    occurred_at,
    card_last4,
    comment: comment ?? null,
  };
}
