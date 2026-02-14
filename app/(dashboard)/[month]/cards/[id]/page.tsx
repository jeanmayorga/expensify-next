"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { groupTransactionsByDate } from "@/utils/transactions";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  Edit,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { useCard } from "../hooks";
import {
  useTransactions,
  useUpdateTransaction,
} from "../../transactions/hooks";
import { useCards } from "../hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../../budgets/hooks";
import { type TransactionWithRelations } from "../../transactions/service";
import { useMonth } from "@/lib/month-context";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card as CardUI, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  isLightColor,
  formatCurrency,
  DARK_TEXT_COLOR,
} from "../utils";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  EditTransactionSheet,
  DeleteTransactionDialog,
} from "../../transactions/components";

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const month = params.month as string;
  const cardId = params.id as string;
  const { budgetId } = useAuth();
  const canEdit = useCanEdit();
  const cardsListPath = `/${month}/cards`;

  const { selectedMonth } = useMonth();

  // Fetch card details
  const { data: card, isLoading: loadingCard } = useCard(cardId);

  // Fetch transactions for this card and month (scoped by budget when key profile)
  const filters = useMemo(
    () => ({
      date: format(selectedMonth, "yyyy-MM"),
      card_id: cardId,
      ...(budgetId ? { budget_id: budgetId } : {}),
    }),
    [selectedMonth, cardId, budgetId],
  );
  const {
    data: transactions = [],
    isLoading: loadingTx,
    refetch,
    isRefetching,
  } = useTransactions(filters);

  // Related data for transaction rows
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const updateTransaction = useUpdateTransaction();

  const loading =
    loadingCard ||
    loadingTx ||
    loadingCards ||
    loadingBanks ||
    loadingBudgets;

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions],
  );

  // Sheet states
  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(
    null,
  );
  const [deletingTx, setDeletingTx] = useState<TransactionWithRelations | null>(
    null,
  );

  const handleRowClick = (tx: TransactionWithRelations) => {
    setEditingTx(tx);
  };

  const handleQuickUpdate = async (
    id: number,
    data: Record<string, string | null>,
  ) => {
    await updateTransaction.mutateAsync({ id, data });
  };

  // Summary calculations
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncomes = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncomes - totalExpenses;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const incomeCount = transactions.filter((t) => t.type === "income").length;

  // Loading skeleton
  if (loadingCard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(cardsListPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a tarjetas
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Tarjeta no encontrada
        </div>
      </div>
    );
  }

  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push(cardsListPath)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{
              background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
              color: useDarkText ? DARK_TEXT_COLOR : "white",
            }}
          >
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
              {card.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Transacciones de esta tarjeta
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("edit")}
            >
              <Edit className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Expenses Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <TrendingDown className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Gastos</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {expenseCount} transacción{expenseCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <TrendingUp className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Ingresos</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {formatCurrency(totalIncomes)}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {incomeCount} transacción{incomeCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${
            balance >= 0
              ? "bg-gradient-to-br from-blue-500 to-blue-600"
              : "bg-gradient-to-br from-orange-500 to-orange-600"
          }`}
        >
          <div className="absolute top-3 right-3 opacity-20">
            <Wallet className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Balance</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {balance >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(balance))}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {transactions.length} transacción
              {transactions.length !== 1 ? "es" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List — mismo estilo que /transactions */}
      <CardUI className="overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {loadingTx ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No hay transacciones"
              description="No hay transacciones en esta tarjeta para el mes seleccionado."
            />
          ) : (
            <div>
              {groupedTransactions.map(([dateKey, txs], groupIndex) => {
                const dayTotal = txs
                  .filter((tx) => tx.type === "expense")
                  .reduce((s, tx) => s + tx.amount, 0);
                const fmt = (n: number) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  }).format(n);
                return (
                  <div key={dateKey}>
                    <div
                      className={cn(
                        "sticky top-0 z-10 bg-muted/60 backdrop-blur-sm px-4 py-2 border-b flex items-center justify-between",
                        groupIndex > 0 && "border-t",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {format(
                            parseISO(dateKey),
                            "EEEE, d 'de' MMMM",
                            { locale: es },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 font-normal"
                        >
                          {txs.length} tx
                        </Badge>
                        {dayTotal > 0 && (
                          <span className="text-xs font-medium text-muted-foreground tabular-nums">
                            -{fmt(dayTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y">
                      {txs.map((tx) => (
                        <TransactionRow
                          key={tx.id}
                          transaction={tx}
                          cards={cards}
                          banks={banks}
                          budgets={budgets}
                          onUpdate={canEdit ? handleQuickUpdate : undefined}
                          onEdit={canEdit ? setEditingTx : undefined}
                          onDelete={canEdit ? setDeletingTx : undefined}
                          onClick={canEdit ? handleRowClick : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </CardUI>

      {/* Edit/Delete - only in edit mode */}
      {canEdit && (
        <>
          <EditTransactionSheet
            transaction={editingTx}
            onClose={() => setEditingTx(null)}
            onDelete={(tx) => {
              setEditingTx(null);
              setDeletingTx(tx);
            }}
            cards={cards}
            banks={banks}
            budgets={budgets}
          />

          <DeleteTransactionDialog
            transaction={deletingTx}
            onClose={() => setDeletingTx(null)}
          />
        </>
      )}
    </div>
  );
}
