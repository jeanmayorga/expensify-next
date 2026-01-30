import axios, { AxiosInstance } from "axios";
import { getErrorMessage } from "@/utils/handle-error";
import { MicrosoftMeMessage } from "./model";

// Microsoft Graph API response types
interface GraphEmailAddress {
  address: string;
  name?: string;
}

interface GraphMessage {
  id: string;
  subject?: string;
  from?: {
    emailAddress?: GraphEmailAddress;
  };
  sender?: {
    emailAddress?: GraphEmailAddress;
  };
  receivedDateTime?: string;
  body?: {
    content?: string;
  };
}

interface GraphMessagesResponse {
  value: GraphMessage[];
}

function formatMessage(msg: GraphMessage): MicrosoftMeMessage {
  // Microsoft Graph uses 'from' for single message and 'sender' for list
  const emailAddress =
    msg.from?.emailAddress?.address || msg.sender?.emailAddress?.address;

  return {
    id: msg.id,
    subject: msg.subject || "",
    from: emailAddress?.toLowerCase() || "",
    receivedDateTime: msg.receivedDateTime || new Date().toISOString(),
    body: msg.body?.content || "",
  };
}

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

      const response = await this.messagesApi.get<GraphMessage>(
        `/${messageId}?$select=from,receivedDateTime,body,subject`,
      );

      return formatMessage({ ...response.data, id: messageId });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MessagesService->getMessageById()->error", message);
      throw error;
    }
  }

  async getMessages(): Promise<MicrosoftMeMessage[]> {
    try {
      console.log("MessagesService->getMessages()");

      const response = await this.messagesApi.get<GraphMessagesResponse>(
        "/?$select=id,sender,receivedDateTime,subject",
      );

      const messages = response.data?.value || [];
      return messages.map(formatMessage);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MessagesService->getMessages()->error", message);
      throw error;
    }
  }
}
