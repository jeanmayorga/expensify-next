"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useTransactionsForMonth } from "./transactions/hooks";
import { useMonthInUrl } from "@/lib/use-month-url";
import { useCategories } from "./categories/hooks";
import { useBudgets } from "./budgets/hooks";
import { useBanks } from "./banks/hooks";
import { useCards } from "./cards/hooks";
import { type Category } from "./categories/service";
import { type Budget } from "./budgets/service";
import { type Bank } from "./banks/service";
import { type CardWithBank } from "./cards/service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionRow,
  TransactionRowSkeleton,
} from "./transactions/components";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowRight,
  CreditCard,
  Building2,
  Plus,
  Tag,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Wifi,
  Phone,
  Tv,
  Music,
  Gamepad2,
  Dumbbell,
  Heart,
  Pill,
  GraduationCap,
  Briefcase,
  Plane,
  Bus,
  Fuel,
  ParkingCircle,
  ShoppingBag,
  Shirt,
  Scissors,
  Gift,
  Baby,
  PawPrint,
  Coffee,
  Beer,
  Pizza,
  IceCream,
  Cake,
  Apple,
  Salad,
  Sandwich,
  Popcorn,
  UtensilsCrossed,
  Banknote,
  PiggyBank,
  Receipt,
  Landmark,
  HandCoins,
  Coins,
  DollarSign,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Tag,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Wifi,
  Phone,
  Tv,
  Music,
  Gamepad2,
  Dumbbell,
  Heart,
  Pill,
  GraduationCap,
  Briefcase,
  Plane,
  Bus,
  Fuel,
  ParkingCircle,
  ShoppingBag,
  Shirt,
  Scissors,
  Gift,
  Baby,
  PawPrint,
  Coffee,
  Beer,
  Pizza,
  IceCream,
  Cake,
  Apple,
  Salad,
  Sandwich,
  Popcorn,
  UtensilsCrossed,
  Banknote,
  Wallet,
  PiggyBank,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Landmark,
  HandCoins,
  Coins,
  DollarSign,
  CircleDollarSign,
};

