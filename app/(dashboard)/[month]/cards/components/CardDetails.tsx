"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  CreditCard,
  User,
  Calendar,
  Wallet,
  CalendarClock,
  ArrowLeft,
  Edit,
  Receipt,
} from "lucide-react";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import { CARD_TYPES, CARD_KINDS, formatCurrency, isLightColor } from "../utils";
import type { CardWithBank } from "../service";
import { Button } from "@/components/ui/button";

interface CardDetailsProps {
  card: CardWithBank;
  /** Ruta para volver a la lista de tarjetas */
  cardsListPath?: string;
  /** Mes actual (yyyy-MM) para el link de transacciones */
  month?: string;
  /** Si el usuario puede editar */
  canEdit?: boolean;
  /** Callback al hacer clic en Editar */
  onEditClick?: () => void;
}

export function CardDetails({
  card,
  cardsListPath,
  month,
  canEdit,
  onEditClick,
}: CardDetailsProps) {
  const router = useRouter();
  const bankName = card.bank?.name;
  const bankImage = card.bank?.image;
  const cardTypeLabel =
    CARD_TYPES.find((t) => t.value === card.card_type)?.label ?? card.card_type;
  const cardKindLabel =
    CARD_KINDS.find((k) => k.value === card.card_kind)?.label ?? card.card_kind;
  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

  const hasAnyDetails =
    bankName ||
    cardTypeLabel ||
    cardKindLabel ||
    card.last4 ||
    card.cardholder_name ||
    card.expiration_date ||
    card.color ||
    (card.card_kind === "credit" &&
      (card.outstanding_balance != null ||
        card.credit_limit != null ||
        card.cut_start_day != null ||
        card.cut_end_day != null ||
        card.payment_due_day != null));

  if (!hasAnyDetails) return null;

  return (
    <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
      {/* Header con color de la tarjeta */}
      <div
        className="px-5 py-4"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
          color: useDarkText ? "#0f265c" : "white",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {cardsListPath && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 text-inherit hover:bg-white/20"
                onClick={() => router.push(cardsListPath)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {bankImage ? (
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/20 overflow-hidden shrink-0">
                <Image
                  src={bankImage}
                  alt={bankName ?? ""}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                <Landmark className="h-6 w-6 opacity-90" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{card.name}</h3>
              <p className="text-sm opacity-90">
                {cardTypeLabel && cardKindLabel
                  ? `${cardTypeLabel} ${cardKindLabel}`
                  : cardTypeLabel || cardKindLabel || "Tarjeta"}
                {card.last4 && (
                  <span className="ml-1.5 font-mono opacity-80">
                    •••• {card.last4}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {month && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-inherit border-0"
                asChild
              >
                <Link
                  href={`/${month}/transactions?card_id=${card.id}&date_from=${format(startOfMonth(parse(month, "yyyy-MM", new Date())), "yyyy-MM-dd")}&date_to=${format(endOfMonth(parse(month, "yyyy-MM", new Date())), "yyyy-MM-dd")}`}
                >
                  <Receipt className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Ver transacciones de este mes</span>
                </Link>
              </Button>
            )}
            {canEdit && onEditClick && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-inherit border-0"
                onClick={onEditClick}
              >
                <Edit className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-6">
        {/* Información general */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Información
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {(bankName || bankImage) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {bankImage ? (
                  <Image
                    src={bankImage}
                    alt={bankName ?? ""}
                    width={24}
                    height={24}
                    className="rounded object-contain"
                  />
                ) : (
                  <Landmark className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="font-medium">{bankName}</p>
                </div>
              </div>
            )}
            {card.cardholder_name && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Titular</p>
                  <p className="font-medium uppercase tracking-wide">
                    {card.cardholder_name}
                  </p>
                </div>
              </div>
            )}
            {card.expiration_date && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="font-medium font-mono">
                    {card.expiration_date}
                  </p>
                </div>
              </div>
            )}
            {card.color && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div
                  className="h-5 w-5 rounded border border-border shrink-0"
                  style={{ backgroundColor: card.color }}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Color</p>
                  <p className="font-medium font-mono text-sm">
                    {card.color}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Datos de crédito */}
        {card.card_kind === "credit" &&
          (card.outstanding_balance != null ||
            card.credit_limit != null ||
            card.cut_start_day != null ||
            card.cut_end_day != null ||
            card.payment_due_day != null) && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Crédito
            </h4>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {card.outstanding_balance != null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Saldo utilizado
                    </p>
                    <p className="font-bold text-lg tabular-nums">
                      {formatCurrency(card.outstanding_balance)}
                    </p>
                  </div>
                </div>
              )}
              {card.credit_limit != null && card.credit_limit > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Cupo máximo
                    </p>
                    <p className="font-bold text-lg tabular-nums">
                      {formatCurrency(card.credit_limit)}
                    </p>
                  </div>
                </div>
              )}
              {(card.cut_start_day != null || card.cut_end_day != null) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ciclo de corte
                    </p>
                    <p className="font-medium">
                      {card.cut_start_day != null && card.cut_end_day != null
                        ? `Día ${card.cut_start_day} al ${card.cut_end_day}`
                        : card.cut_start_day != null
                          ? `Inicio: día ${card.cut_start_day}`
                          : `Fin: día ${card.cut_end_day}`}
                    </p>
                    {card.cut_start_day != null && card.cut_end_day != null && (
                      <span className="text-muted-foreground text-xs block mt-0.5">
                        (fin del mes siguiente)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {card.payment_due_day != null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      Pago máximo
                    </p>
                    <p className="font-bold text-amber-700 dark:text-amber-400">
                      Día {card.payment_due_day}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
