"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useCard } from "../hooks";
import {
  useTransactions,
  useUpdateTransaction,
} from "../../transactions/hooks";
import { useCategories } from "../../categories/hooks";
import { useCards } from "../hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../../budgets/hooks";
import { type TransactionWithRelations } from "../../transactions/service";
import { useMonthInUrl } from "@/lib/use-month-url";
import { Button } from "@/components/ui/button";
import { Card as CardUI, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isLightColor,
  formatCurrency,
  CARD_TYPES,
  CARD_KINDS,
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
  const cardId = params.id as string;

  const [selectedMonth] = useMonthInUrl();

  // Fetch card details
  const { data: card, isLoading: loadingCard } = useCard(cardId);

  // Fetch transactions for this card and month
  const filters = {
    date: format(selectedMonth, "yyyy-MM"),
    card_id: cardId,
  };
  const {
    data: transactions = [],
    isLoading: loadingTx,
    refetch,
    isRefetching,
  } = useTransactions(filters);

  // Related data for transaction rows
  const { data: categories = [], isLoading: loadingCat } = useCategories();
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const updateTransaction = useUpdateTransaction();

  const loading =
    loadingCard ||
    loadingTx ||
    loadingCat ||
    loadingCards ||
    loadingBanks ||
    loadingBudgets;

  // Group transactions by date (Ecuador timezone)
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithRelations[]> = {};
    transactions.forEach((tx) => {
      // Parse as UTC then convert to Ecuador timezone
      const utcDate = parseISO(tx.occurred_at);
      const ecuadorDate = getEcuadorDate(utcDate);
      const dateKey = format(ecuadorDate, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

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
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Tarjeta no encontrada
        </div>
      </div>
    );
  }

  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);
  const cardTypeLabel = CARD_TYPES.find(
    (t) => t.value === card.card_type,
  )?.label;
  const cardKindLabel = CARD_KINDS.find(
    (k) => k.value === card.card_kind,
  )?.label;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/cards")}
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
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/cards/${card.id}/edit`)}
          >
            <Edit className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      </div>

      {/* Card Summary */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 50%, ${cardColor}aa 100%)`,
          color: useDarkText ? DARK_TEXT_COLOR : "white",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />
        <div
          className="absolute -right-4 top-12 w-20 h-20 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {card.bank?.image ? (
                <div
                  className="h-8 w-8 rounded-md backdrop-blur-sm p-1 flex items-center justify-center"
                  style={{
                    backgroundColor: useDarkText
                      ? "rgba(0,0,0,0.1)"
                      : "rgba(255,255,255,0.2)",
                  }}
                >
                  <img
                    src={card.bank.image}
                    alt={card.bank.name}
                    className="h-6 w-6 object-contain"
                  />
                </div>
              ) : (
                <div
                  className="h-8 w-8 rounded-md backdrop-blur-sm flex items-center justify-center"
                  style={{
                    backgroundColor: useDarkText
                      ? "rgba(0,0,0,0.1)"
                      : "rgba(255,255,255,0.2)",
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                </div>
              )}
              <div>
                {card.bank && (
                  <span className="text-sm font-medium opacity-80">
                    {card.bank.name}
                  </span>
                )}
                {cardKindLabel && (
                  <div className="text-xs font-medium uppercase opacity-60">
                    {cardKindLabel}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {cardTypeLabel && (
                <span className="text-xs font-bold uppercase opacity-80">
                  {cardTypeLabel}
                </span>
              )}
              {card.card_kind === "credit" &&
                card.outstanding_balance != null &&
                card.outstanding_balance > 0 && (
                  <span className="text-xs font-semibold opacity-70">
                    Saldo: {formatCurrency(card.outstanding_balance)}
                  </span>
                )}
            </div>
          </div>

          <div className="font-mono text-lg tracking-widest mb-2 opacity-90">
            •••• •••• •••• {card.last4 || "••••"}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              {card.cardholder_name && (
                <p className="text-sm font-medium tracking-wide uppercase truncate">
                  {card.cardholder_name}
                </p>
              )}
              {card.expiration_date && (
                <p className="text-xs opacity-60 mt-0.5">
                  {card.expiration_date}
                </p>
              )}
            </div>
          </div>
        </div>
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

      {/* Transactions List */}
      <CardUI className="overflow-hidden py-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
          <span className="text-sm font-medium">Transacciones</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            disabled={isRefetching || loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
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
              {groupedTransactions.map(([dateKey, txs]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-y">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(
                        parseISO(dateKey),
                        "EEEE, d 'de' MMMM 'de' yyyy",
                        { locale: es },
                      )}
                    </p>
                  </div>
                  {/* Transactions for this date */}
                  <div className="divide-y">
                    {txs.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        categories={categories}
                        cards={cards}
                        banks={banks}
                        budgets={budgets}
                        onUpdate={handleQuickUpdate}
                        onEdit={setEditingTx}
                        onDelete={setDeletingTx}
                        onClick={handleRowClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </CardUI>

      {/* Edit Transaction Sheet */}
      <EditTransactionSheet
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onDelete={(tx) => {
          setEditingTx(null);
          setDeletingTx(tx);
        }}
        categories={categories}
        cards={cards}
        banks={banks}
        budgets={budgets}
      />

      {/* Delete Transaction Dialog */}
      <DeleteTransactionDialog
        transaction={deletingTx}
        onClose={() => setDeletingTx(null)}
      />
    </div>
  );
}
