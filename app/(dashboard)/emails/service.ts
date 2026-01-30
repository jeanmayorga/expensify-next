import { api } from "@/lib/api";
import type { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import type { PaginatedMessages } from "@/app/api/microsoft/me/messages/service";

export type { MicrosoftMeMessage, PaginatedMessages };

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