function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName) return Tag;
  return CATEGORY_ICONS[iconName] ?? Tag;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function HomePage() {
  const [selectedMonth] = useMonthInUrl();

  const { data: transactions = [], isLoading: loadingTx } =
    useTransactionsForMonth(selectedMonth);
  const { data: categories = [], isLoading: loadingCat } = useCategories();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: cards = [], isLoading: loadingCards } = useCards();

  const loading =
    loadingTx || loadingCat || loadingBudgets || loadingBanks || loadingCards;

  // Calculate stats
  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpenses;

  const expenseCount = transactions.filter(
    (tx) => tx.type === "expense",
  ).length;
  const incomeCount = transactions.filter((tx) => tx.type === "income").length;

  // Get recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
      )
      .slice(0, 10);
  }, [transactions]);

  // Group recent transactions by date
  const groupedRecentTransactions = useMemo(() => {
    const groups: Record<string, typeof recentTransactions> = {};
    recentTransactions.forEach((tx) => {
      const dateKey = format(new Date(tx.occurred_at), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [recentTransactions]);

  // Budget spending calculation
  const budgetSpending = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter((tx) => tx.type === "expense" && tx.budget_id === budget.id)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        budget,
        spent,
        remaining: budget.amount - spent,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > budget.amount,
      };
    });
  }, [budgets, transactions]);

  // Category spending
  const categorySpending = useMemo(() => {
    const spending: Record<
      string,
      { category: Category; total: number; count: number }
    > = {};
    transactions
      .filter((tx) => tx.type === "expense" && tx.category)
      .forEach((tx) => {
        const catId = tx.category_id!;
        if (!spending[catId]) {
          spending[catId] = { category: tx.category!, total: 0, count: 0 };
        }
        spending[catId].total += Math.abs(tx.amount);
        spending[catId].count++;
      });
    return Object.values(spending).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Bank spending
  const bankSpending = useMemo(() => {
    const spending: Record<
      string,
      { bank: Bank; total: number; count: number }
    > = {};
    transactions
      .filter((tx) => tx.type === "expense" && tx.bank)
      .forEach((tx) => {
        const bankId = tx.bank_id!;
        if (!spending[bankId]) {
          spending[bankId] = { bank: tx.bank!, total: 0, count: 0 };
        }
        spending[bankId].total += Math.abs(tx.amount);
        spending[bankId].count++;
      });
    return Object.values(spending).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Card spending
  const cardSpending = useMemo(() => {
    const spending: Record<
      string,
      { card: CardWithBank; total: number; count: number }
    > = {};
    transactions
      .filter((tx) => tx.type === "expense" && tx.card)
      .forEach((tx) => {
        const cardId = tx.card_id!;
        if (!spending[cardId]) {
          spending[cardId] = { card: tx.card!, total: 0, count: 0 };
        }
        spending[cardId].total += Math.abs(tx.amount);
        spending[cardId].count++;
      });
    return Object.values(spending).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const currentMonth = format(selectedMonth, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground capitalize truncate">
            Resumen de {currentMonth}
          </p>
        </div>
      </div>

      {/* Summary Cards: Gastos → Ingresos → Balance (igual que Transacciones) */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Gastos */}
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
                {formatCurrency(totalExpenses)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {expenseCount} transacción{expenseCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Total Ingresos */}
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
                {formatCurrency(totalIncome)}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {incomeCount} transacción{incomeCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Balance */}
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
                {formatCurrency(Math.abs(balance))}
              </p>
            )}
            <p className="text-xs text-white/70 mt-2">
              {transactions.length} transacción
              {transactions.length !== 1 ? "es" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions - Full Width */}
        <Card className="lg:col-span-2 py-0 gap-0 overflow-hidden">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 border-b bg-muted/40">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">
                Últimas Transacciones
              </CardTitle>
              <CardDescription className="text-xs">
                Las 10 más recientes
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/transactions">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TransactionRowSkeleton key={i} />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay transacciones este mes
              </p>
            ) : (
              <div>
                {groupedRecentTransactions.map(([dateKey, txs]) => (
                  <div key={dateKey}>
                    <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-y">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {format(parseISO(dateKey), "EEEE, d 'de' MMMM", {
                          locale: es,
                        })}
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
                          onDelete={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budgets Progress - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">
                Presupuestos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Seguimiento de gastos del mes
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/budgets">
                Gestionar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <Skeleton className="h-5 w-24 mb-3" />
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">No hay presupuestos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea presupuestos para controlar tus gastos
                </p>
                <Button variant="default" size="sm" asChild>
                  <Link href="/budgets">
                    <Plus className="h-4 w-4 mr-1" />
                    Crear presupuesto
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {budgetSpending.map(
                  ({ budget, spent, remaining, percentage, isOverBudget }) => {
                    const statusColor = isOverBudget
                      ? "red"
                      : percentage > 80
                        ? "orange"
                        : "emerald";
                    const statusBg = isOverBudget
                      ? "from-red-500 to-red-600"
                      : percentage > 80
                        ? "from-orange-500 to-orange-600"
                        : "from-emerald-500 to-emerald-600";

                    return (
                      <Link
                        key={budget.id}
                        href={`/budgets/${budget.id}?month=${format(selectedMonth, "yyyy-MM")}`}
                        className="relative block p-4 rounded-xl border hover:shadow-md transition-all overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        {/* Background accent */}
                        <div
                          className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${statusBg}`}
                        />

                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                                isOverBudget
                                  ? "bg-red-100 dark:bg-red-900/30"
                                  : percentage > 80
                                    ? "bg-orange-100 dark:bg-orange-900/30"
                                    : "bg-emerald-100 dark:bg-emerald-900/30"
                              }`}
                            >
                              <Wallet
                                className={`h-4 w-4 ${
                                  isOverBudget
                                    ? "text-red-600"
                                    : percentage > 80
                                      ? "text-orange-600"
                                      : "text-emerald-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {budget.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {budget.currency}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              isOverBudget
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                                : percentage > 80
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
                            }`}
                          >
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Amounts */}
                        <div className="mb-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                              {formatCurrency(spent)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              / {formatCurrency(budget.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <Progress
                            value={Math.min(percentage, 100)}
                            className="h-2.5"
                            indicatorClassName={`bg-gradient-to-r ${statusBg}`}
                          />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {isOverBudget ? "Excedido por" : "Disponible"}
                          </span>
                          <span
                            className={`font-semibold ${
                              isOverBudget ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {isOverBudget && "-"}
                            {formatCurrency(Math.abs(remaining))}
                          </span>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Spending - Horizontal Bars */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">
                Por Categoría
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribución de gastos
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/categories">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : categorySpending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin datos
              </p>
            ) : (
              <div className="space-y-3">
                {categorySpending.slice(0, 6).map(({ category, total }) => {
                  const percentage =
                    totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Link
                      key={category.id}
                      href={`/categories/${category.id}?month=${format(selectedMonth, "yyyy-MM")}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <IconComponent
                            className="h-4 w-4 shrink-0"
                            style={{ color: category.color || "#6b7280" }}
                          />
                          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {category.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0 ml-2">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all group-hover:opacity-80"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color || "#6366f1",
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

        {/* Bank Spending - Horizontal Bars */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">
                Por Banco
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribución de gastos
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/banks">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : bankSpending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin datos
              </p>
            ) : (
              <div className="space-y-3">
                {bankSpending.map(({ bank, total }) => {
                  const percentage =
                    totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  return (
                    <Link
                      key={bank.id}
                      href={`/banks/${bank.id}?month=${format(selectedMonth, "yyyy-MM")}`}
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
                          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {bank.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0 ml-2">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all group-hover:opacity-80"
                          style={{
                            width: `${percentage}%`,
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

        {/* Card Spending - Horizontal Bars */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">
                Por Tarjeta
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribución de gastos
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/cards">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : cardSpending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin datos
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {cardSpending.map(({ card, total }) => {
                  const percentage =
                    totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  return (
                    <div key={card.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <CreditCard
                            className="h-4 w-4 shrink-0"
                            style={{ color: card.color || "#6366f1" }}
                          />
                          <span className="text-sm font-medium truncate">
                            {card.name}
                            {card.last4 && (
                              <span className="text-muted-foreground ml-1">
                                •{card.last4}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0 ml-2">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: card.color || "#6366f1",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
