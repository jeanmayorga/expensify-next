"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Budget } from "../service";

export function formatBudgetCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type BudgetCardData = {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
};

const cardBaseClass =
  "relative block p-4 rounded-xl border bg-card text-card-foreground hover:shadow-md transition-all overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

type BudgetCardProps = {
  data: BudgetCardData;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function BudgetCard({ data, href, onClick, className }: BudgetCardProps) {
  const { budget, spent, remaining, percentage, isOverBudget } = data;
  const statusBg = isOverBudget
    ? "from-red-500 to-red-600"
    : percentage > 80
      ? "from-orange-500 to-orange-600"
      : "from-emerald-500 to-emerald-600";
  const statusBox =
    isOverBudget
      ? "bg-red-100 dark:bg-red-900/30"
      : percentage > 80
        ? "bg-orange-100 dark:bg-orange-900/30"
        : "bg-emerald-100 dark:bg-emerald-900/30";
  const statusIcon =
    isOverBudget
      ? "text-red-600"
      : percentage > 80
        ? "text-orange-600"
        : "text-emerald-600";
  const statusBadge =
    isOverBudget
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      : percentage > 80
        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

  const content = (
    <>
      <div
        className={cn("absolute top-0 left-0 w-1 h-full bg-gradient-to-b rounded-l-xl", statusBg)}
      />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
              statusBox,
            )}
          >
            <Wallet className={cn("h-4 w-4", statusIcon)} />
          </div>
          <div>
            <p className="font-semibold text-sm">{budget.name}</p>
            <p className="text-xs text-muted-foreground">{budget.currency}</p>
          </div>
        </div>
        <Badge variant="secondary" className={cn("text-xs shrink-0", statusBadge)}>
          {percentage.toFixed(0)}%
        </Badge>
      </div>
      <div className="mb-3">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-2xl font-bold">
            {formatBudgetCurrency(spent, budget.currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {formatBudgetCurrency(budget.amount, budget.currency)}
          </span>
        </div>
      </div>
      <div className="mb-2">
        <Progress
          value={Math.min(percentage, 100)}
          className="h-2.5"
          indicatorClassName={cn("bg-gradient-to-r", statusBg)}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {isOverBudget ? "Excedido por" : "Disponible"}
        </span>
        <span
          className={cn(
            "font-semibold",
            isOverBudget ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {isOverBudget && "-"}
          {formatBudgetCurrency(Math.abs(remaining), budget.currency)}
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardBaseClass, className)}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cardBaseClass, "text-left w-full", className)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn(cardBaseClass, className)}>{content}</div>;
}

export function BudgetCardSkeleton() {
  return (
    <div className={cardBaseClass}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <Skeleton className="h-5 w-10 rounded" />
      </div>
      <div className="mb-3">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="mb-2">
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}
