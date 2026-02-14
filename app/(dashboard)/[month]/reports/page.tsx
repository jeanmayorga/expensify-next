"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart3,
  CalendarDays,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  CalendarRange,
} from "lucide-react";
import { useTransactions } from "../transactions/hooks";
import { useMonth } from "@/lib/month-context";
import { useAuth } from "@/lib/auth-context";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { DateRange } from "react-day-picker";

const fmt = (amount: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function formatChartCurrency(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const CARD_PADDING = "p-4";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function ReportsPage() {
  const { selectedMonth } = useMonth();
  const { budgetId } = useAuth();

  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  // Por día: rango de fechas
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return { from: start, to: end };
  });

  // Por mes: año seleccionado
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    if (activeTab === "daily" || activeTab === "weekly") {
      setDateRange({
        from: startOfMonth(selectedMonth),
        to: endOfMonth(selectedMonth),
      });
    }
  }, [selectedMonth, activeTab]);

  // Filtros según tab activo
  const filters = useMemo(() => {
    const base = {
      timezone: "America/Guayaquil",
      ...(budgetId && { budget_id: budgetId }),
    };
    if (activeTab === "daily" || activeTab === "weekly") {
      const from = dateRange.from ?? startOfMonth(selectedMonth);
      const to = dateRange.to ?? endOfMonth(selectedMonth);
      return {
        ...base,
        date_from: format(from, "yyyy-MM-dd"),
        date_to: format(to, "yyyy-MM-dd"),
      };
    }
    const start = startOfYear(new Date(selectedYear, 0));
    const end = endOfYear(new Date(selectedYear, 0));
    return {
      ...base,
      date_from: format(start, "yyyy-MM-dd"),
      date_to: format(end, "yyyy-MM-dd"),
    };
  }, [activeTab, dateRange, selectedMonth, selectedYear, budgetId]);

  const {
    data: transactions = [],
    isLoading: loading,
    refetch,
    isRefetching,
  } = useTransactions(filters);

  const parseDate = (date: string | Date): Date => {
    if (typeof date === "string") {
      return getEcuadorDate(parseISO(date));
    }
    return getEcuadorDate(date);
  };

  const expenses = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions],
  );
  const incomes = useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, t) => sum + t.amount, 0),
    [expenses],
  );
  const totalIncomes = useMemo(
    () => incomes.reduce((sum, t) => sum + t.amount, 0),
    [incomes],
  );
  const totalTransactions = transactions.length;

  // Datos para vista por día
  const dailyChartData = useMemo(() => {
    const from = dateRange.from ?? startOfMonth(selectedMonth);
    const to = dateRange.to ?? endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: from, end: to });

    return days.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const dayExpenses = expenses.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        return format(ecuadorDate, "yyyy-MM-dd") === dateStr;
      });
      const dayIncomes = incomes.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        return format(ecuadorDate, "yyyy-MM-dd") === dateStr;
      });
      return {
        label: format(d, "d MMM", { locale: es }),
        date: dateStr,
        expenses: dayExpenses.reduce((s, tx) => s + tx.amount, 0),
        income: dayIncomes.reduce((s, tx) => s + tx.amount, 0),
        transactions: dayExpenses.length + dayIncomes.length,
      };
    });
  }, [expenses, incomes, dateRange, selectedMonth]);

  // Datos para vista por semana
  const weeklyChartData = useMemo(() => {
    const from = dateRange.from ?? startOfMonth(selectedMonth);
    const to = dateRange.to ?? endOfMonth(selectedMonth);
    const weeks = eachWeekOfInterval(
      { start: from, end: to },
      { weekStartsOn: 1, locale: es },
    );

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1, locale: es });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      const weekExpenses = expenses.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        const txTime = ecuadorDate.getTime();
        return txTime >= weekStart.getTime() && txTime <= weekEnd.getTime();
      });
      const weekIncomes = incomes.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        const txTime = ecuadorDate.getTime();
        return txTime >= weekStart.getTime() && txTime <= weekEnd.getTime();
      });
      return {
        label: `${format(weekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM", { locale: es })}`,
        weekStart: weekKey,
        expenses: weekExpenses.reduce((s, tx) => s + tx.amount, 0),
        income: weekIncomes.reduce((s, tx) => s + tx.amount, 0),
        transactions: weekExpenses.length + weekIncomes.length,
      };
    });
  }, [expenses, incomes, dateRange, selectedMonth]);

  // Datos para vista por mes
  const monthlyChartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31),
    });

    return months.map((m) => {
      const monthKey = format(m, "yyyy-MM");
      const monthExpenses = expenses.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        return format(ecuadorDate, "yyyy-MM") === monthKey;
      });
      const monthIncomes = incomes.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        return format(ecuadorDate, "yyyy-MM") === monthKey;
      });
      return {
        label: format(m, "MMM yyyy", { locale: es }),
        month: monthKey,
        expenses: monthExpenses.reduce((s, tx) => s + tx.amount, 0),
        income: monthIncomes.reduce((s, tx) => s + tx.amount, 0),
        transactions: monthExpenses.length + monthIncomes.length,
      };
    });
  }, [expenses, incomes, selectedYear]);

  const periodLabel = useMemo(() => {
    if (activeTab === "daily" || activeTab === "weekly") {
      if (!dateRange.from || !dateRange.to)
        return format(selectedMonth, "MMMM yyyy", { locale: es });
      const fromStr = format(dateRange.from, "d MMM", { locale: es });
      const toStr = format(dateRange.to, "d MMM yyyy", { locale: es });
      return `${fromStr} – ${toStr}`;
    }
    return selectedYear.toString();
  }, [activeTab, dateRange, selectedMonth, selectedYear]);

  const chartData =
    activeTab === "daily"
      ? dailyChartData
      : activeTab === "weekly"
        ? weeklyChartData
        : monthlyChartData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Reportes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análisis de gastos e ingresos por período
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching || loading}
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-1.5", isRefetching && "animate-spin")}
          />
          Actualizar
        </Button>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "weekly" | "monthly")}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-3">
          <TabsTrigger value="daily" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Por día
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5">
            <CalendarRange className="h-4 w-4" />
            Por semana
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Por mes
          </TabsTrigger>
        </TabsList>

        {/* Contenido Por día */}
        {activeTab === "daily" && (
          <div className="space-y-6 pt-4">
            <Card>
              <CardContent className={cn(CARD_PADDING, "pt-4")}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Seleccionar fecha o período
                  </label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => range && setDateRange(range)}
                    placeholder="Seleccionar rango"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Total gastado
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {fmt(totalExpenses)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {periodLabel}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Total ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt(totalIncomes)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {periodLabel}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Total transacciones
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{totalTransactions}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {periodLabel}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gastos por día
                </CardTitle>
                <p className="text-sm text-muted-foreground font-normal capitalize">
                  {periodLabel}
                </p>
              </CardHeader>
              <CardContent className={CARD_PADDING}>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">No hay datos para mostrar</p>
                    <p className="text-xs mt-1">
                      Selecciona otro período o verifica que tengas transacciones
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      expenses: { label: "Gastos", color: "hsl(0 84% 60%)" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillReportsExpensesChart"
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
                          dataKey="label"
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickFormatter={(v) => formatChartCurrency(v)}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <ChartTooltip
                          cursor={{
                            stroke: "hsl(var(--border))",
                            strokeWidth: 1,
                          }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            const tooltipDate = parseISO(data.date);
                            return (
                              <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {format(tooltipDate, "EEEE d MMMM", {
                                    locale: es,
                                  })}
                                </p>
                                <p className="mt-1 text-base font-semibold text-red-600 dark:text-red-400">
                                  {formatChartCurrency(data.expenses)}
                                </p>
                                {data.transactions > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {data.transactions} transacción
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
                          fill="url(#fillReportsExpensesChart)"
                          dot={{ fill: "hsl(0 84% 60%)", strokeWidth: 0, r: 3 }}
                          activeDot={{
                            r: 5,
                            strokeWidth: 2,
                            stroke: "hsl(var(--background))",
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contenido Por semana */}
        {activeTab === "weekly" && (
          <div className="space-y-6 pt-4">
            <Card>
              <CardContent className={cn(CARD_PADDING, "pt-4")}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Seleccionar fecha o período
                  </label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => range && setDateRange(range)}
                    placeholder="Seleccionar rango"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Total gastado
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {fmt(totalExpenses)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {periodLabel}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Total ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt(totalIncomes)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {periodLabel}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Total transacciones
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{totalTransactions}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {periodLabel}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gastos por semana
                </CardTitle>
                <p className="text-sm text-muted-foreground font-normal capitalize">
                  {periodLabel}
                </p>
              </CardHeader>
              <CardContent className={CARD_PADDING}>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">No hay datos para mostrar</p>
                    <p className="text-xs mt-1">
                      Selecciona otro período o verifica que tengas transacciones
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      expenses: { label: "Gastos", color: "hsl(0 84% 60%)" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted opacity-50"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickFormatter={(v) => formatChartCurrency(v)}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <ChartTooltip
                          cursor={{
                            fill: "hsl(var(--muted))",
                            opacity: 0.3,
                          }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground capitalize">
                                  {data.label}
                                </p>
                                <p className="mt-1 text-base font-semibold text-red-600 dark:text-red-400">
                                  {formatChartCurrency(data.expenses)}
                                </p>
                                {data.transactions > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {data.transactions} transacción
                                    {data.transactions !== 1 ? "es" : ""}
                                  </p>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="hsl(0 84% 60%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contenido Por mes */}
        {activeTab === "monthly" && (
          <div className="space-y-6 pt-4">
            <Card>
              <CardContent className={cn(CARD_PADDING, "pt-4")}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Seleccionar año
                  </label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Total gastado
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {fmt(totalExpenses)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedYear}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Total ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt(totalIncomes)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedYear}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Total transacciones
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(CARD_PADDING, "pt-0")}>
                  {loading ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{totalTransactions}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedYear}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className={cn(CARD_PADDING, "pb-2")}>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gastos por mes
                </CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedYear}
                </p>
              </CardHeader>
              <CardContent className={CARD_PADDING}>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">No hay datos para mostrar</p>
                    <p className="text-xs mt-1">
                      Selecciona otro año o verifica que tengas transacciones
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      expenses: { label: "Gastos", color: "hsl(0 84% 60%)" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted opacity-50"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickFormatter={(v) => formatChartCurrency(v)}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <ChartTooltip
                          cursor={{
                            fill: "hsl(var(--muted))",
                            opacity: 0.3,
                          }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground capitalize">
                                  {data.label}
                                </p>
                                <p className="mt-1 text-base font-semibold text-red-600 dark:text-red-400">
                                  {formatChartCurrency(data.expenses)}
                                </p>
                                {data.transactions > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {data.transactions} transacción
                                    {data.transactions !== 1 ? "es" : ""}
                                  </p>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="hsl(0 84% 60%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}
