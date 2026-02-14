"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getBillingCycleByOffset,
  type BillingCycleOption,
} from "../utils/billing-cycle";
import { formatCurrency } from "../utils";
import type { CardWithBank } from "../service";
import type { TransactionWithRelations } from "../../transactions/service";

interface CardStatsProps {
  card: CardWithBank;
  cycleTransactions: TransactionWithRelations[];
  month: string;
  cycleOffset: number;
  onCycleOffsetChange: (offset: number) => void;
  cycleOptions: BillingCycleOption[];
}

export function CardStats({
  card,
  cycleTransactions,
  month,
  cycleOffset,
  onCycleOffsetChange,
  cycleOptions,
}: CardStatsProps) {
  const cutStart = card.cut_start_day ?? 16;
  const cutEnd = card.cut_end_day ?? 13;
  const paymentDueDay = card.payment_due_day;
  const creditLimit = card.credit_limit ?? 0;
  const outstanding = card.outstanding_balance ?? 0;

  const { from, to, fromStr, toStr } = useMemo(
    () =>
      getBillingCycleByOffset(cutStart, cutEnd, new Date(), cycleOffset),
    [cutStart, cutEnd, cycleOffset]
  );

  const paymentDue = useMemo(() => {
    if (paymentDueDay == null || paymentDueDay < 1 || paymentDueDay > 31)
      return null;
    const d = new Date(to);
    d.setDate(paymentDueDay);
    return d;
  }, [to, paymentDueDay]);

  const spentThisCycle = useMemo(() => {
    return cycleTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [cycleTransactions]);

  const available = creditLimit - outstanding;
  const usagePct =
    creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : 0;
  const isOverLimit = outstanding >= creditLimit;

  const barGradient =
    isOverLimit
      ? "from-red-500 to-red-600"
      : usagePct >= 80
        ? "from-amber-500 to-amber-600"
        : "from-emerald-500 to-emerald-600";

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      {/* Selector de período */}
      <div className="px-5 py-4 bg-muted/30 border-b space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Período
          </p>
          <Select
            value={String(cycleOffset)}
            onValueChange={(v) => onCycleOffsetChange(parseInt(v, 10))}
          >
            <SelectTrigger className="w-full max-w-[280px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {cycleOptions.map((opt) => (
                <SelectItem key={opt.offset} value={String(opt.offset)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold">
            {format(from, "d 'de' MMMM", { locale: es })}{" "}
            <span className="text-muted-foreground font-normal">–</span>{" "}
            {format(to, "d 'de' MMMM yyyy", { locale: es })}
          </p>
          <Button variant="link" size="sm" className="h-auto p-0 text-primary shrink-0" asChild>
            <Link
              href={`/${month}/transactions?card_id=${card.id}&date_from=${fromStr}&date_to=${toStr}`}
            >
              Ver transacciones
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              Gastado este ciclo
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(spentThisCycle)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              Disponible
            </p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                available < 0 ? "text-destructive" : "text-emerald-600"
              )}
            >
              {formatCurrency(Math.abs(available))}
              {available < 0 && (
                <span className="text-sm font-normal ml-1">excedido</span>
              )}
            </p>
          </div>
          {cycleOffset === 0 && paymentDue && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Fecha máxima de pago
              </p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-500">
                {format(paymentDue, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(outstanding)} / {formatCurrency(creditLimit)}
            </span>
            <span
              className={cn(
                "font-bold",
                isOverLimit ? "text-destructive" : "text-emerald-600"
              )}
            >
              {usagePct.toFixed(0)}% utilizado
            </span>
          </div>
          <Progress
            value={usagePct}
            className="h-3"
            indicatorClassName={cn("bg-gradient-to-r", barGradient)}
          />
        </div>
      </div>
    </div>
  );
}
