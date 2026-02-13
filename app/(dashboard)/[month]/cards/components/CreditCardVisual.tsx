"use client";

import Image from "next/image";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { type CardWithBank } from "../service";
import { isLightColor, DARK_TEXT_COLOR } from "../utils";
import { useMonth } from "@/lib/month-context";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

interface CreditCardVisualProps {
  card: CardWithBank;
  spentThisMonth?: number;
}

export function CreditCardVisual({ card, spentThisMonth = 0 }: CreditCardVisualProps) {
  const { monthStr } = useMonth();
  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

  const creditLimit = card.credit_limit ?? 0;
  const outstanding = card.outstanding_balance ?? 0;
  const usagePct =
    creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : 0;
  const showUsageBar =
    card.card_kind === "credit" && creditLimit > 0;
  const remaining = creditLimit - outstanding;
  const isOverLimit = outstanding >= creditLimit;

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

        <div className="relative flex flex-col min-h-[140px]">
          <div className="flex items-center gap-2 mb-3 min-w-0">
            {card.bank?.image ? (
              <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden bg-white/20 shrink-0">
                <Image
                  src={card.bank.image}
                  alt={card.bank.name}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 shrink-0">
                <CreditCard className="h-5 w-5 opacity-90" />
              </div>
            )}
            <h3 className="text-lg font-bold tracking-tight truncate min-w-0 flex-1">
              {card.name}
              {card.last4 && (
                <span className="ml-1.5 font-mono text-sm font-medium opacity-80">
                  •••• {card.last4}
                </span>
              )}
            </h3>
          </div>

          {!showUsageBar && (
            <div className="mt-auto rounded-xl bg-white/20 px-3 py-2.5 inline-block backdrop-blur-sm">
              <span className="text-xs opacity-90">Gastado este mes</span>
              <span className="block text-lg font-bold tabular-nums">
                {fmt(spentThisMonth)}
              </span>
            </div>
          )}

          {showUsageBar && (
            <div className="mt-auto rounded-xl bg-white/20 px-3 py-2.5 backdrop-blur-sm space-y-2.5 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                <span className="opacity-90">Gastado este mes</span>
                <span className="font-bold tabular-nums">{fmt(spentThisMonth)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5 min-w-0">
                <span className="opacity-90 tabular-nums min-w-0 truncate">
                  {fmt(outstanding)} / {fmt(creditLimit)}
                </span>
                <span
                  className={cn(
                    "font-bold tabular-nums shrink-0",
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
                className="h-2"
                indicatorClassName={cn("bg-gradient-to-r", barGradient)}
              />
              <div className="flex justify-between gap-2 mt-1.5 text-[10px] min-w-0">
                <span className="opacity-80">
                  {isOverLimit ? "Excedido" : "Disponible"}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    useDarkText
                      ? isOverLimit
                        ? "text-red-700"
                        : "text-emerald-700"
                      : isOverLimit
                        ? "text-red-200"
                        : "text-emerald-200",
                  )}
                >
                  {isOverLimit && "-"}
                  {fmt(Math.abs(remaining))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
