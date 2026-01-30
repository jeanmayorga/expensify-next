import axios, { AxiosInstance } from "axios";
import { getErrorMessage } from "@/utils/handle-error";
import { MicrosoftMeMessage } from "./model";

export class MessagesService {
  private readonly messagesApi: AxiosInstance;

  constructor(readonly accessToken: string) {
    this.messagesApi = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0/me/messages",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getMessageById(messageId: string): Promise<MicrosoftMeMessage | null> {
    try {
      console.log("MessagesService->getMessageById()->", messageId);
      const response = await this.messagesApi.get(
        `/${messageId}?$select=from,receivedDateTime,body,subject`,
      );

      const formattedMessage: MicrosoftMeMessage = {
        id: messageId,
        subject: response.data?.subject || "",
        from: response.data?.from?.emailAddress?.address?.toLowerCase() || "",
        receivedDateTime:
          response.data?.receivedDateTime || new Date().toISOString(),
        body: response.data?.body?.content || "",
      };

      return formattedMessage;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MessagesService->getMessageById()->error", message);
      throw error;
    }
  }
}
