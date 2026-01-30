import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getEmails, getEmail } from "./service";

export function useEmails(date: string) {
  return useInfiniteQuery({
    queryKey: ["emails", date],
    queryFn: ({ pageParam }) => getEmails(date, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextLink ?? undefined,
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: ["emails", id],
    queryFn: () => getEmail(id),
    enabled: !!id,
  });
}
