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
  extractTransactionFromEmail,
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

export function useExtractTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => extractTransactionFromEmail(messageId),
    onSuccess: (_data, messageId) => {
      // Invalidate the transaction query to refetch and enable "Find transaction" button
      queryClient.invalidateQueries({
        queryKey: ["transactions", "by-message", messageId],
      });
    },
  });
}
