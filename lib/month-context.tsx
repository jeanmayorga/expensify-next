"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { format, parse, isValid } from "date-fns";

interface MonthContextValue {
  /** The selected month as a Date (first day of month) */
  selectedMonth: Date;
  /** The month string in yyyy-MM format */
  monthStr: string;
  /** Build a path within the current month context */
  monthPath: (path: string) => string;
}

const MonthContext = createContext<MonthContextValue | null>(null);

/**
 * Parse a month string (yyyy-MM) into a Date.
 * Returns current month if invalid.
 */
function parseMonthParam(monthParam: string): Date {
  try {
    const parsed = parse(monthParam, "yyyy-MM", new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  } catch {
    // Invalid format
  }
  return new Date();
}

interface MonthProviderProps {
  children: ReactNode;
  monthParam: string;
}

export function MonthProvider({ children, monthParam }: MonthProviderProps) {
  const selectedMonth = useMemo(
    () => parseMonthParam(monthParam),
    [monthParam],
  );
  const monthStr = useMemo(
    () => format(selectedMonth, "yyyy-MM"),
    [selectedMonth],
  );

  const monthPath = useCallback(
    (path: string) =>
      `/${monthStr}/${path}`.replace(/\/+/g, "/").replace(/\/$/, ""),
    [monthStr],
  );

  const value = useMemo<MonthContextValue>(
    () => ({ selectedMonth, monthStr, monthPath }),
    [selectedMonth, monthStr, monthPath],
  );

  return (
    <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
  );
}

/**
 * Hook to get the selected month from the URL path.
 * Must be used within a MonthProvider.
 */
export function useMonth(): MonthContextValue {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error("useMonth must be used within a MonthProvider");
  }
  return context;
}

/**
 * Get the current month string for redirects.
 */
export function getCurrentMonthStr(): string {
  return format(new Date(), "yyyy-MM");
}
