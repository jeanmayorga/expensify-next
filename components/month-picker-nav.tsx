"use client";

import { MonthPicker } from "@/components/month-picker";
import { useMonthInUrl } from "@/lib/use-month-url";

/**
 * Month picker that syncs with the URL ?month=yyyy-MM so the selected month
 * persists across dashboard pages.
 */
export function MonthPickerNav() {
  const [selectedMonth, setSelectedMonth] = useMonthInUrl();
  return <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />;
}
