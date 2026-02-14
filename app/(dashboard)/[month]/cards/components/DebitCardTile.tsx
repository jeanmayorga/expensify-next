"use client";

import Image from "next/image";
import Link from "next/link";
import { CreditCard, Wallet } from "lucide-react";
import { type CardWithBank } from "../service";
import { isLightColor, DARK_TEXT_COLOR, formatCurrency } from "../utils";
import { useMonth } from "@/lib/month-context";
import { Badge } from "@/components/ui/badge";

interface DebitCardTileProps {
  card: CardWithBank;
  spentThisMonth?: number;
}

export function DebitCardTile({ card, spentThisMonth = 0 }: DebitCardTileProps) {
  const { monthStr } = useMonth();
  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

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
              Débito
            </Badge>
          </div>

          {/* Contenido principal - gastado este mes */}
          <div className="flex-1 rounded-xl bg-white/20 px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs opacity-90 mb-1">
              <Wallet className="h-4 w-4" />
              Gastado este mes
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(spentThisMonth)}
            </p>
          </div>

          {/* Banco si existe */}
          {card.bank?.name && (
            <p className="mt-3 text-xs opacity-75 truncate">
              {card.bank.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
