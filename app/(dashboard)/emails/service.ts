import { api } from "@/lib/api";
import type { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { PaginatedMessages } from "@/app/api/microsoft/me/messages/service";
import type {
  Transaction,
  TransactionInsert,
} from "@/app/api/transactions/model";
import type { TransactionWithRelations } from "../[month]/transactions/service";

export type {
  MicrosoftMeMessage,
  PaginatedMessages,
  Transaction,
  TransactionInsert,
  TransactionWithRelations,
};

export async function getEmails(date: string, cursor?: string) {
  const { data } = await api.get<{ data: PaginatedMessages }>(
    "/microsoft/me/messages",
    {
      params: {
        date,
        tz: new Date().getTimezoneOffset(),
        cursor,
      },
    },
  );
  return data.data;
}

export async function getEmail(id: string) {
  const { data } = await api.get<{ data: MicrosoftMeMessage }>(
    `/microsoft/me/messages/${id}`,
  );
  return data.data;
}

export async function getTransactionByMessageId(messageId: string) {
  const { data } = await api.get<{ data: TransactionWithRelations | null }>(
    `/transactions/by-message/${messageId}`,
  );
  return data.data;
}

/**
 * GET extracted transaction data from an email (does not create the transaction).
 * Returns TransactionInsert ready to pre-fill the create sheet.
 */
export async function getExtractTransactionData(
  messageId: string,
): Promise<TransactionInsert> {
  try {
    const { data } = await api.get<
      { data: TransactionInsert } | { error: string }
    >(`/microsoft/me/messages/${messageId}/extract-transaction`);
    if ("error" in data) {
      throw new Error(data.error);
    }
    return data.data;
  } catch (err: unknown) {
    const msg =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error
        : null;
    if (typeof msg === "string") throw new Error(msg);
    throw err;
  }
}
