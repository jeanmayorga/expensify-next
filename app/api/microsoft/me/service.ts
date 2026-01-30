import axios, { AxiosInstance } from "axios";
import type { MicrosoftUser } from "./model";

export class MeService {
  private readonly meApi: AxiosInstance;

  constructor(readonly accessToken: string) {
    this.meApi = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0/me",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getMe(): Promise<MicrosoftUser | null> {
    try {
      console.log("MeService->getMe()");
      const response = await this.meApi.get<MicrosoftUser>("/");
      return response.data;
    } catch (error) {
      console.error("MeService->getMe()->", error);
      return null;
    }
  }
}
