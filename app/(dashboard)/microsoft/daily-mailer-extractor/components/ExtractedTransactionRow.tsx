"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import { getEcuadorDate } from "@/utils/ecuador-time";
import {
  TrendingDown,
  TrendingUp,
  MoreVertical,
  Trash2,
  Landmark,
  CreditCard,
  PiggyBank,
  Check,
  X,
  Merge,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { BudgetLabel } from "@/app/(dashboard)/[month]/budgets/components/BudgetLabel";
import {
  MERGE_BUTTON_STYLE,
  MERGE_ROW_TINT,
} from "@/utils/transactions";
import { CARD_TYPES, CARD_KINDS } from "@/app/(dashboard)/[month]/cards/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TransactionInsert } from "@/app/api/transactions/model";
import type { ExtractedItem } from "../types";

interface Card {
  id: string;
  name: string;
  last4: string | null;
  card_kind: string | null;
  card_type: string | null;
  bank?: { name: string; image: string | null } | null;
}

interface Bank {
  id: string;
  name: string;
  image: string | null;
}

interface Budget {
  id: string;
  name: string;
  icon?: string | null;
}

interface ExtractedTransactionRowProps {
  item: ExtractedItem;
  banks: Bank[];
  cards: Card[];
  budgets: Budget[];
  onUpdate: (patch: Partial<TransactionInsert>) => void;
  onRemove: () => void;
  mergePair?: { ids: [string, string] };
  onMerge?: (ids: [string, string]) => void;
  isSaving?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

function formatCardLabel(card: Card, options?: { includeBankName?: boolean }): string {
  const kindLabel = CARD_KINDS.find((k) => k.value === card.card_kind)?.label ?? null;
  const typeLabel = CARD_TYPES.find((t) => t.value === card.card_type)?.label ?? null;
  const parts = [
    kindLabel,
    typeLabel,
    ...(options?.includeBankName && card.bank?.name ? [card.bank.name] : []),
    card.last4 ?? null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : card.name;
}

export function ExtractedTransactionRow({
  item,
  banks,
  cards,
  budgets,
  onUpdate,
  onRemove,
  mergePair,
  onMerge,
  isSaving = false,
  selected = false,
  onToggleSelect,
}: ExtractedTransactionRowProps) {
  const { data: tx } = item;
  const isExpense = tx.type === "expense";
  const date = parseISO(tx.occurred_at ?? new Date().toISOString());
  const ecuadorDate = getEcuadorDate(date);

  const bank = tx.bank_id ? banks.find((b) => b.id === tx.bank_id) : null;
  const card = tx.card_id ? cards.find((c) => c.id === tx.card_id) : null;
  const budget = tx.budget_id ? budgets.find((b) => b.id === tx.budget_id) : null;

  const handleAssign = (field: string, value: string | null) => {
    onUpdate({ [field]: value } as Partial<TransactionInsert>);
  };

  const handlePaymentMethod = (method: "card" | "transfer") => {
    onUpdate({
      payment_method: method,
      card_id: method === "transfer" ? null : tx.card_id,
    } as Partial<TransactionInsert>);
  };

  const paymentMethod =
    (tx.payment_method as "card" | "transfer") ??
    (tx.card_id ? "card" : "transfer");

  return (
    <div
      data-temp-id={item.tempId}
      className={cn(
        "group flex items-start gap-2 px-3 py-2 hover:bg-muted/30 transition-colors min-w-0 overflow-hidden",
        mergePair && MERGE_ROW_TINT,
        selected && "bg-destructive/10",
      )}
    >
      {/* Checkbox for multi-delete */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-muted-foreground",
          )}
          aria-label="Seleccionar para eliminar"
        >
          {selected && <Check className="h-3 w-3" />}
        </button>
      )}

      {/* Time */}
      <div className="w-10 shrink-0 text-xs font-medium text-muted-foreground pt-0.5">
        {format(ecuadorDate, "HH:mm")}
      </div>

      {/* Type Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
          isExpense
            ? "border-red-200 text-red-500 bg-red-200/20"
            : "border-emerald-200 text-emerald-500 bg-emerald-200/20",
        )}
      >
        {isExpense ? (
          <TrendingDown className="h-4 w-4" />
        ) : (
          <TrendingUp className="h-4 w-4" />
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5 overflow-hidden">
        {(bank || card || budget || paymentMethod === "transfer") && (
          <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0.5 text-xs text-muted-foreground min-w-0 overflow-hidden">
            {paymentMethod === "transfer" && (
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <ArrowRightLeft className="h-3 w-3" />
                Transferencia
              </span>
            )}
            {bank && (
              <span className="inline-flex items-center gap-1.5 shrink-0">
                {bank.image ? (
                  <Image
                    src={bank.image}
                    alt={bank.name}
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 rounded object-contain"
                  />
                ) : (
                  <Landmark className="h-3 w-3" />
                )}
                {bank.name}
              </span>
            )}
            {card && (
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <CreditCard className="h-3 w-3" />
                {formatCardLabel(card)}
              </span>
            )}
            {budget && (
              <BudgetLabel
                budget={budget}
                iconClassName="h-3 w-3"
                className="shrink-0"
              />
            )}
          </div>
        )}
        <p className="text-sm font-medium text-foreground truncate leading-tight min-w-0">
          {tx.description}
        </p>
      </div>

      {/* Amount + Merge + Actions */}
      <div className="shrink-0 self-center flex items-center gap-2">
        {mergePair && onMerge && (
          <Button
            variant="outline"
            size="icon"
            className={cn("h-7 w-7 shrink-0", MERGE_BUTTON_STYLE)}
            onClick={(e) => {
              e.stopPropagation();
              onMerge(mergePair.ids);
            }}
          >
            <Merge className="h-3.5 w-3.5" />
            <span className="sr-only">Fusionar</span>
          </Button>
        )}
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span
            className={cn(
              "text-sm font-semibold tracking-tight",
              isExpense ? "text-red-600" : "text-emerald-600",
            )}
          >
            {isExpense ? "-$" : "+$"}
            {tx.amount.toFixed(2)}
          </span>
        )}
      </div>

      {/* Dropdown */}
      <div className="self-center" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Payment Method */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Método de pago
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handlePaymentMethod("card")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tarjeta
                  {paymentMethod === "card" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePaymentMethod("transfer")}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transferencia
                  {paymentMethod === "transfer" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Card Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CreditCard className="mr-2 h-4 w-4" />
                Tarjeta
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => handlePaymentMethod("transfer")}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Ninguna (transferencia)
                  {paymentMethod === "transfer" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {cards.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => {
                      handleAssign("card_id", c.id);
                      handlePaymentMethod("card");
                    }}
                  >
                    {c.bank?.image ? (
                      <Image
                        src={c.bank.image}
                        alt={c.bank.name}
                        width={16}
                        height={16}
                        className="mr-2 h-4 w-4 rounded object-contain shrink-0"
                      />
                    ) : (
                      <Landmark className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    {formatCardLabel(c, { includeBankName: true })}
                    {tx.card_id === c.id && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Bank Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Landmark className="mr-2 h-4 w-4" />
                Banco
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => handleAssign("bank_id", null)}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Ninguno
                  {!tx.bank_id && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {banks.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={() => handleAssign("bank_id", b.id)}
                  >
                    {b.image ? (
                      <Image
                        src={b.image}
                        alt={b.name}
                        width={16}
                        height={16}
                        className="mr-2 h-4 w-4 rounded object-contain"
                      />
                    ) : (
                      <Landmark className="mr-2 h-4 w-4" />
                    )}
                    {b.name}
                    {tx.bank_id === b.id && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Budget Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <PiggyBank className="mr-2 h-4 w-4" />
                Presupuesto
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => handleAssign("budget_id", null)}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Ninguno
                  {!tx.budget_id && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {budgets.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={() => handleAssign("budget_id", b.id)}
                  >
                    <BudgetLabel
                      budget={b}
                      iconClassName="h-4 w-4 shrink-0"
                    />
                    {tx.budget_id === b.id && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onRemove}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar de la lista
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
