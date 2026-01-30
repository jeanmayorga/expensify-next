import { api } from "@/lib/api";
import type { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";

export type { MicrosoftMeMessage };

export async function getEmails() {
  const { data } = await api.get<{ data: MicrosoftMeMessage[] }>(
    "/microsoft/me/messages",
  );
  return data.data;
}

export async function getEmail(id: string) {
  const { data } = await api.get<{ data: MicrosoftMeMessage }>(
    `/microsoft/me/messages/${id}`,
  );
  return data.data;
}
