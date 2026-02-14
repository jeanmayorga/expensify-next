"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Calendar, Wallet } from "lucide-react";
import { type CardWithBank } from "../service";
import { isLightColor, DARK_TEXT_COLOR, formatCurrency } from "../utils";
import { useMonth } from "@/lib/month-context";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getCurrentBillingCycleRange,
} from "../utils/billing-cycle";

interface CreditCardTileProps {
  card: CardWithBank;
  spentThisMonth?: number;
}

export function CreditCardTile({ card, spentThisMonth = 0 }: CreditCardTileProps) {
  const { monthStr } = useMonth();
  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

  const creditLimit = card.credit_limit ?? 0;
  const outstanding = card.outstanding_balance ?? 0;
  const usagePct =
    creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : 0;
  const available = creditLimit - outstanding;
  const isOverLimit = outstanding >= creditLimit;

  const cutStart = card.cut_start_day ?? 16;
  const cutEnd = card.cut_end_day ?? 13;
  const paymentDueDay = card.payment_due_day;
  const { from, to, paymentDue } = getCurrentBillingCycleRange(
    cutStart,
    cutEnd,
    new Date(),
    paymentDueDay
  );

  const barGradient =
    isOverLimit
      ? "from-red-500 to-red-600"
      : usagePct >= 80
        ? "from-amber-500 to-amber-600"
        : "from-emerald-500 to-emerald-600";

  return (
    <Link
      href={`/${monthStr}/cards/${card.id}`}
      className="group block w-full min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl overflow-hidden"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-2 hover:ring-white/30 active:scale-[0.99] w-full"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 50%, ${cardColor}aa 100%)`,
          color: useDarkText ? DARK_TEXT_COLOR : "white",
        }}
      >
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />
        <div
          className="absolute -right-2 top-12 w-16 h-16 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />

        <div className="relative flex flex-col min-h-[180px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {card.bank?.image ? (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden bg-white/20 shrink-0">
                  <Image
                    src={card.bank.image}
                    alt={card.bank.name ?? ""}
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                  <CreditCard className="h-5 w-5 opacity-90" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight truncate">
                  {card.name}
                </h3>
                {card.last4 && (
                  <p className="text-sm font-mono opacity-80">•••• {card.last4}</p>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-white/25 text-inherit border-0 shrink-0 text-xs"
            >
              Crédito
            </Badge>
          </div>

          {/* Barra de uso del cupo (cuando hay cupo configurado) */}
          {creditLimit > 0 ? (
            <div className="flex-1 space-y-2 rounded-xl bg-white/20 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-90 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  Cupo utilizado
                </span>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    useDarkText
                      ? isOverLimit
                        ? "text-red-700"
                        : usagePct >= 80
                          ? "text-amber-700"
                          : "text-emerald-700"
                      : isOverLimit
                        ? "text-red-200"
                        : usagePct >= 80
                          ? "text-amber-200"
                          : "text-emerald-200",
                  )}
                >
                  {usagePct.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={usagePct}
                className="h-2.5"
                indicatorClassName={cn("bg-gradient-to-r", barGradient)}
              />
              <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                <span className="opacity-80 tabular-nums truncate">
                  {formatCurrency(outstanding)} / {formatCurrency(creditLimit)}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums shrink-0",
                    useDarkText
                      ? isOverLimit
                        ? "text-red-700"
                        : "text-emerald-700"
                      : isOverLimit
                        ? "text-red-200"
                        : "text-emerald-200",
                  )}
                >
                  {isOverLimit ? "Excedido" : "Disponible"}:{" "}
                  {formatCurrency(Math.abs(available))}
                </span>
              </div>
            </div>
          ) : outstanding > 0 ? (
            /* Deuda sin cupo configurado - mostrar saldo utilizado */
            <div className="flex-1 rounded-xl bg-white/20 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-90 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  Saldo utilizado
                </span>
                <span className="font-bold tabular-nums">
                  {formatCurrency(outstanding)}
                </span>
              </div>
              <p className="text-[10px] opacity-75 mt-1">
                Sin cupo configurado
              </p>
            </div>
          ) : null}

          {/* Ciclo y pago */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-90">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(from, "d MMM", { locale: es })} – {format(to, "d MMM yyyy", { locale: es })}
            </span>
            {paymentDue && (
              <span
                className={cn(
                  "font-medium",
                  useDarkText ? "text-amber-800" : "text-amber-200"
                )}
              >
                Pago máx: {format(paymentDue, "d MMM", { locale: es })}
              </span>
            )}
          </div>

          {/* Gastado este mes */}
          <div className="mt-2 pt-2 border-t border-white/20">
            <span className="text-xs opacity-80">Gastado este mes</span>
            <span className="block text-base font-bold tabular-nums">
              {formatCurrency(spentThisMonth)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
