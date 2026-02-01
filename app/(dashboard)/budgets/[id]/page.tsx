"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { ArrowLeft, Wallet, Edit, RefreshCw, TrendingDown } from "lucide-react";
import { useBudget } from "../hooks";
import {
  useTransactions,
  useUpdateTransaction,
} from "../../transactions/hooks";
import { useCategories } from "../../categories/hooks";
import { useCards } from "../../cards/hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../hooks";
import { type TransactionWithRelations } from "../../transactions/service";
import { useMonthInUrl } from "@/lib/use-month-url";
import { Button } from "@/components/ui/button";
import { Card as CardUI, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  EditTransactionSheet,
  DeleteTransactionDialog,
} from "../../transactions/components";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const [selectedMonth] = useMonthInUrl();

  const { data: budget, isLoading: loadingBudget } = useBudget(budgetId);

  const filters = {
    date: format(selectedMonth, "yyyy-MM"),
    budget_id: budgetId,
  };
  const {
    data: transactions = [],
    isLoading: loadingTx,
    refetch,
    isRefetching,
  } = useTransactions(filters);

  const { data: categories = [], isLoading: loadingCat } = useCategories();
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const updateTransaction = useUpdateTransaction();

  const loading =
    loadingBudget ||
    loadingTx ||
    loadingCat ||
    loadingCards ||
    loadingBanks ||
    loadingBudgets;

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithRelations[]> = {};
    transactions.forEach((tx) => {
      const utcDate = parseISO(tx.occurred_at);
      const ecuadorDate = getEcuadorDate(utcDate);
      const dateKey = format(ecuadorDate, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

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

  const spent = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );
  const budgetAmount = budget?.amount ?? 0;
  const remaining = budgetAmount - spent;
  const isOverBudget = remaining < 0;
  const percentage =
    budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

  if (loadingBudget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Presupuesto no encontrado
        </div>
      </div>
    );
  }

  const statusBg = isOverBudget
    ? "from-red-500 to-red-600"
    : percentage > 80
      ? "from-orange-500 to-orange-600"
      : "from-emerald-500 to-emerald-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/budgets")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
              {budget.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Transacciones de este presupuesto
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/budgets/${budget.id}/edit`)}
          >
            <Edit className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${statusBg}`}
      >
        <div className="absolute top-3 right-3 opacity-20">
          <TrendingDown className="h-16 w-16" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-white/80">Gastado este mes</p>
          <p className="text-3xl font-bold tracking-tight mt-1">
            {formatCurrency(spent, budget.currency)}
          </p>
          <p className="text-sm text-white/80 mt-2">
            de {formatCurrency(budgetAmount, budget.currency)} ·{" "}
            {isOverBudget ? "Excedido por " : "Disponible "}
            {formatCurrency(Math.abs(remaining), budget.currency)}
          </p>
        </div>
        <div className="mt-4">
          <Progress
            value={Math.min(percentage, 100)}
            className="h-2.5 bg-white/20"
          />
        </div>
      </div>

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
              description="No hay transacciones en este presupuesto para el mes seleccionado."
            />
          ) : (
            <div>
              {groupedTransactions.map(([dateKey, txs]) => (
                <div key={dateKey}>
                  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-y">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(
                        parseISO(dateKey),
                        "EEEE, d 'de' MMMM 'de' yyyy",
                        { locale: es },
                      )}
                    </p>
                  </div>
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

      <DeleteTransactionDialog
        transaction={deletingTx}
        onClose={() => setDeletingTx(null)}
      />
    </div>
  );
}
