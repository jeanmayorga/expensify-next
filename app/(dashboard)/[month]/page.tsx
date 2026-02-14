"use client";

import { useState, useMemo } from "react";
import {
  format,
  parseISO,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  isSameDay,
  subDays,
  subMonths,
  getDaysInMonth,
} from "date-fns";
import { groupTransactionsByDate } from "@/utils/transactions";
import { es } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import {
  useTransactionsForMonth,
  useTransactions,
  useUpdateTransaction,
} from "./transactions/hooks";
import { getEcuadorDate } from "@/utils/ecuador-time";
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EditTransactionSheet,
  DeleteTransactionDialog,
} from "./transactions/components";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

function DailySpentContent({
  loading,
  total,
  count,
  pctChange,
}: {
  loading: boolean;
  total: number;
  count: number;
  pctChange: number | null;
}) {
  const isBetter = pctChange !== null && pctChange < 0;
  const isWorse = pctChange !== null && pctChange > 0;
  const isSame = pctChange !== null && pctChange === 0;

  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <CalendarDays className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-xl font-bold tabular-nums">{fmt(total)}</p>
          )}
          {!loading && pctChange !== null && (
            <p className="text-xs mt-0.5 flex items-center gap-1">
              {isSame && (
                <span className="text-muted-foreground">Igual</span>
              )}
              {isBetter && (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {Math.abs(pctChange).toFixed(1)}% mejor
                  </span>
                </>
              )}
              {isWorse && (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">
                    {pctChange.toFixed(1)}% peor
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </div>
      {!loading && count > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {count} transaccion{count !== 1 ? "es" : ""}
        </span>
      )}
    </div>
  );
}

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
  const prevMonth = useMemo(() => subMonths(selectedMonth, 1), [selectedMonth]);
  const { data: prevMonthTransactions = [] } = useTransactions({
    date: format(prevMonth, "yyyy-MM"),
    timezone: "America/Guayaquil",
    ...(authBudgetId ? { budget_id: authBudgetId } : {}),
  });
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

  // Gastado hoy, ayer, anteayer
  const today = useMemo(() => getEcuadorDate(), []);
  const yesterday = useMemo(() => subDays(today, 1), [today]);
  const dayBeforeYesterday = useMemo(() => subDays(today, 2), [today]);
  const threeDaysAgo = useMemo(() => subDays(today, 3), [today]);
  const fourDaysAgo = useMemo(() => subDays(today, 4), [today]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((tx) => {
      const txDate = getEcuadorDate(tx.occurred_at);
      return isSameDay(txDate, today);
    });
  }, [expenses, today]);
  const todayTotal = todayExpenses.reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const yesterdayExpenses = useMemo(() => {
    return expenses.filter((tx) => {
      const txDate = getEcuadorDate(tx.occurred_at);
      return isSameDay(txDate, yesterday);
    });
  }, [expenses, yesterday]);
  const yesterdayTotal = yesterdayExpenses.reduce(
    (s, tx) => s + Math.abs(tx.amount),
    0,
  );

  const dayBeforeYesterdayExpenses = useMemo(() => {
    return expenses.filter((tx) => {
      const txDate = getEcuadorDate(tx.occurred_at);
      return isSameDay(txDate, dayBeforeYesterday);
    });
  }, [expenses, dayBeforeYesterday]);
  const dayBeforeYesterdayTotal = dayBeforeYesterdayExpenses.reduce(
    (s, tx) => s + Math.abs(tx.amount),
    0,
  );

  const threeDaysAgoExpenses = useMemo(() => {
    return expenses.filter((tx) => {
      const txDate = getEcuadorDate(tx.occurred_at);
      return isSameDay(txDate, threeDaysAgo);
    });
  }, [expenses, threeDaysAgo]);
  const threeDaysAgoTotal = threeDaysAgoExpenses.reduce(
    (s, tx) => s + Math.abs(tx.amount),
    0,
  );

  const fourDaysAgoExpenses = useMemo(() => {
    return expenses.filter((tx) => {
      const txDate = getEcuadorDate(tx.occurred_at);
      return isSameDay(txDate, fourDaysAgo);
    });
  }, [expenses, fourDaysAgo]);
  const fourDaysAgoTotal = fourDaysAgoExpenses.reduce(
    (s, tx) => s + Math.abs(tx.amount),
    0,
  );

  // Porcentaje vs día anterior
  const todayVsYesterdayPct =
    yesterdayTotal > 0
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
      : null;
  const yesterdayVsAnteayerPct =
    dayBeforeYesterdayTotal > 0
      ? ((yesterdayTotal - dayBeforeYesterdayTotal) / dayBeforeYesterdayTotal) *
        100
      : null;
  const anteayerVsThreeDaysPct =
    threeDaysAgoTotal > 0
      ? ((dayBeforeYesterdayTotal - threeDaysAgoTotal) / threeDaysAgoTotal) * 100
      : null;
  const threeDaysVsFourDaysPct =
    fourDaysAgoTotal > 0
      ? ((threeDaysAgoTotal - fourDaysAgoTotal) / fourDaysAgoTotal) * 100
      : null;

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

  // Presupuestos en riesgo (>80% o excedidos)
  const budgetsAtRisk = useMemo(
    () =>
      budgetSpending.filter((b) => b.rawPercentage >= 80 || b.isOverBudget),
    [budgetSpending],
  );

  // Proyección de fin de mes
  const daysInMonth = getDaysInMonth(selectedMonth);
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);
  const projectedMonthEnd = dailyAvg * daysInMonth;

  // Comparación con mes anterior
  const prevMonthExpenses = useMemo(
    () =>
      prevMonthTransactions
        .filter((tx) => tx.type === "expense")
        .reduce((s, tx) => s + Math.abs(tx.amount), 0),
    [prevMonthTransactions],
  );
  const vsPrevMonthPct =
    prevMonthExpenses > 0
      ? ((totalExpenses - prevMonthExpenses) / prevMonthExpenses) * 100
      : null;

  // Chart data: evolución de gastos por día
  const expensesChartData = useMemo(() => {
    const year = format(selectedMonth, "yyyy");
    const month = format(selectedMonth, "MM");
    const days = getDaysInMonth(selectedMonth);
    const data = [];
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${month}-${day.toString().padStart(2, "0")}`;
      const dayTx = expenses.filter((tx) => {
        const d = getEcuadorDate(
          typeof tx.occurred_at === "string"
            ? parseISO(tx.occurred_at)
            : tx.occurred_at,
        );
        return format(d, "yyyy-MM-dd") === dateStr;
      });
      const dayTotal = dayTx.reduce((s, tx) => s + Math.abs(tx.amount), 0);
      data.push({
        day: day.toString(),
        date: dateStr,
        expenses: dayTotal,
        transactions: dayTx.length,
      });
    }
    return data;
  }, [expenses, selectedMonth]);

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

  // Top 8 biggest expenses
  const topExpenses = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 8),
    [expenses],
  );

  // Recent 8 transactions
  const recentTx = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        )
        .slice(0, 8),
    [transactions],
  );

  // Transactions without budget assigned (expenses only)
  const txWithoutBudget = useMemo(() => {
    const allExpenses = allTransactions.filter((tx) => tx.type === "expense");
    return [...allExpenses]
      .filter((tx) => !tx.budget_id)
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime(),
      )
      .slice(0, 8);
  }, [allTransactions]);

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

      {/* Proyección fin de mes + Comparación mes anterior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Proyección fin de mes</p>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-xl font-bold tabular-nums">
                  {fmt(projectedMonthEnd)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si mantienes el ritmo actual ({fmt(dailyAvg)}/día) ·{" "}
                  {daysRemaining} días restantes
                </p>
                {totalBudgeted > 0 && (
                  <p
                    className={cn(
                      "text-xs font-medium mt-1",
                      projectedMonthEnd > totalBudgeted
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {projectedMonthEnd > totalBudgeted
                      ? `Excederías el presupuesto en ${fmt(projectedMonthEnd - totalBudgeted)}`
                      : `Dentro del presupuesto (${fmt(totalBudgeted - projectedMonthEnd)} de margen)`}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">vs mes anterior</p>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : vsPrevMonthPct !== null ? (
              <>
                <p
                  className={cn(
                    "text-xl font-bold tabular-nums flex items-center gap-1",
                    vsPrevMonthPct > 0
                      ? "text-red-600 dark:text-red-400"
                      : vsPrevMonthPct < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground",
                  )}
                >
                  {vsPrevMonthPct > 0 && (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {vsPrevMonthPct < 0 && (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {vsPrevMonthPct > 0 ? "+" : ""}
                  {vsPrevMonthPct.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(prevMonth, "MMMM", { locale: es })}: {fmt(prevMonthExpenses)} → Este mes: {fmt(totalExpenses)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin datos del mes anterior para comparar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Presupuestos en riesgo */}
      {budgetsAtRisk.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
              Presupuestos en riesgo
            </CardTitle>
            <Link
              href={`/${monthStr}/budgets`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {budgetsAtRisk.map(({ budget, spent, rawPercentage, isOverBudget }) => (
                <Link
                  key={budget.id}
                  href={`/${monthStr}/budgets/${budget.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{budget.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isOverBudget
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                    )}
                  >
                    {rawPercentage.toFixed(0)}%
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {fmt(spent)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico evolución de gastos */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
            Evolución de gastos
          </CardTitle>
          <Link
            href={`/${monthStr}/transactions`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Ver detalle <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <Skeleton className="h-[200px] w-full rounded-lg" />
          ) : (
            <ChartContainer
              config={{
                expenses: {
                  label: "Gastos",
                  color: "hsl(0 84% 60%)",
                },
              }}
              className="h-[200px] w-full"
            >
              <AreaChart
                  data={expensesChartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillExpensesEvolutionChart"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(0 84% 60%)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(0 84% 60%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted opacity-50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("es-EC", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(v)
                    }
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <ChartTooltip
                    cursor={{
                      stroke: "hsl(var(--border))",
                      strokeWidth: 1,
                    }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                          <p className="text-xs font-medium text-muted-foreground">
                            Día {label} · {format(selectedMonth, "MMMM", { locale: es })}
                          </p>
                          <p className="mt-1 text-base font-semibold text-red-600 dark:text-red-400">
                            {fmt(data.expenses)}
                          </p>
                          {data.transactions > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {data.transactions} transaccion
                              {data.transactions !== 1 ? "es" : ""}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(0 84% 60%)"
                    strokeWidth={2}
                    fill="url(#fillExpensesEvolutionChart)"
                    dot={{ fill: "hsl(0 84% 60%)", strokeWidth: 0, r: 2 }}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      stroke: "hsl(var(--background))",
                    }}
                  />
                </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Gastado hoy / ayer / anteayer / hace 3 días — 4 secciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Hoy · {format(today, "d MMM", { locale: es })}
            </p>
            <DailySpentContent
              loading={loading}
              total={todayTotal}
              count={todayExpenses.length}
              pctChange={todayVsYesterdayPct}
            />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Ayer · {format(yesterday, "d MMM", { locale: es })}
            </p>
            <DailySpentContent
              loading={loading}
              total={yesterdayTotal}
              count={yesterdayExpenses.length}
              pctChange={yesterdayVsAnteayerPct}
            />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Anteayer · {format(dayBeforeYesterday, "d MMM", { locale: es })}
            </p>
            <DailySpentContent
              loading={loading}
              total={dayBeforeYesterdayTotal}
              count={dayBeforeYesterdayExpenses.length}
              pctChange={anteayerVsThreeDaysPct}
            />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Hace 3 días · {format(threeDaysAgo, "d MMM", { locale: es })}
            </p>
            <DailySpentContent
              loading={loading}
              total={threeDaysAgoTotal}
              count={threeDaysAgoExpenses.length}
              pctChange={threeDaysVsFourDaysPct}
            />
          </CardContent>
        </Card>
      </div>

      {/* Últimas transacciones, Transacciones más grandes, Transacciones sin presupuesto — debajo de hoy/ayer/anteayer */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 overflow-hidden gap-0">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b py-4 !pb-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
              Últimas transacciones
            </CardTitle>
            <Link
              href={`/${monthStr}/transactions`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y max-h-[28rem] overflow-y-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <TransactionRowSkeleton key={i} />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center px-4">
                <p className="text-sm text-muted-foreground text-center">
                  No hay transacciones este mes
                </p>
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                {groupTransactionsByDate(recentTx).map(
                  ([dateKey, txs], groupIndex) => {
                    const dayTotal = txs
                      .filter((tx) => tx.type === "expense")
                      .reduce((s, tx) => s + Math.abs(tx.amount), 0);
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
                              onUpdate={
                                canEdit ? handleQuickUpdate : undefined
                              }
                              onEdit={canEdit ? setEditingTx : undefined}
                              onDelete={canEdit ? setDeletingTx : undefined}
                              onClick={canEdit ? handleRowClick : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden gap-0">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b py-4 !pb-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
              Transacciones más grandes
            </CardTitle>
            <Link
              href={`/${monthStr}/transactions`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y max-h-[28rem] overflow-y-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <TransactionRowSkeleton key={i} />
                ))}
              </div>
            ) : topExpenses.length === 0 ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center px-4">
                <p className="text-sm text-muted-foreground text-center">
                  Sin datos
                </p>
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                {groupTransactionsByDate(topExpenses).map(
                  ([dateKey, txs], groupIndex) => {
                    const dayTotal = txs
                      .filter((tx) => tx.type === "expense")
                      .reduce((s, tx) => s + Math.abs(tx.amount), 0);
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
                              onUpdate={
                                canEdit ? handleQuickUpdate : undefined
                              }
                              onEdit={canEdit ? setEditingTx : undefined}
                              onDelete={canEdit ? setDeletingTx : undefined}
                              onClick={canEdit ? handleRowClick : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden gap-0">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b py-4 !pb-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
              Transacciones sin presupuesto
            </CardTitle>
            <Link
              href={`/${monthStr}/transactions`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y max-h-[28rem] overflow-y-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <TransactionRowSkeleton key={i} />
                ))}
              </div>
            ) : txWithoutBudget.length === 0 ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center px-4">
                <p className="text-sm text-muted-foreground text-center">
                  No hay transacciones sin presupuesto
                </p>
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                {groupTransactionsByDate(txWithoutBudget).map(
                  ([dateKey, txs], groupIndex) => {
                    const dayTotal = txs
                      .filter((tx) => tx.type === "expense")
                      .reduce((s, tx) => s + Math.abs(tx.amount), 0);
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
                              budgets={allBudgets}
                              onUpdate={
                                canEdit ? handleQuickUpdate : undefined
                              }
                              onEdit={canEdit ? setEditingTx : undefined}
                              onDelete={canEdit ? setDeletingTx : undefined}
                              onClick={canEdit ? handleRowClick : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid — col-span-12 en mobile (100%), 50/50 desde lg */}
      <div className="grid w-full grid-cols-12 gap-4">
        {/* Presupuestos — full width */}
        <div className="col-span-12 min-w-0 w-full space-y-4">
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
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {budgetSpending.map((data) => (
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

        {/* Resumen rápido, Por banco, Por tarjeta — grid 3 cols */}
        <div className="col-span-12 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
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
