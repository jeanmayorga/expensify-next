import { useQuery } from "@tanstack/react-query";
import { getEmails, getEmail } from "./service";

export const emailKeys = {
  all: ["emails"] as const,
  detail: (id: string) => ["emails", id] as const,
};

export function useEmails() {
  return useQuery({
    queryKey: emailKeys.all,
    queryFn: getEmails,
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: emailKeys.detail(id),
    queryFn: () => getEmail(id),
    enabled: !!id,
  });
}
