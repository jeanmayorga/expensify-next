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
  Wallet,
  Check,
  X,
} from "lucide-react";
import { type TransactionWithRelations } from "../service";
import { Badge } from "@/components/ui/badge";
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
}

interface Bank {
  id: string;
  name: string;
  image: string | null;
}

interface Budget {
  id: string;
  name: string;
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
}

function parseDate(date: string | Date): Date {
  if (typeof date === "string") {
    // Parse as UTC then convert to Ecuador timezone for display
    const utcDate = parseISO(date);
    return getEcuadorDate(utcDate);
  }
  return getEcuadorDate(date);
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
      className={`group flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${onClick ? "cursor-pointer" : ""}`}
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
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        {/* Bank */}
        {tx.bank && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
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

        {/* Description */}
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {tx.description}
        </p>

        {/* Badges */}
        {(tx.card || tx.budget) && (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {tx.card && (
              <Badge
                variant="outline"
                className="text-xs h-5 gap-1"
                style={{
                  borderColor: tx.card.color ? `${tx.card.color}60` : undefined,
                  backgroundColor: tx.card.color
                    ? `${tx.card.color}15`
                    : undefined,
                }}
              >
                <CreditCard className="h-3 w-3" />
                {[
                  tx.card.card_kind === "debit"
                    ? "Debit"
                    : tx.card.card_kind === "credit"
                      ? "Credit"
                      : null,
                  tx.card.last4 || tx.card.name,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </Badge>
            )}
            {tx.budget && (
              <Badge
                variant="outline"
                className="text-xs h-5 gap-1 border-emerald-400 bg-emerald-50 text-emerald-700"
              >
                <Wallet className="h-3 w-3" />
                {tx.budget.name}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="shrink-0 self-center">
        <span
          className={`text-sm font-semibold tracking-tight ${
            isExpense ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {isExpense ? "-$" : "+$"}
          {tx.amount.toFixed(2)}
        </span>
      </div>

      {/* Actions Dropdown - only show if there are any action handlers */}
      {(onUpdate || onEdit || onDelete) && (
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
                      <CreditCard
                        className="mr-2 h-4 w-4"
                        style={{ color: card.color || undefined }}
                      />
                      {card.name}
                      {card.last4 && (
                        <span className="text-muted-foreground ml-1">
                          •{card.last4}
                        </span>
                      )}
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
                  <Wallet className="mr-2 h-4 w-4" />
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
                      <Wallet className="mr-2 h-4 w-4" />
                      {budget.name}
                      {tx.budget_id === budget.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Edit */}
              <DropdownMenuItem onClick={() => onEdit?.(tx)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>

              {/* Delete */}
              <DropdownMenuItem
                onClick={() => onDelete?.(tx)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
