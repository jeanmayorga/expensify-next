import { MessagesService } from "@/app/api/microsoft/me/messages/service";
import { BanksRepository } from "@/app/api/banks/repository";
import { CardsRepository } from "@/app/api/cards/repository";
import type { TransactionInsert } from "@/app/api/transactions/model";
import type { Bank } from "@/app/api/banks/model";
import type { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import {
  getExtractor,
  getRegistrySlugFromBankEmails,
  normalizeSubject,
} from "./registry";
import { extractPacifiCardConfirmacionPago } from "./extractors/pacifico";

export interface ExtractTransactionDataResult {
  data: TransactionInsert;
}

export interface ExtractTransactionDataError {
  error: string;
}

/**
 * Builds a TransactionInsert from an already-fetched message and bank.
 * Does NOT validate (find by bank, blacklist, body) — caller must do that.
 * Used by webhook after explicit validation.
 */
export async function buildTransactionInsertFromEmail(
  message: MicrosoftMeMessage,
  bank: Bank,
  messageId: string,
): Promise<TransactionInsert | null> {
  let extractor = getExtractor(bank.slug ?? null, message.subject ?? "");
  if (!extractor) {
    const slugFromEmails =
      getRegistrySlugFromBankEmails(bank.emails) ??
      (message.from ? getRegistrySlugFromBankEmails([message.from]) : null);
    if (slugFromEmails)
      extractor = getExtractor(slugFromEmails, message.subject ?? "");
  }
  // Fallback: Pacifico "Confirmacion de Pago" by sender domain + subject keywords
  if (!extractor) {
    const from = (message.from || "").toLowerCase();
    const subj = normalizeSubject(message.subject ?? "");
    if (
      (from.includes("infopacificard") || from.includes("pacificard")) &&
      subj.includes("confirmacion") &&
      subj.includes("pago")
    ) {
      extractor = extractPacifiCardConfirmacionPago;
    }
  }
  if (!extractor) return null;

  const extracted = extractor(message);
  if (!extracted) return null;

  let card_id: string | null = null;
  if (bank.id) {
    const cardsRepository = new CardsRepository();
    const bankCards = (await cardsRepository.getAll()).filter(
      (c) => c.bank_id === bank.id,
    );

    if (extracted.card_last4) {
      const last4Norm = String(extracted.card_last4).trim();
      const suffix3 = last4Norm.length >= 3 ? last4Norm.slice(-3) : "";
      const match = bankCards.find((c) => {
        if (c.last4 == null) return false;
        const cLast4 = String(c.last4).trim();
        return (
          cLast4 === last4Norm ||
          (last4Norm.length === 4 && cLast4.endsWith(last4Norm)) ||
          (suffix3.length >= 3 && cLast4.endsWith(suffix3))
        );
      });
      if (match) card_id = match.id;
    }

    if (card_id == null && extracted.prefer_card_type && bankCards.length > 0) {
      const prefer = extracted.prefer_card_type;
      const isDebit = (t: string | null) =>
        t != null && /debit|d[eé]bito/i.test(String(t).trim());
      const isCredit = (t: string | null) =>
        t != null && /credit|cr[eé]dito/i.test(String(t).trim());
      const match = bankCards.find((c) =>
        prefer === "debit"
          ? isDebit(c.card_type) || isDebit(c.card_kind)
          : isCredit(c.card_type) || isCredit(c.card_kind),
      );
      if (match) card_id = match.id;
    }
  }

  // Default budget_id for Produbanco: "amor" budget
  const PRODUBANCO_DEFAULT_BUDGET_ID = "0dc7502d-9d2a-4be1-a83d-6afb53545cb7";
  const isProdubanco =
    bank.slug?.toLowerCase().includes("produbanco") ||
    bank.name?.toLowerCase().includes("produbanco");
  const budget_id = isProdubanco ? PRODUBANCO_DEFAULT_BUDGET_ID : null;

  return {
    type: extracted.type,
    description: extracted.description,
    amount: extracted.amount,
    occurred_at: extracted.occurred_at,
    income_message_id: messageId,
    bank_id: bank.id,
    card_id,
    category_id: null,
    budget_id,
    comment: extracted.comment ?? null,
  };
}

/**
 * Fetches the message by ID, validates it against bank whitelist and blacklist,
 * runs the appropriate extractor by subject, and returns a TransactionInsert
 * ready to create a transaction.
 *
 * Reusable by: GET /api/microsoft/me/messages/[id]/extract-transaction
 */
export async function extractTransactionData(
  messageId: string,
  accessToken: string,
): Promise<ExtractTransactionDataResult | ExtractTransactionDataError> {
  const messageService = new MessagesService(accessToken);
  const message = await messageService.getMessageById(messageId);

  if (!message) {
    return { error: "Message not found" };
  }

  const banksRepository = new BanksRepository();
  const bank = await banksRepository.getByEmail(message.from);

  if (!bank) {
    return { error: "Email not in bank whitelist" };
  }

  const blacklistedSubjects = bank.blacklisted_subjects || [];
  const isBlacklisted = blacklistedSubjects.some((subject) =>
    message.subject?.toUpperCase().includes(subject.toUpperCase()),
  );
  if (isBlacklisted) {
    return { error: "Subject blacklisted for this bank" };
  }

  if (!message.body?.trim()) {
    return { error: "No message body" };
  }

  const data = await buildTransactionInsertFromEmail(message, bank, messageId);
  if (!data) {
    return { error: "No extractor for this bank and subject" };
  }

  return { data };
}
