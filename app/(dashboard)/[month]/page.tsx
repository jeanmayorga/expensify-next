"use client";

import { useState, useMemo } from "react";
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useTransactionsForMonth, useUpdateTransaction } from "./transactions/hooks";
import { useMonth } from "@/lib/month-context";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { useBudgets } from "./budgets/hooks";
import { useBanks } from "./banks/hooks";
import { useCards } from "./cards/hooks";
import { type Bank } from "./banks/service";
import { type CardWithBank } from "./cards/service";
import { type TransactionWithRelations } from "./transactions/service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Wallet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Receipt,
  PiggyBank,
  AlertTriangle,
  CircleDollarSign,
  CalendarDays,
  BarChart3,
  Tag,
} from "lucide-react";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EditTransactionSheet,
  DeleteTransactionDialog,
} from "./transactions/components";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

export default function HomePage() {
  const { selectedMonth, monthStr } = useMonth();
  const { budgetId: authBudgetId } = useAuth();
  const canEdit = useCanEdit();
  const updateTransaction = useUpdateTransaction();

  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(null);
  const [deletingTx, setDeletingTx] = useState<TransactionWithRelations | null>(null);

  const handleRowClick = (tx: TransactionWithRelations) => {
    setEditingTx(tx);
  };

  const handleQuickUpdate = async (
    id: number,
    data: Record<string, string | null>,
  ) => {
    await updateTransaction.mutateAsync({ id, data });
  };

  const { data: allTransactions = [], isLoading: loadingTx } =
    useTransactionsForMonth(selectedMonth);
  const { data: allBudgets = [], isLoading: loadingBudgets } = useBudgets();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: cards = [], isLoading: loadingCards } = useCards();

  const transactions = useMemo(() => {
    if (authBudgetId) {
      return allTransactions.filter((tx) => tx.budget_id === authBudgetId);
    }
    return allTransactions;
  }, [allTransactions, authBudgetId]);

  const budgets = useMemo(() => {
    if (authBudgetId) {
      return allBudgets.filter((b) => b.id === authBudgetId);
    }
    return allBudgets;
  }, [allBudgets, authBudgetId]);

  const loading = loadingTx || loadingBudgets || loadingBanks || loadingCards;

  // Core stats
  const expenses = useMemo(
    () => transactions.filter((tx) => tx.type === "expense"),
    [transactions],
  );
  const incomes = useMemo(
    () => transactions.filter((tx) => tx.type === "income"),
    [transactions],
  );

  const totalExpenses = expenses.reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalIncome = incomes.reduce((s, tx) => s + tx.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Daily average
  const daysElapsed = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(selectedMonth);
    const mEnd = endOfMonth(selectedMonth);
    const end = now < mEnd ? now : mEnd;
    return Math.max(differenceInDays(end, mStart) + 1, 1);
  }, [selectedMonth]);

  const dailyAvg = totalExpenses / daysElapsed;

  // Unassigned transactions
  const unassignedCount = expenses.filter(
    (tx) => !tx.budget_id && !tx.card_id && !tx.bank_id,
  ).length;

  // Budget spending
  const budgetSpending = useMemo(() => {
    return budgets.map((budget) => {
      const spent = expenses
        .filter((tx) => tx.budget_id === budget.id)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
      const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        budget,
        spent,
        remaining: budget.amount - spent,
        percentage: Math.min(pct, 100),
        rawPercentage: pct,
        isOverBudget: spent > budget.amount,
      };
    });
  }, [budgets, expenses]);

  const overBudgetCount = budgetSpending.filter((b) => b.isOverBudget).length;
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalBudgetSpent = budgetSpending.reduce((s, b) => s + b.spent, 0);
  const budgetUsagePct =
    totalBudgeted > 0 ? (totalBudgetSpent / totalBudgeted) * 100 : 0;

  // Bank spending
  const bankSpending = useMemo(() => {
    const map: Record<string, { bank: Bank; total: number; count: number }> =
      {};
    expenses
      .filter((tx) => tx.bank)
      .forEach((tx) => {
        const id = tx.bank_id!;
        if (!map[id]) map[id] = { bank: tx.bank!, total: 0, count: 0 };
        map[id].total += Math.abs(tx.amount);
        map[id].count++;
      });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Card spending
  const cardSpending = useMemo(() => {
    const map: Record<
      string,
      { card: CardWithBank; total: number; count: number }
    > = {};
    expenses
      .filter((tx) => tx.card)
      .forEach((tx) => {
        const id = tx.card_id!;
        if (!map[id]) map[id] = { card: tx.card!, total: 0, count: 0 };
        map[id].total += Math.abs(tx.amount);
        map[id].count++;
      });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Top 5 biggest expenses
  const topExpenses = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 5),
    [expenses],
  );

  // Recent 5 transactions
  const recentTx = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        )
        .slice(0, 5),
    [transactions],
  );

  const currentMonth = format(selectedMonth, "MMMM yyyy", { locale: es });

  return (
    <div className="min-w-0 w-full max-w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">
          {currentMonth}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen general de tus finanzas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Gastos"
          value={fmt(totalExpenses)}
          sub={`${expenses.length} transacciones`}
          icon={<ArrowDownRight className="h-4 w-4" />}
          iconBg="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          loading={loading}
        />
        <KpiCard
          label="Ingresos"
          value={fmt(totalIncome)}
          sub={`${incomes.length} transacciones`}
          icon={<ArrowUpRight className="h-4 w-4" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <KpiCard
          label="Balance"
          value={`${balance >= 0 ? "+" : ""}${fmt(Math.abs(balance))}`}
          sub={balance >= 0 ? "Superavit" : "Deficit"}
          icon={<Wallet className="h-4 w-4" />}
          iconBg={
            balance >= 0
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          }
          loading={loading}
        />
        <KpiCard
          label="Promedio diario"
          value={fmt(dailyAvg)}
          sub={`${daysElapsed} días transcurridos`}
          icon={<CalendarDays className="h-4 w-4" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          loading={loading}
        />
      </div>

      {/* Budget Overview Bar */}
      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Presupuesto total</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(totalBudgetSpent)} de {fmt(totalBudgeted)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {overBudgetCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {overBudgetCount} excedido{overBudgetCount > 1 ? "s" : ""}
                  </Badge>
                )}
                <span className="text-sm font-bold">
                  {budgetUsagePct.toFixed(0)}%
                </span>
              </div>
            </div>
            <Progress
              value={Math.min(budgetUsagePct, 100)}
              className="h-2.5"
              indicatorClassName={cn(
                "bg-gradient-to-r",
                budgetUsagePct > 100
                  ? "from-red-500 to-red-600"
                  : budgetUsagePct > 80
                    ? "from-orange-500 to-orange-600"
                    : "from-emerald-500 to-emerald-600",
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Grid — col-span-12 en mobile (100%), 50/50 desde lg */}
      <div className="grid w-full grid-cols-12 gap-4">
        {/* Left column: Presupuestos */}
        <div className="col-span-12 min-w-0 w-full space-y-4 lg:col-span-6">
          {/* Budget Cards */}
          {budgets.length > 0 && (
            <Card className="w-full">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Presupuestos
                </CardTitle>
                <Link
                  href={`/${monthStr}/budgets`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {budgetSpending.slice(0, 4).map((data) => (
                      <BudgetMiniCard
                        key={data.budget.id}
                        data={data}
                        monthStr={monthStr}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right column: Resumen rápido, Por banco, Por tarjeta */}
        <div className="col-span-12 min-w-0 w-full space-y-4 lg:col-span-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Resumen rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <QuickStat
                    label="Transacciones totales"
                    value={transactions.length.toString()}
                    icon={<Receipt className="h-3.5 w-3.5" />}
                  />
                  <QuickStat
                    label="Tarjetas activas"
                    value={cardSpending.length.toString()}
                    icon={<CreditCard className="h-3.5 w-3.5" />}
                  />
                  <QuickStat
                    label="Bancos activos"
                    value={bankSpending.length.toString()}
                    icon={<Building2 className="h-3.5 w-3.5" />}
                  />
                  {unassignedCount > 0 && (
                    <QuickStat
                      label="Sin asignar"
                      value={unassignedCount.toString()}
                      icon={<Tag className="h-3.5 w-3.5" />}
                      warn
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Distribution */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                Por banco
              </CardTitle>
              <Link
                href={`/${monthStr}/banks`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-8 rounded-lg" />
                  ))}
                </div>
              ) : bankSpending.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin datos
                </p>
              ) : (
                <div className="space-y-3">
                  {bankSpending.map(({ bank, total }) => {
                    const pct =
                      totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                    return (
                      <Link
                        key={bank.id}
                        href={`/${monthStr}/banks/${bank.id}`}
                        className="block group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {bank.image ? (
                              <Image
                                src={bank.image}
                                alt={bank.name}
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded object-contain shrink-0"
                              />
                            ) : (
                              <Building2
                                className="h-4 w-4 shrink-0"
                                style={{ color: bank.color || "#6b7280" }}
                              />
                            )}
                            <span className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors break-words">
                              {bank.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">
                            {fmt(total)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: bank.color || "#6366f1",
                            }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Distribution */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                Por tarjeta
              </CardTitle>
              <Link
                href={`/${monthStr}/cards`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-8 rounded-lg" />
                  ))}
                </div>
              ) : cardSpending.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin datos
                </p>
              ) : (
                <div className="space-y-3">
                  {cardSpending.map(({ card, total }) => {
                    const pct =
                      totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                    return (
                      <Link
                        key={card.id}
                        href={`/${monthStr}/cards/${card.id}`}
                        className="block group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <CreditCard
                              className="h-4 w-4 shrink-0"
                              style={{ color: card.color || "#6366f1" }}
                            />
                            <span className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors break-words">
                              {card.name}
                              {card.last4 && (
                                <span className="text-muted-foreground ml-1">
                                  *{card.last4}
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">
                            {fmt(total)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: card.color || "#6366f1",
                            }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Últimas transacciones + Gastos más grandes — 50/50 en desktop, apiladas en tablet/móvil */}
        <div className="col-span-12 grid min-w-0 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                Últimas transacciones
              </CardTitle>
              <Link
                href={`/${monthStr}/transactions`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TransactionRowSkeleton key={i} />
                  ))}
                </div>
              ) : recentTx.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 px-4">
                  No hay transacciones este mes
                </p>
              ) : (
                <div className="divide-y">
                  {recentTx.map((tx) => (
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                Gastos más grandes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TransactionRowSkeleton key={i} />
                  ))}
                </div>
              ) : topExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 px-4">
                  Sin datos
                </p>
              ) : (
                <div className="divide-y">
                  {topExpenses.map((tx) => (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit / Delete transaction modals */}
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
            budgets={allBudgets}
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

/* ─── Sub-components ─── */

function KpiCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  loading: boolean;
}) {
  return (
    <Card className="min-w-0 py-0">
      <CardContent className="min-w-0 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate min-w-0">
            {label}
          </span>
          <div
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center",
              iconBg,
            )}
          >
            {icon}
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-24 mb-1" />
        ) : (
          <p className="text-lg sm:text-xl font-bold tracking-tight truncate">
            {value}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  label,
  value,
  icon,
  warn,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          warn && "text-orange-600 dark:text-orange-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function BudgetMiniCard({
  data,
  monthStr,
}: {
  data: {
    budget: { id: string; name: string; amount: number; currency: string };
    spent: number;
    remaining: number;
    percentage: number;
    rawPercentage: number;
    isOverBudget: boolean;
  };
  monthStr: string;
}) {
  const { budget, spent, percentage, rawPercentage, remaining, isOverBudget } =
    data;
  const statusColor = isOverBudget
    ? "from-red-500 to-red-600"
    : rawPercentage > 80
      ? "from-orange-500 to-orange-600"
      : "from-emerald-500 to-emerald-600";

  return (
    <Link
      href={`/${monthStr}/budgets/${budget.id}`}
      className="block p-3.5 rounded-xl border hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full bg-gradient-to-b rounded-l-xl",
          statusColor,
        )}
      />
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold line-clamp-2 break-words">{budget.name}</p>
        <Badge
          variant="secondary"
          className={cn(
            "text-xs shrink-0",
            isOverBudget
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : rawPercentage > 80
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
          )}
        >
          {rawPercentage.toFixed(0)}%
        </Badge>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-lg font-bold">{fmt(spent)}</span>
        <span className="text-xs text-muted-foreground">
          / {fmt(budget.amount)}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-1.5"
        indicatorClassName={cn("bg-gradient-to-r", statusColor)}
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">
          {isOverBudget ? "Excedido" : "Disponible"}
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold",
            isOverBudget
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {isOverBudget && "-"}
          {fmt(Math.abs(remaining))}
        </span>
      </div>
    </Link>
  );
}
