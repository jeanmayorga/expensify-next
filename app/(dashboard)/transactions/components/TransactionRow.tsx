"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingDown, TrendingUp, MoreHorizontal, Pencil, Trash2, Building2 } from "lucide-react";
import { type TransactionWithRelations } from "../service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TransactionRowProps {
  transaction: TransactionWithRelations;
  onEdit: (tx: TransactionWithRelations) => void;
  onDelete: (tx: TransactionWithRelations) => void;
  onClick?: (tx: TransactionWithRelations) => void;
}

// Helper to parse date without timezone issues
function parseDate(date: string | Date): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }
  return date;
}

export function TransactionRow({ transaction: tx, onEdit, onDelete, onClick }: TransactionRowProps) {
  const isExpense = tx.type === "expense";
  const date = parseDate(tx.occurred_at);

  const handleRowClick = () => {
    onClick?.(tx);
  };

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      {/* Time */}
      <div className="w-11 shrink-0 text-xs font-medium text-muted-foreground pt-0.5">
        {format(date, "HH:mm")}
      </div>

      {/* Type Icon - aligned to top */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          isExpense
            ? "bg-gradient-to-br from-red-500 to-red-600"
            : "bg-gradient-to-br from-emerald-500 to-emerald-600"
        }`}
      >
        {isExpense ? (
          <TrendingDown className="h-4 w-4 text-white" />
        ) : (
          <TrendingUp className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        {/* Bank - above description with image */}
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

        {/* Additional Badges */}
        {(tx.card || tx.category) && (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {/* Category Badge */}
            {tx.category && (
              <Badge
                variant="secondary"
                className="text-xs h-5"
                style={{
                  backgroundColor: tx.category.color ? `${tx.category.color}20` : undefined,
                  color: tx.category.color || undefined,
                }}
              >
                {tx.category.name}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Amount - centered vertically */}
      <div className="shrink-0 self-center">
        <span
          className={`text-sm font-semibold tracking-tight ${
            isExpense ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {isExpense ? "-$" : "+$"}{tx.amount.toFixed(2)}
        </span>
      </div>

      {/* Actions Dropdown */}
      <div data-slot="dropdown-menu" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(tx)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(tx)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}
