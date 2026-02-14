import { format, parseISO } from "date-fns";
import { getEcuadorDate } from "./ecuador-time";

type TransactionWithOccurredAt = { occurred_at: string | Date };

/**
 * Groups transactions by date (Ecuador timezone).
 * Returns entries sorted by date descending (most recent first).
 */
export function groupTransactionsByDate<T extends TransactionWithOccurredAt>(
  txs: T[],
): [string, T[]][] {
  const groups: Record<string, T[]> = {};
  txs.forEach((tx) => {
    const utcDate =
      typeof tx.occurred_at === "string"
        ? parseISO(tx.occurred_at)
        : tx.occurred_at;
    const ecuadorDate = getEcuadorDate(utcDate);
    const dateKey = format(ecuadorDate, "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}
