"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { format, parse, isValid } from "date-fns";
import { MonthPicker } from "@/components/month-picker";

/**
 * Parse a month string (yyyy-MM) into a Date.
 */
function parseMonthParam(monthParam: string | undefined): Date {
  if (!monthParam) return new Date();
  try {
    const parsed = parse(monthParam, "yyyy-MM", new Date());
    if (isValid(parsed)) return parsed;
  } catch {
    // Invalid format
  }
  return new Date();
}

/**
 * Month picker that reads/writes the month from the URL path (e.g. /2026-01/transactions).
 */
export function MonthPickerNav() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const monthParam = params.month as string | undefined;
  const selectedMonth = parseMonthParam(monthParam);

  const handleMonthChange = (newMonth: Date) => {
    const newMonthStr = format(newMonth, "yyyy-MM");
    // Replace the month segment in the current path
    // Path looks like: /2026-01/transactions or /2026-01/budgets/123
    if (monthParam) {
      const newPath = pathname.replace(`/${monthParam}`, `/${newMonthStr}`);
      router.push(newPath);
    } else {
      // If no month in path (e.g., /emails), navigate to month-based home
      router.push(`/${newMonthStr}`);
    }
  };

  return <MonthPicker value={selectedMonth} onChange={handleMonthChange} />;
}
