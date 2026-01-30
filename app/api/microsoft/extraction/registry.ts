import { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { ExtractedTransactionData } from "./types";
import {
  extractPacifiCardConsumos,
  extractPacifiCardConfirmacionPago,
} from "./extractors/pacifico";
import {
  extractProdubancoConsumoTarjeta,
  extractProdubancoConsumoDebito,
  extractProdubancoReversoDebito,
  extractProdubancoReversoCredito,
  extractProdubancoTransferenciaRecibida,
  extractProdubancoTransferenciaEnviada,
  PRODUBANCO_SUBJECT_CREDITO,
  PRODUBANCO_SUBJECT_DEBITO,
  PRODUBANCO_SUBJECT_REVERSO_DEBITO,
  PRODUBANCO_SUBJECT_REVERSO_CREDITO,
  PRODUBANCO_SUBJECT_TRANSFERENCIA_RECIBIDA,
  PRODUBANCO_SUBJECT_TRANSFERENCIA_ENVIADA,
} from "./extractors/produbanco";
import {
  extractPichinchaNotificacionConsumos,
  extractPichinchaTransferencia,
  extractPichinchaNotificacionBanco,
} from "./extractors/pichincha";
import {
  extractGuayaquilTransferenciasInternas,
  extractGuayaquilPagoExitoso,
  extractGuayaquilNotaCredito,
  extractGuayaquilConsumo,
} from "./extractors/guayaquil";

export type TransactionExtractor = (
  message: MicrosoftMeMessage,
) => ExtractedTransactionData | null;

interface RegistryEntry {
  bankSlug: string;
  /** Subject must contain this (case-insensitive) */
  subjectContains: string;
  extractor: TransactionExtractor;
}

const REGISTRY: RegistryEntry[] = [
  {
    bankSlug: "pacifico",
    subjectContains: "Confirmacion de Pago",
    extractor: extractPacifiCardConfirmacionPago,
  },
  {
    bankSlug: "pacifico",
    subjectContains: "PacifiCard: Consumos",
    extractor: extractPacifiCardConsumos,
  },
  {
    bankSlug: "produbanco",
    subjectContains: PRODUBANCO_SUBJECT_REVERSO_CREDITO,
    extractor: extractProdubancoReversoCredito,
  },
  {
    bankSlug: "produbanco",
    subjectContains: PRODUBANCO_SUBJECT_CREDITO,
    extractor: extractProdubancoConsumoTarjeta,
  },
  // Reverso débito must be before "Consumo tarjeta de débito" (subject contains both)
  {
    bankSlug: "produbanco",
    subjectContains: PRODUBANCO_SUBJECT_REVERSO_DEBITO,
    extractor: extractProdubancoReversoDebito,
  },
  {
    bankSlug: "produbanco",
    subjectContains: PRODUBANCO_SUBJECT_DEBITO,
    extractor: extractProdubancoConsumoDebito,
  },
  {
    bankSlug: "produbanco",
    subjectContains: PRODUBANCO_SUBJECT_TRANSFERENCIA_RECIBIDA,
    extractor: extractProdubancoTransferenciaRecibida,
  },
  {
    bankSlug: "produbanco",
    subjectContains: PRODUBANCO_SUBJECT_TRANSFERENCIA_ENVIADA,
    extractor: extractProdubancoTransferenciaEnviada,
  },
  {
    bankSlug: "pichincha",
    subjectContains: "notificación de consumos",
    extractor: extractPichinchaNotificacionConsumos,
  },
  {
    bankSlug: "pichincha",
    subjectContains: "transferencia banca electronica banco pichincha",
    extractor: extractPichinchaTransferencia,
  },
  {
    bankSlug: "pichincha",
    subjectContains: "notificación banco pichincha",
    extractor: extractPichinchaNotificacionBanco,
  },
  {
    bankSlug: "guayaquil",
    subjectContains: "TRANSFERENCIAS INTERNAS",
    extractor: extractGuayaquilTransferenciasInternas,
  },
  {
    bankSlug: "guayaquil",
    subjectContains: "PAGO EXITOSO",
    extractor: extractGuayaquilPagoExitoso,
  },
  {
    bankSlug: "guayaquil",
    subjectContains: "Nota de Crédito",
    extractor: extractGuayaquilNotaCredito,
  },
  {
    bankSlug: "guayaquil",
    subjectContains: "Consumo por",
    extractor: extractGuayaquilConsumo,
  },
];

/** Strip accents for matching (e.g. "pacífico" -> "pacifico"). */
function slugToAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Normalize bank slug so variants (e.g. "banco-pacifico", "Banco del Pacífico") match registry. */
function normalizeBankSlug(slug: string): string {
  const s = slugToAscii(slug);
  if (s.includes("pacifico")) return "pacifico";
  if (s.includes("produbanco")) return "produbanco";
  if (s.includes("pichincha")) return "pichincha";
  if (s.includes("guayaquil")) return "guayaquil";
  return s || slug.toLowerCase().trim();
}

/**
 * Infer registry slug from the bank's configured emails (same list used to match the bank).
 * Use this when bank.slug doesn't match any extractor.
 */
export function getRegistrySlugFromBankEmails(
  emails: string[] | null | undefined,
): string | null {
  if (!emails?.length) return null;
  for (const email of emails) {
    const e = (email || "").toLowerCase();
    if (e.includes("infopacificard") || e.includes("pacificard"))
      return "pacifico";
    if (e.includes("produbanco")) return "produbanco";
    if (e.includes("pichincha")) return "pichincha";
    if (e.includes("bancoguayaquil")) return "guayaquil";
  }
  return null;
}

/** Normalize subject for matching: trim, collapse spaces, remove accents. */
export function normalizeSubject(subject: string): string {
  return slugToAscii((subject || "").toLowerCase().replace(/\s+/g, " ").trim());
}

/**
 * Returns the first matching extractor for the given bank slug and subject.
 */
export function getExtractor(
  bankSlug: string | null,
  subject: string,
): TransactionExtractor | null {
  if (!bankSlug) return null;
  const normalizedSlug = normalizeBankSlug(bankSlug);
  const subjectNorm = normalizeSubject(subject);
  const entry = REGISTRY.find(
    (e) =>
      normalizeBankSlug(e.bankSlug) === normalizedSlug &&
      subjectNorm.includes(slugToAscii(e.subjectContains.toLowerCase())),
  );
  return entry ? entry.extractor : null;
}
