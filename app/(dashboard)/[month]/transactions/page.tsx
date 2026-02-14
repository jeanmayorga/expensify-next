"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Wallet,
  RefreshCw,
  Building2,
  Plus,
  X,
  List,
  BarChart3,
  Images,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Filter,
  LayoutGrid,
  Search,
} from "lucide-react";
import { useTransactions, useUpdateTransaction } from "./hooks";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { groupTransactionsByDate, findExpenseReimbursementPairs } from "@/utils/transactions";
import { useCards } from "../cards/hooks";
import { CARD_TYPES, CARD_KINDS } from "../cards/utils";
import { useBanks } from "../banks/hooks";
import { useBudgets } from "../budgets/hooks";
import { BudgetLabel } from "../budgets/components/BudgetLabel";
import { type TransactionWithRelations } from "./service";
import { useMonth } from "@/lib/month-context";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  CreateTransactionSheet,
  EditTransactionSheet,
  DeleteTransactionDialog,
  MergeConfirmDialog,
} from "./components";
import { CreateSubscriptionDialog } from "../subscriptions/components/CreateSubscriptionDialog";
import type { SubscriptionFormData } from "../subscriptions/components/CreateSubscriptionDialog";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

function formatChartCurrency(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TransactionsPage() {
  const { selectedMonth } = useMonth();
  const { budgetId } = useAuth();
  const canEdit = useCanEdit();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const transactionIdParam = searchParams.get("transactionId");
  const txId = transactionIdParam ? parseInt(transactionIdParam, 10) : null;
  const hasScrolledToTx = useRef(false);

  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cardFilter, setCardFilter] = useState<string>("__all__");
  const [bankFilter, setBankFilter] = useState<string>("__all__");
  const [budgetFilter, setBudgetFilter] = useState<string>("__all__");

  // Build filters
  const filters: Record<string, string> = {
    date: format(selectedMonth, "yyyy-MM"),
    timezone: "America/Guayaquil",
  };
  if (cardFilter !== "__all__") filters.card_id = cardFilter;
  if (bankFilter !== "__all__") filters.bank_id = bankFilter;
  if (budgetId) {
    filters.budget_id = budgetId;
  } else if (budgetFilter !== "__all__") {
    filters.budget_id = budgetFilter;
  }

  // Queries
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

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loading =
    loadingTx || loadingCards || loadingBanks || loadingBudgets;

  // Filter transactions by type and search
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((tx) => {
        const desc = (tx.description ?? "").toLowerCase();
        const comment = (tx.comment ?? "").toLowerCase();
        const bankName = (tx.bank?.name ?? "").toLowerCase();
        const budgetName = (tx.budget?.name ?? "").toLowerCase();
        const cardLabel = [
          CARD_KINDS.find((k) => k.value === tx.card?.card_kind)?.label,
          CARD_TYPES.find((t) => t.value === tx.card?.card_type)?.label,
          tx.card?.bank?.name,
          tx.card?.last4,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const amountStr = tx.amount.toString();
        return (
          desc.includes(q) ||
          comment.includes(q) ||
          bankName.includes(q) ||
          budgetName.includes(q) ||
          cardLabel.includes(q) ||
          amountStr.includes(q)
        );
      });
    }
    // When deep-linking to a transaction, ensure it's visible even if filtered out
    if (txId && !result.some((t) => t.id === txId)) {
      const targetTx = transactions.find((t) => t.id === txId);
      if (targetTx) {
        result = [...result, targetTx].sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        );
      }
    }
    return result;
  }, [transactions, typeFilter, searchQuery, txId]);

  // Helper to parse date correctly for Ecuador timezone
  const parseDate = (date: string | Date): Date => {
    if (typeof date === "string") {
      const utcDate = parseISO(date);
      return getEcuadorDate(utcDate);
    }
    return getEcuadorDate(date);
  };

  // Group transactions by date
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  // When landing with transactionId: ensure list view, scroll to tx, open sheet
  useEffect(() => {
    if (!txId) return;
    setViewMode("list");
    hasScrolledToTx.current = false;
  }, [txId]);

  useEffect(() => {
    if (!txId || loading || hasScrolledToTx.current) return;
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;
    hasScrolledToTx.current = true;
    setEditingTx(targetTx);
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-transaction-id="${txId}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [txId, loading, transactions]);

  // Chart data
  const chartData = useMemo(() => {
    const year = format(selectedMonth, "yyyy");
    const month = format(selectedMonth, "MM");
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month}-${day.toString().padStart(2, "0")}`;
      const dayTransactions = filteredTransactions.filter((tx) => {
        const ecuadorDate = parseDate(tx.occurred_at);
        return format(ecuadorDate, "yyyy-MM-dd") === dateStr;
      });

      data.push({
        day: day.toString(),
        date: dateStr,
        expenses: dayTransactions
          .filter((tx) => tx.type === "expense")
          .reduce((sum, tx) => sum + tx.amount, 0),
        income: dayTransactions
          .filter((tx) => tx.type === "income")
          .reduce((sum, tx) => sum + tx.amount, 0),
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
  const [mergeConfirmIds, setMergeConfirmIds] = useState<
    [number, number] | null
  >(null);
  const [subDefaults, setSubDefaults] = useState<Partial<SubscriptionFormData> | null>(null);

  const handleCreateSubscription = (tx: TransactionWithRelations) => {
    const ecuadorDate = getEcuadorDate(parseISO(tx.occurred_at));
    setSubDefaults({
      name: tx.description,
      amount: tx.amount,
      billing_day: ecuadorDate.getDate(),
      billing_cycle: "monthly",
      card_id: tx.card_id || "",
      budget_id: tx.budget_id || "",
    });
  };

  const handleRowClick = (tx: TransactionWithRelations) => {
    setEditingTx(tx);
  };

  const handleQuickUpdate = async (
    id: number,
    data: Record<string, string | null>,
  ) => {
    await updateTransaction.mutateAsync({ id, data });
  };

  const handleMergePair = (ids: [number, number]) => {
    setMergeConfirmIds(ids);
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
    searchInput.trim() !== "" ||
    cardFilter !== "__all__" ||
    bankFilter !== "__all__" ||
    budgetFilter !== "__all__";

  const activeFilterCount = [
    searchInput.trim() !== "",
    cardFilter !== "__all__",
    bankFilter !== "__all__",
    budgetFilter !== "__all__",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setCardFilter("__all__");
    setBankFilter("__all__");
    setBudgetFilter("__all__");
  };

  const currentMonth = format(selectedMonth, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Transacciones
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {currentMonth}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching || loading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-1.5", isRefetching && "animate-spin")}
            />
            Refresh
          </Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="transactions/from-image">
                  <Images className="h-4 w-4 mr-1.5" />
                  Extract with AI
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <ArrowDownRight className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Gastos</p>
            {loading ? (
              <Skeleton className="h-9 w-32 bg-white/20 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
                {fmt(totalExpenses)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {expenseCount} transaccion{expenseCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <ArrowUpRight className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Ingresos</p>
            {loading ? (
              <Skeleton className="h-9 w-32 bg-white/20 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
                {fmt(totalIncomes)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {incomeCount} transaccion{incomeCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 text-white shadow-lg",
            balance >= 0
              ? "bg-gradient-to-br from-blue-500 to-blue-600"
              : "bg-gradient-to-br from-orange-500 to-orange-600",
          )}
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
                {balance >= 0 ? "+" : "-"}{fmt(Math.abs(balance))}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {transactions.length} transaccion{transactions.length !== 1 ? "es" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar transacciones..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Filters row: on desktop = type tabs + selects (left) | view mode (right) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {/* Type Filter (Todas, Gastos, Ingresos) + View Mode on same row on mobile */}
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Tabs
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="all" className="gap-1.5 text-xs px-2 sm:px-3">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Todas
                </TabsTrigger>
                <TabsTrigger value="expense" className="gap-1.5 text-xs px-2 sm:px-3">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Gastos
                </TabsTrigger>
                <TabsTrigger value="income" className="gap-1.5 text-xs px-2 sm:px-3">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Ingresos
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "list" | "chart")}
              className="sm:hidden"
            >
              <TabsList className="h-8 shrink-0">
                <TabsTrigger value="list" className="gap-1 text-xs px-2">
                  <List className="h-3.5 w-3.5" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="chart" className="gap-1 text-xs px-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Gráfico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-px bg-border sm:hidden" />

          {/* Filter dropdowns - full width on mobile, inline on desktop */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Filtros</span>
            </div>

            {/* Card Filter */}
            <Select value={cardFilter} onValueChange={setCardFilter}>
              <SelectTrigger
                className={cn(
                  "w-full sm:w-auto sm:min-w-[140px] sm:shrink-0",
                  cardFilter !== "__all__" && "bg-primary/10 border-primary/30",
                )}
              >
                <SelectValue placeholder="Tarjeta" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las tarjetas</SelectItem>
              {cards.map((card) => {
              const kindLabel = CARD_KINDS.find((k) => k.value === card.card_kind)?.label ?? null;
              const typeLabel = CARD_TYPES.find((t) => t.value === card.card_type)?.label ?? null;
              const cardLabel = [kindLabel, typeLabel, card.bank?.name ?? null, card.last4 ?? null]
                .filter(Boolean)
                .join(" ");
                return (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center gap-2">
                      {card.bank?.image ? (
                        <Image
                          src={card.bank.image}
                          alt={card.bank.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 shrink-0 rounded object-contain"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span>{cardLabel || card.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

            {/* Bank Filter */}
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger
                className={cn(
                  "w-full sm:w-auto sm:min-w-[140px] sm:shrink-0",
                  bankFilter !== "__all__" && "bg-primary/10 border-primary/30",
                )}
              >
                <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent>
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

            {/* Budget Filter - hidden when scoped to a single budget (key) */}
            {!budgetId && (
              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger
                  className={cn(
                    "w-full sm:w-auto sm:min-w-[140px] sm:shrink-0",
                    budgetFilter !== "__all__" && "bg-primary/10 border-primary/30",
                  )}
                >
                  <SelectValue placeholder="Presupuesto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los presupuestos</SelectItem>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    <BudgetLabel
                      budget={budget}
                      iconClassName="h-3.5 w-3.5 shrink-0"
                    />
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 w-fit"
              >
                <X className="h-3 w-3" />
                Limpiar ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* View Mode (Lista / Gráfico) - right on desktop, hidden on mobile (shown above) */}
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "list" | "chart")}
          className="hidden sm:block"
        >
          <TabsList className="h-8 shrink-0">
            <TabsTrigger value="list" className="gap-1.5 text-xs px-3">
              <List className="h-3.5 w-3.5" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-1.5 text-xs px-3">
              <BarChart3 className="h-3.5 w-3.5" />
              Gráfico
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <Card className="overflow-hidden py-0 gap-0">
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
                  ? "Sin resultados"
                  : "Sin transacciones"
              }
              description={
                hasActiveFilters || typeFilter !== "all"
                  ? "Intenta ajustar los filtros para ver mas resultados."
                  : "Las transacciones de este mes apareceran aqui."
              }
            />
          ) : viewMode === "list" ? (
            <div>
              {groupedTransactions.map(([dateKey, txs], groupIndex) => {
                const dayTotal = txs
                  .filter((tx) => tx.type === "expense")
                  .reduce((s, tx) => s + tx.amount, 0);
                const mergePairsMap = findExpenseReimbursementPairs(
                  txs,
                  dateKey,
                );
                return (
                  <div key={dateKey}>
                    <div className={cn("sticky top-0 z-10 bg-muted/60 backdrop-blur-sm px-4 py-2 border-b flex items-center justify-between", groupIndex > 0 && "border-t")}>
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
                          highlighted={tx.id === txId}
                          mergePair={mergePairsMap.get(tx.id)}
                          onMerge={
                            canEdit ? handleMergePair : undefined
                          }
                          onCreateSubscription={
                            canEdit ? handleCreateSubscription : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Chart View */
            <div className="space-y-6 p-4">
              {/* Expenses Chart */}
              <div>
                <div className="px-2 pb-3">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Gastos diarios
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <ChartContainer
                  config={{
                    expenses: {
                      label: "Gastos",
                      color: "hsl(0 84% 60%)",
                    },
                  }}
                  className="h-[250px] w-full"
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
                          return (
                            <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                              <p className="text-xs font-medium text-muted-foreground">
                                Dia {label} ·{" "}
                                {format(selectedMonth, "MMMM", {
                                  locale: es,
                                })}
                              </p>
                              <p className="mt-1 text-base font-semibold text-red-600 dark:text-red-400">
                                {formatChartCurrency(data.expenses)}
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

              <div className="h-px bg-border" />

              {/* Income Chart */}
              <div>
                <div className="px-2 pb-3">
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Ingresos diarios
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <ChartContainer
                  config={{
                    income: {
                      label: "Ingresos",
                      color: "hsl(160 84% 39%)",
                    },
                  }}
                  className="h-[250px] w-full"
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
                          return (
                            <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg">
                              <p className="text-xs font-medium text-muted-foreground">
                                Dia {label} ·{" "}
                                {format(selectedMonth, "MMMM", {
                                  locale: es,
                                })}
                              </p>
                              <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatChartCurrency(data.income)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit/Delete */}
      {canEdit && (
        <>
          <CreateTransactionSheet
            open={createOpen}
            onOpenChange={setCreateOpen}
            cards={cards}
            banks={banks}
            budgets={budgets}
          />

          <EditTransactionSheet
            transaction={editingTx}
            onClose={() => {
              setEditingTx(null);
              if (txId) {
                router.replace(pathname);
              }
            }}
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

          <MergeConfirmDialog
            mergeIds={mergeConfirmIds}
            onClose={() => setMergeConfirmIds(null)}
          />

          <CreateSubscriptionDialog
            open={!!subDefaults}
            onOpenChange={(open) => {
              if (!open) setSubDefaults(null);
            }}
            defaultValues={subDefaults ?? undefined}
          />
        </>
      )}
    </div>
  );
}
