import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getEmails,
  getEmail,
  getTransactionByMessageId,
  getExtractTransactionData,
} from "./service";

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

export function useTransactionByMessageId(messageId: string) {
  return useQuery({
    queryKey: ["transactions", "by-message", messageId],
    queryFn: () => getTransactionByMessageId(messageId),
    enabled: !!messageId,
  });
}

/**
 * Fetches extracted transaction data from an email (GET extract-transaction).
 * Use the returned data to pre-fill the create transaction sheet.
 */
export function useExtractTransactionData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => getExtractTransactionData(messageId),
    onSuccess: (_data, messageId) => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", "by-message", messageId],
      });
    },
  });
}
