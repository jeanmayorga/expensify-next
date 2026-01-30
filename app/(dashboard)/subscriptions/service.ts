import { MicrosoftSubscription } from "@/app/api/microsoft/subscriptions/model";

export async function getSubscriptions(): Promise<MicrosoftSubscription[]> {
  const response = await fetch("/api/microsoft/subscriptions");
  if (!response.ok) {
    throw new Error("Failed to fetch subscriptions");
  }
  const result = await response.json();
  return result.data;
}

export async function createSubscription(): Promise<MicrosoftSubscription> {
  const response = await fetch("/api/microsoft/subscriptions", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to create subscription");
  }
  const result = await response.json();
  return result.data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const response = await fetch(`/api/microsoft/subscriptions/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete subscription");
  }
}

export async function renewSubscription(id: string): Promise<void> {
  const response = await fetch(`/api/microsoft/subscriptions/${id}`, {
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error("Failed to renew subscription");
  }
}
