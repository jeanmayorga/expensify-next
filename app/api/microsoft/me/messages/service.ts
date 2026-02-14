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
  "@odata.nextLink"?: string;
}

export interface PaginatedMessages {
  messages: MicrosoftMeMessage[];
  nextLink: string | null;
}

function formatMessage(msg: GraphMessage): MicrosoftMeMessage {
  // Microsoft Graph uses 'from' for single message and 'sender' for list
  const sender = msg.from?.emailAddress || msg.sender?.emailAddress;

  return {
    id: msg.id,
    subject: msg.subject || "",
    from: sender?.address?.toLowerCase() || "",
    fromName: sender?.name || "",
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

  async getMessages(
    date?: string,
    cursor?: string,
    timezoneOffset: number = 0,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<PaginatedMessages> {
    try {
      console.log("MessagesService->getMessages()->", {
        date,
        dateFrom,
        dateTo,
        cursor,
        timezoneOffset,
      });

      let response: { data: GraphMessagesResponse };

      if (cursor) {
        // Use the nextLink directly for subsequent pages
        response = await axios.get<GraphMessagesResponse>(cursor, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
      } else {
        // Build initial URL
        let url =
          "/?$select=id,sender,receivedDateTime,subject&$orderby=receivedDateTime desc&$top=25";

        if (dateFrom && dateTo) {
          const [y1, m1, d1] = dateFrom.split("-").map(Number);
          const [y2, m2, d2] = dateTo.split("-").map(Number);
          const baseUtcStart = Date.UTC(y1, m1 - 1, d1, 0, 0, 0);
          const baseUtcEnd = Date.UTC(y2, m2 - 1, d2, 23, 59, 59);
          const startUtc = baseUtcStart + timezoneOffset * 60 * 1000;
          const endUtc = baseUtcEnd + timezoneOffset * 60 * 1000;
          const startDate = new Date(startUtc).toISOString();
          const endDate = new Date(endUtc).toISOString();
          url += `&$filter=receivedDateTime ge ${startDate} and receivedDateTime le ${endDate}`;
        } else if (date) {
          const [year, month, day] = date.split("-").map(Number);
          const baseUtcStart = Date.UTC(year, month - 1, day, 0, 0, 0);
          const baseUtcEnd = Date.UTC(year, month - 1, day, 23, 59, 59);
          const startUtc = baseUtcStart + timezoneOffset * 60 * 1000;
          const endUtc = baseUtcEnd + timezoneOffset * 60 * 1000;
          const startDate = new Date(startUtc).toISOString();
          const endDate = new Date(endUtc).toISOString();
          url += `&$filter=receivedDateTime ge ${startDate} and receivedDateTime le ${endDate}`;
        }

        response = await this.messagesApi.get<GraphMessagesResponse>(url);
      }

      const messages = response.data?.value || [];
      const nextLink = response.data?.["@odata.nextLink"] || null;

      console.log("MessagesService->getMessages()->messages");

      return {
        messages: messages.map(formatMessage),
        nextLink,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MessagesService->getMessages()->error", message);
      throw error;
    }
  }
}
