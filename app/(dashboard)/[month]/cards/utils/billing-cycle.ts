import { format, addMonths, subMonths, setDate, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Get a billing cycle by offset from current.
 * offset 0 = current cycle, -1 = previous, -2 = two ago, +1 = next, etc.
 */
export function getBillingCycleByOffset(
  cutStartDay: number,
  cutEndDay: number,
  referenceDate: Date,
  offset: number
): { from: Date; to: Date; fromStr: string; toStr: string } {
  const current = getCurrentBillingCycleRange(cutStartDay, cutEndDay, referenceDate);
  if (offset === 0) {
    return { from: current.from, to: current.to, fromStr: current.fromStr, toStr: current.toStr };
  }

  const refForOffset = addMonths(referenceDate, offset);
  const day = refForOffset.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= cutStartDay) {
    cycleStart = startOfDay(setDate(refForOffset, cutStartDay));
    cycleEnd = endOfDay(setDate(addMonths(refForOffset, 1), cutEndDay));
  } else {
    cycleStart = startOfDay(setDate(subMonths(refForOffset, 1), cutStartDay));
    cycleEnd = endOfDay(setDate(refForOffset, cutEndDay));
  }

  return {
    from: cycleStart,
    to: cycleEnd,
    fromStr: format(cycleStart, "yyyy-MM-dd"),
    toStr: format(cycleEnd, "yyyy-MM-dd"),
  };
}

export interface BillingCycleOption {
  offset: number;
  label: string;
  fromStr: string;
  toStr: string;
}

/**
 * Get options for period select (current + past periods).
 */
export function getBillingCycleOptions(
  cutStartDay: number,
  cutEndDay: number,
  count: number = 6
): BillingCycleOption[] {
  const ref = new Date();
  const options: BillingCycleOption[] = [];

  for (let offset = 0; offset >= -count + 1; offset--) {
    const { from, to, fromStr, toStr } = getBillingCycleByOffset(
      cutStartDay,
      cutEndDay,
      ref,
      offset
    );
    const label =
      offset === 0
        ? `Actual: ${format(from, "d MMM", { locale: es })} – ${format(to, "d MMM yyyy", { locale: es })}`
        : `${format(from, "d MMM", { locale: es })} – ${format(to, "d MMM yyyy", { locale: es })}`;
    options.push({ offset, label, fromStr, toStr });
  }

  return options;
}

/**
 * Get the current billing cycle date range and payment due date.
 * cut_start_day: day of month when cycle starts (e.g. 16)
 * cut_end_day: day of next month when cycle ends (e.g. 13)
 * payment_due_day: day of month when payment is due (same month as cycle end, e.g. 28)
 * Example: cut_start=16, cut_end=13, payment_due=28 -> cycle Jan 16 - Feb 13, pay by Feb 28
 */
export function getCurrentBillingCycleRange(
  cutStartDay: number,
  cutEndDay: number,
  referenceDate: Date = new Date(),
  paymentDueDay?: number | null
): {
  from: Date;
  to: Date;
  paymentDue: Date | null;
  fromStr: string;
  toStr: string;
} {
  const day = referenceDate.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= cutStartDay) {
    cycleStart = startOfDay(setDate(referenceDate, cutStartDay));
    cycleEnd = endOfDay(setDate(addMonths(referenceDate, 1), cutEndDay));
  } else {
    cycleStart = startOfDay(setDate(subMonths(referenceDate, 1), cutStartDay));
    cycleEnd = endOfDay(setDate(referenceDate, cutEndDay));
  }

  // Payment due is in the same month as cycle end
  const paymentDue =
    paymentDueDay != null && paymentDueDay >= 1 && paymentDueDay <= 31
      ? setDate(new Date(cycleEnd), paymentDueDay)
      : null;

  return {
    from: cycleStart,
    to: cycleEnd,
    paymentDue,
    fromStr: format(cycleStart, "yyyy-MM-dd"),
    toStr: format(cycleEnd, "yyyy-MM-dd"),
  };
}
