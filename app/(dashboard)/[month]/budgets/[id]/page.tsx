"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { ArrowLeft, Wallet, Edit, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useBudget } from "../hooks";
import {
  useTransactions,
  useUpdateTransaction,
} from "../../transactions/hooks";
import { useCards } from "../../cards/hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../hooks";
import { type TransactionWithRelations } from "../../transactions/service";
import { useMonth } from "@/lib/month-context";
import { useCanEdit } from "@/lib/auth-context";
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
import { EditBudgetModal } from "../components/EditBudgetModal";

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
  const month = params.month as string;
  const budgetId = params.id as string;
  const canEdit = useCanEdit();
  const budgetsListPath = `/${month}/budgets`;

  const { selectedMonth } = useMonth();

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

  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const updateTransaction = useUpdateTransaction();

  const loading =
    loadingBudget ||
    loadingTx ||
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
  const [editingBudget, setEditingBudget] = useState<boolean>(false);

  const handleRowClick = (tx: TransactionWithRelations) => {
    setEditingTx(tx);
  };

  const handleQuickUpdate = async (
    id: number,
    data: Record<string, string | null>,
  ) => {
    await updateTransaction.mutateAsync({ id, data });
  };

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions],
  );
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );
  const balance = totalIncome - totalExpenses;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const incomeCount = transactions.filter((t) => t.type === "income").length;

  const budgetAmount = budget?.amount ?? 0;
  /** Balance del presupuesto = gastos - ingresos (net spending) */
  const netSpending = totalExpenses - totalIncome;
  const remaining = budgetAmount - netSpending;
  const isOverBudget = remaining < 0;
  const percentage =
    budgetAmount > 0 ? Math.min((netSpending / budgetAmount) * 100, 100) : 0;

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
        <Button variant="ghost" onClick={() => router.push(budgetsListPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a presupuestos
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
            onClick={() => router.push(budgetsListPath)}
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
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingBudget(true)}
            >
              <Edit className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tres cards: Gastos, Ingresos, Balance (como en home y transacciones) */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <TrendingDown className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Gastos</p>
            {loading ? (
              <Skeleton className="h-9 w-32 bg-white/20 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
                {formatCurrency(totalExpenses, budget.currency)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {expenseCount} transacción{expenseCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <TrendingUp className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Ingresos</p>
            {loading ? (
              <Skeleton className="h-9 w-32 bg-white/20 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
                {formatCurrency(totalIncome, budget.currency)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {incomeCount} transacción{incomeCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

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
            {loading ? (
              <Skeleton className="h-9 w-32 bg-white/20 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
                {balance >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(balance), budget.currency)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {transactions.length} transacción
              {transactions.length !== 1 ? "es" : ""} en este presupuesto
            </p>
          </div>
        </div>
      </div>

      {/* Presupuesto del mes */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${statusBg}`}
      >
        <div className="absolute top-4 right-4 opacity-10">
          <Wallet className="h-24 w-24" />
        </div>
        <div className="relative space-y-4">
          <p className="text-sm font-medium text-white/80 uppercase tracking-wider">
            Presupuesto del mes
          </p>

          {/* Monto gastado grande */}
          <div>
            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {formatCurrency(netSpending, budget.currency)}
            </p>
            <p className="text-sm text-white/70 mt-1">
              de {formatCurrency(budgetAmount, budget.currency)} presupuestado
            </p>
          </div>

          {/* Barra de progreso */}
          <Progress
            value={Math.min(percentage, 100)}
            className="h-3 bg-white/20"
            indicatorClassName="bg-white"
          />

          {/* Disponible / Excedido */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {isOverBudget ? "Excedido por " : "Disponible "}
              {formatCurrency(Math.abs(remaining), budget.currency)}
            </p>
            <p className="text-sm font-medium text-white/80">
              {Math.round(percentage)}%
            </p>
          </div>
        </div>
      </div>

      <CardUI className="overflow-hidden py-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/25">
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
                  <div className="sticky top-0 z-10 bg-muted/35 backdrop-blur-sm px-4 py-2 border-y">
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
              ))}
            </div>
          )}
        </CardContent>
      </CardUI>

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

          <EditBudgetModal
            budget={budget}
            open={editingBudget}
            onClose={() => setEditingBudget(false)}
            onSuccess={() => setEditingBudget(false)}
            onDeleted={() => router.push(budgetsListPath)}
          />
        </>
      )}
    </div>
  );
}
