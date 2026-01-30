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
) {
  const found = pairs.find(
    (p) => p.label.toLowerCase() === label.toLowerCase(),
  );
  return found?.value ?? null;
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

export function extractInfoFromBancoPichincha(
  message: MicrosoftMeMessage,
): string {
  const body = message.body || "";
  const subject = (message.subject || "").toLowerCase();

  if (!body.trim()) return "";

  if (subject.includes("notificación de consumos")) {
    const pairs = extractPairs(body);

    const valorRaw = getExact(pairs, "Valor");
    const establecimiento = getExact(pairs, "Establecimiento");
    const tarjeta = getExact(pairs, "Tarjeta usada");
    const fecha = getExact(pairs, "Fecha");

    const parts = [
      "BANCO PICHINCHA - Notificación de Consumos",
      valorRaw ? `Valor: ${normalizeAmount(valorRaw)}` : null,
      establecimiento ? `Establecimiento: ${establecimiento}` : null,
      tarjeta ? `Tarjeta usada: ${tarjeta}` : null,
      fecha ? `Fecha: ${fecha}` : null,
    ].filter(Boolean);

    return parts.join("\n");
  }

  if (subject.includes("transferencia banca electronica banco pichincha")) {
    const pairs = extractPairs(body);

    const cuentaOrigen = getExact(pairs, "Cuenta de origen:");
    const cuentaAcreditada = getExact(pairs, "Cuenta acreditada:");
    const beneficiario = getExact(pairs, "Nombre del beneficiario:");
    const montoRaw = getExact(pairs, "Monto:");
    const fechaDetalle = getExact(pairs, "Fecha:");
    const concepto = getExact(pairs, "Concepto:");
    const documento = getExact(pairs, "Número de documento:");

    const parts = [
      "BANCO PICHINCHA - Transferencia",
      cuentaOrigen ? `Cuenta de origen: ${cuentaOrigen}` : null,
      cuentaAcreditada ? `Cuenta acreditada: ${cuentaAcreditada}` : null,
      beneficiario ? `Nombre del beneficiario: ${beneficiario}` : null,
      montoRaw ? `Monto: ${normalizeAmount(montoRaw)}` : null,
      fechaDetalle ? `Fecha: ${fechaDetalle}` : null,
      concepto !== null ? `Concepto: ${concepto}` : null,
      documento ? `Número de documento: ${documento}` : null,
    ].filter(Boolean);

    return parts.join("\n");
  }

  if (subject.includes("notificación banco pichincha")) {
    const pairs = extractPairs(body);

    const cuentaOrigen = getExact(pairs, "Cuenta de origen:");
    const bancoDestino = getExact(pairs, "Banco destino:");
    const cuentaAcreditada = getExact(pairs, "Cuenta acreditada:");
    const fecha = getExact(pairs, "Fecha:");
    const beneficiario = getExact(pairs, "Nombre del beneficiario:");
    const identificacion = getExact(pairs, "Identificación beneficiario:");
    const montoRaw = getExact(pairs, "Monto:");
    const descripcion = getExact(pairs, "Descripción:");
    const documento = getExact(pairs, "Número de documento:");

    const parts = [
      "BANCO PICHINCHA - Transferencia (Notificación)",
      cuentaOrigen ? `Cuenta de origen: ${cuentaOrigen}` : null,
      bancoDestino ? `Banco destino: ${bancoDestino}` : null,
      cuentaAcreditada ? `Cuenta acreditada: ${cuentaAcreditada}` : null,
      fecha ? `Fecha: ${fecha}` : null,
      beneficiario ? `Nombre del beneficiario: ${beneficiario}` : null,
      identificacion ? `Identificación beneficiario: ${identificacion}` : null,
      montoRaw ? `Monto: ${normalizeAmount(montoRaw)}` : null,
      descripcion !== null ? `Descripción: ${descripcion}` : null,
      documento ? `Número de documento: ${documento}` : null,
    ].filter(Boolean);

    return parts.join("\n");
  }

  // Fallback: return plain text from HTML
  return stripToText(body);
}
