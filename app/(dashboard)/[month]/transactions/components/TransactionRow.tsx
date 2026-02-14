"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import {
  TrendingDown,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  CreditCard,
  PiggyBank,
  Check,
  X,
  StickyNote,
  Merge,
} from "lucide-react";
import { BudgetLabel } from "@/app/(dashboard)/[month]/budgets/components/BudgetLabel";
import { type TransactionWithRelations } from "../service";
import {
  type MergePairInfo,
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
interface Card {
  id: string;
  name: string;
  last4: string | null;
  color: string | null;
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

interface TransactionRowProps {
  transaction: TransactionWithRelations;
  cards?: Card[];
  banks?: Bank[];
  budgets?: Budget[];
  onUpdate?: (id: number, data: Record<string, string | null>) => void;
  onEdit?: (tx: TransactionWithRelations) => void;
  onDelete?: (tx: TransactionWithRelations) => void;
  onClick?: (tx: TransactionWithRelations) => void;
  /** When true, row is highlighted (e.g. from search deep link) */
  highlighted?: boolean;
  /** When present, shows Fusionar button for expense-reimbursement pair */
  mergePair?: MergePairInfo;
  /** Called when user clicks Fusionar (removes both transactions) */
  onMerge?: (ids: [number, number]) => void;
}

function parseDate(date: string | Date): Date {
  if (typeof date === "string") {
    // Parse as UTC then convert to Ecuador timezone for display
    const utcDate = parseISO(date);
    return getEcuadorDate(utcDate);
  }
  return getEcuadorDate(date);
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

export function TransactionRow({
  transaction: tx,
  cards = [],
  banks = [],
  budgets = [],
  onUpdate,
  onEdit,
  onDelete,
  onClick,
  highlighted = false,
  mergePair,
  onMerge,
}: TransactionRowProps) {
  const isExpense = tx.type === "expense";
  const date = parseDate(tx.occurred_at);

  const handleRowClick = () => {
    onClick?.(tx);
  };

  const handleAssign = (field: string, value: string | null) => {
    onUpdate?.(tx.id, { [field]: value });
  };

  return (
    <div
      data-transaction-id={tx.id}
      className={cn(
        "group flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-w-0 overflow-hidden",
        onClick && "cursor-pointer",
        highlighted && "bg-primary/15 ring-1 ring-primary/30 ring-inset",
        mergePair && MERGE_ROW_TINT,
      )}
      onClick={onClick ? handleRowClick : undefined}
    >
      {/* Time */}
      <div className="w-11 shrink-0 text-xs font-medium text-muted-foreground pt-0.5">
        {format(date, "HH:mm")}
      </div>

      {/* Type Icon - outline style with subtle bg */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
          isExpense
            ? "border-red-200 text-red-500 bg-red-200/20"
            : "border-emerald-200 text-emerald-500 bg-emerald-200/20"
        }`}
      >
        {isExpense ? (
          <TrendingDown className="h-4 w-4" />
        ) : (
          <TrendingUp className="h-4 w-4" />
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5 overflow-hidden">
        {/* Línea referentes: Banco – Tarjeta – Presupuesto */}
        {(tx.bank || tx.card || tx.budget) && (
          <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0.5 text-xs text-muted-foreground min-w-0 overflow-hidden">
            {tx.bank && (
              <span className="inline-flex items-center gap-1.5 shrink-0">
                {tx.bank.image ? (
                  <Image
                    src={tx.bank.image}
                    alt={tx.bank.name}
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 rounded object-contain"
                  />
                ) : (
                  <Building2 className="h-3 w-3" />
                )}
                {tx.bank.name}
              </span>
            )}
            {tx.card && (
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <CreditCard className="h-3 w-3" />
                {formatCardLabel(tx.card)}
              </span>
            )}
            {tx.budget && (
              <BudgetLabel
                budget={tx.budget}
                iconClassName="h-3 w-3"
                className="shrink-0"
              />
            )}
          </div>
        )}

        {/* Descripción */}
        <p className="text-sm font-medium text-foreground truncate leading-tight min-w-0">
          {tx.description}
        </p>
      </div>

      {/* Amount + Fusionar */}
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
        <span
          className={`text-sm font-semibold tracking-tight ${
            isExpense ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {isExpense ? "-$" : "+$"}
          {tx.amount.toFixed(2)}
        </span>
      </div>

      {/* Actions Dropdown - show when has actions or has notes */}
      {(onUpdate || onEdit || onDelete || tx.comment?.trim()) && (
        <div
          data-slot="dropdown-menu"
          className="self-center"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onUpdate && (
              <>
              {/* Card Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tarjeta
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => handleAssign("card_id", null)}
                    className="text-muted-foreground"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Ninguna
                    {!tx.card_id && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {cards.map((card) => (
                    <DropdownMenuItem
                      key={card.id}
                      onClick={() => handleAssign("card_id", card.id)}
                    >
                      {card.bank?.image ? (
                        <Image
                          src={card.bank.image}
                          alt={card.bank.name}
                          width={16}
                          height={16}
                          className="mr-2 h-4 w-4 rounded object-contain shrink-0"
                        />
                      ) : (
                        <Building2 className="mr-2 h-4 w-4 shrink-0" />
                      )}
                      {formatCardLabel(card, { includeBankName: true })}
                      {tx.card_id === card.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Bank Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building2 className="mr-2 h-4 w-4" />
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
                  {banks.map((bank) => (
                    <DropdownMenuItem
                      key={bank.id}
                      onClick={() => handleAssign("bank_id", bank.id)}
                    >
                      {bank.image ? (
                        <Image
                          src={bank.image}
                          alt={bank.name}
                          width={16}
                          height={16}
                          className="mr-2 h-4 w-4 rounded object-contain"
                        />
                      ) : (
                        <Building2 className="mr-2 h-4 w-4" />
                      )}
                      {bank.name}
                      {tx.bank_id === bank.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
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
                  {budgets.map((budget) => (
                    <DropdownMenuItem
                      key={budget.id}
                      onClick={() => handleAssign("budget_id", budget.id)}
                    >
                      <BudgetLabel
                        budget={budget}
                        iconClassName="h-4 w-4 shrink-0"
                      />
                      {tx.budget_id === budget.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              </>
              )}

              {/* Notas */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  disabled={!tx.comment?.trim()}
                  className={!tx.comment?.trim() ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <StickyNote className="mr-2 h-4 w-4" />
                  Notas
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="w-72 max-w-[min(90vw,320px)] p-4"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Notas
                  </p>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {tx.comment?.trim() || "Sin notas"}
                  </p>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {(onEdit || onDelete) && (
                <>
                  <DropdownMenuSeparator />
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(tx)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(tx)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
