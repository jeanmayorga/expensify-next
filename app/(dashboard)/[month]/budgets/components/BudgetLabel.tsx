"use client";

import { getBudgetIconComponent } from "./BudgetIconPicker";
import { cn } from "@/lib/utils";

export interface BudgetLabelBudget {
  name: string;
  icon?: string | null;
}

type BudgetLabelProps = {
  budget: BudgetLabelBudget;
  /** Icon size class, e.g. "h-3 w-3" or "h-4 w-4" */
  iconClassName?: string;
  /** Whether to show the budget name (default true) */
  showName?: boolean;
  className?: string;
};

/**
 * Reusable component to display a budget with its icon and name.
 * Used in TransactionRow, BudgetCard, dropdowns, forms, etc.
 */
export function BudgetLabel({
  budget,
  iconClassName = "h-4 w-4",
  showName = true,
  className,
}: BudgetLabelProps) {
  const Icon = getBudgetIconComponent(budget.icon ?? null);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 shrink-0", className)}
    >
      <Icon className={cn(iconClassName)} />
      {showName && <span>{budget.name}</span>}
    </span>
  );
}
