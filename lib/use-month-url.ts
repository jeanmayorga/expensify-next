"use client";

import { format } from "date-fns";
import { useCallback, useMemo } from "react";
import { useQueryState, parseAsString } from "nuqs";

/**
 * Parses "yyyy-MM" to a Date (first day of month in local time).
 */
function parseMonthString(monthStr: string): Date {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/**
 * Hook to read/write the selected month in the URL query (e.g. ?month=2026-01).
 * Shared across dashboard pages so the month persists when navigating.
 */
export function useMonthInUrl(): [Date, (date: Date) => void] {
  const [monthStr, setMonthStr] = useQueryState("month", parseAsString);

  const selectedMonth = useMemo(() => {
    if (!monthStr) return new Date();
    try {
      return parseMonthString(monthStr);
    } catch {
      return new Date();
    }
  }, [monthStr]);

  const setSelectedMonth = useCallback(
    (date: Date) => {
      setMonthStr(format(date, "yyyy-MM"));
    },
    [setMonthStr],
  );

  return [selectedMonth, setSelectedMonth];
}
