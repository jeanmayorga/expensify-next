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

/** Transaction with id, type, amount for pair matching */
type TxForPair = {
  id: number;
  type: string;
  amount: number;
  occurred_at: string | Date;
};

/** Single purple color for all merge pairs - exported for TransactionRow */
export const MERGE_BUTTON_STYLE =
  "border-violet-500 text-violet-600 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-600";
export const MERGE_ROW_TINT = "bg-violet-500/5";

export interface MergePairInfo {
  pairId: string;
  /** IDs of both transactions in the pair */
  ids: [number, number];
}

/**
 * Finds expense-reimbursement pairs within a day's transactions.
 * Pairs: one expense + one income with same absolute amount.
 * Returns a map from transaction id to merge pair info.
 */
export function findExpenseReimbursementPairs<T extends TxForPair>(
  txs: T[],
  dateKey: string,
): Map<number, MergePairInfo> {
  const result = new Map<number, MergePairInfo>();
  const expenses = txs.filter((t) => t.type === "expense");
  const incomes = txs.filter((t) => t.type === "income");

  const usedExpense = new Set<number>();
  const usedIncome = new Set<number>();
  let pairIndex = 0;

  for (const exp of expenses) {
    if (usedExpense.has(exp.id)) continue;
    const match = incomes.find(
      (inc) =>
        !usedIncome.has(inc.id) &&
        Math.abs(inc.amount - exp.amount) < 0.01,
    );
    if (match) {
      usedExpense.add(exp.id);
      usedIncome.add(match.id);
      const pairId = `${dateKey}-${exp.amount.toFixed(2)}-${pairIndex}`;
      const info: MergePairInfo = {
        pairId,
        ids: [exp.id, match.id],
      };
      result.set(exp.id, info);
      result.set(match.id, info);
      pairIndex++;
    }
  }

  return result;
}
