"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  RefreshCw,
  ArrowLeft,
  Tag,
  CreditCard,
  Building2,
  PiggyBank,
  Plus,
  X,
  List,
  BarChart3,
} from "lucide-react";
import { useTransactions, useUpdateTransaction } from "./hooks";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { useCategories } from "../categories/hooks";
import { useCards } from "../cards/hooks";
import { useBanks } from "../banks/hooks";
import { useBudgets } from "../budgets/hooks";
import { type TransactionWithRelations } from "./service";
import { useMonthInUrl } from "@/lib/use-month-url";
import { Button } from "@/components/ui/button";
import { Card as CardUI, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function formatChartCurrency(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  CreateTransactionSheet,
  EditTransactionSheet,
  DeleteTransactionDialog,
} from "./components";

export default function TransactionsPage() {
  const [selectedMonth] = useMonthInUrl();
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [cardFilter, setCardFilter] = useState<string>("__all__");
  const [bankFilter, setBankFilter] = useState<string>("__all__");
  const [budgetFilter, setBudgetFilter] = useState<string>("__all__");

  // Build filters
  const filters: Record<string, string> = {
    date: format(selectedMonth, "yyyy-MM"),
    timezone: "America/Guayaquil",
  };
  if (categoryFilter !== "__all__") filters.category_id = categoryFilter;
  if (cardFilter !== "__all__") filters.card_id = cardFilter;
  if (bankFilter !== "__all__") filters.bank_id = bankFilter;
  if (budgetFilter !== "__all__") filters.budget_id = budgetFilter;

  // Queries
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
    loadingTx || loadingCat || loadingCards || loadingBanks || loadingBudgets;

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (typeFilter === "all") return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  // Helper to parse date correctly for Ecuador timezone
  const parseDate = (date: string | Date): Date => {
    if (typeof date === "string") {
      // Parse as UTC then convert to Ecuador timezone for display
      const utcDate = parseISO(date);
      return getEcuadorDate(utcDate);
    }
    return getEcuadorDate(date);
  };

  // Group transactions by date (Ecuador timezone)
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithRelations[]> = {};
    filteredTransactions.forEach((tx) => {
      // Convert UTC date to Ecuador timezone, then format as date key
      const ecuadorDate = parseDate(tx.occurred_at);
      const dateKey = format(ecuadorDate, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  // Prepare data for charts (daily expenses and income)
  const chartData = useMemo(() => {
    // Get all days in the selected month
    const year = format(selectedMonth, "yyyy");
    const month = format(selectedMonth, "MM");
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month}-${day.toString().padStart(2, "0")}`;

      // Calculate expenses and income for this day
      const dayTransactions = filteredTransactions.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        return format(ecuadorDate, "yyyy-MM-dd") === dateStr;
      });

      const dayExpenses = dayTransactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const dayIncome = dayTransactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);

      data.push({
        day: day.toString(),
        date: dateStr,
        expenses: dayExpenses,
        income: dayIncome,
        transactions: dayTransactions.length,
      });
    }

    return data;
  }, [filteredTransactions, selectedMonth]);

  // Sheet states
  const [createOpen, setCreateOpen] = useState(false);
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

  const hasActiveFilters =
    categoryFilter !== "__all__" ||
    cardFilter !== "__all__" ||
    bankFilter !== "__all__" ||
    budgetFilter !== "__all__";

  const clearFilters = () => {
    setCategoryFilter("__all__");
    setCardFilter("__all__");
    setBankFilter("__all__");
    setBudgetFilter("__all__");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            Transacciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y revisa tu actividad
          </p>
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
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
              ${totalExpenses.toFixed(2)}
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
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
              ${totalIncomes.toFixed(2)}
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
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
              {balance >= 0 ? "+" : "-"}${Math.abs(balance).toFixed(2)}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {transactions.length} transacción
              {transactions.length !== 1 ? "es" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        {/* View Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Tabs */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "list" | "chart")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="list" className="gap-1.5 text-xs">
                  <List className="h-3.5 w-3.5" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="chart" className="gap-1.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Gráfico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          >
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[180px] ${
                typeFilter !== "all"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <SelectValue placeholder="Todas las transacciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span>Todas las transacciones</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {transactions.length}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="expense">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Gastos</span>
                  <span className="rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-medium">
                    {expenseCount}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="income">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Ingresos</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-medium">
                    {incomeCount}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[120px] ${
                categoryFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || "#888" }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Card Filter */}
          <Select value={cardFilter} onValueChange={setCardFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[120px] ${
                cardFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <SelectValue placeholder="Tarjeta" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todas las tarjetas</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <div className="flex items-center gap-2">
                    <CreditCard
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: card.color || undefined }}
                    />
                    <span>{card.name}</span>
                    {card.last4 && (
                      <span className="text-muted-foreground text-xs">
                        •••• {card.last4}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bank Filter */}
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[100px] ${
                bankFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todos los bancos</SelectItem>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  <div className="flex items-center gap-2">
                    {bank.image ? (
                      <Image
                        src={bank.image}
                        alt={bank.name}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded object-contain shrink-0"
                      />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {bank.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Budget Filter */}
          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[120px] ${
                budgetFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <SelectValue placeholder="Presupuesto" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todos los presupuestos</SelectItem>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    {budget.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      <CardUI className="overflow-hidden py-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
          <span className="text-sm font-medium">Transacciones</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nueva
            </Button>
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
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title={
                hasActiveFilters || typeFilter !== "all"
                  ? "No matching transactions"
                  : "No transactions yet"
              }
              description={
                hasActiveFilters || typeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Your transactions for this month will appear here."
              }
            />
          ) : viewMode === "list" ? (
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
          ) : (
            // Chart View - Two separate cards
            <div className="space-y-6 p-4">
              {/* Expenses Chart */}
              <CardUI className="overflow-hidden">
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold mb-1 text-red-600 dark:text-red-400">
                    Gastos diarios
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <ChartContainer
                    config={{
                      expenses: {
                        label: "Gastos",
                        color: "hsl(0 84% 60%)",
                      },
                    }}
                    className="h-[280px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillExpensesChart"
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
                          tickFormatter={(value) => formatChartCurrency(value)}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <ChartTooltip
                          cursor={{
                            stroke: "hsl(var(--border))",
                            strokeWidth: 1,
                          }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            const total = data.expenses;
                            return (
                              <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Día {label} ·{" "}
                                  {format(selectedMonth, "MMMM", {
                                    locale: es,
                                  })}
                                </p>
                                <p className="mt-1 text-base font-semibold text-red-600 dark:text-red-400">
                                  Total: {formatChartCurrency(total)}
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
                          fill="url(#fillExpensesChart)"
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
                </div>
              </CardUI>

              {/* Income Chart */}
              <CardUI className="overflow-hidden">
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
                    Ingresos diarios
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <ChartContainer
                    config={{
                      income: {
                        label: "Ingresos",
                        color: "hsl(160 84% 39%)",
                      },
                    }}
                    className="h-[280px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillIncomeChart"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(160 84% 39%)"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(160 84% 39%)"
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
                          tickFormatter={(value) => formatChartCurrency(value)}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <ChartTooltip
                          cursor={{
                            stroke: "hsl(var(--border))",
                            strokeWidth: 1,
                          }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            const total = data.income;
                            return (
                              <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Día {label} ·{" "}
                                  {format(selectedMonth, "MMMM", {
                                    locale: es,
                                  })}
                                </p>
                                <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                  Total: {formatChartCurrency(total)}
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
                          dataKey="income"
                          stroke="hsl(160 84% 39%)"
                          strokeWidth={2}
                          fill="url(#fillIncomeChart)"
                          dot={{
                            fill: "hsl(160 84% 39%)",
                            strokeWidth: 0,
                            r: 3,
                          }}
                          activeDot={{
                            r: 5,
                            strokeWidth: 2,
                            stroke: "hsl(var(--background))",
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardUI>
            </div>
          )}
        </CardContent>
      </CardUI>

      {/* Create Transaction Sheet */}
      <CreateTransactionSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        cards={cards}
        banks={banks}
        budgets={budgets}
      />

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
