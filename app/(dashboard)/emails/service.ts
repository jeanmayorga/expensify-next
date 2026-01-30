import { api } from "@/lib/api";
import type { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { PaginatedMessages } from "@/app/api/microsoft/me/messages/service";
import type { Transaction } from "@/app/api/transactions/model";

export type { MicrosoftMeMessage, PaginatedMessages, Transaction };

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
  const { data } = await api.get<{ data: Transaction | null }>(
    `/transactions/by-message/${messageId}`,
  );
  return data.data;
}

export async function extractTransactionFromEmail(id: string) {
  const { data } = await api.post<{ data: Transaction }>(
    `/microsoft/me/messages/${id}/extract`,
  );
  return data.data;
}
