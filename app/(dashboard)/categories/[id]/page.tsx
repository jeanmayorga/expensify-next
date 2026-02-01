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
  CreditCard,
  Building2,
  Landmark,
  HandCoins,
  Coins,
  DollarSign,
  CircleDollarSign,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useCategory } from "../hooks";
import { useTransactions, useUpdateTransaction } from "../../transactions/hooks";
import { useCategories } from "../hooks";
import { useCards } from "../../cards/hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../../budgets/hooks";
import { type TransactionWithRelations } from "../../transactions/service";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import { Card as CardUI, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  EditTransactionSheet,
  DeleteTransactionDialog,
  TransactionSheet,
} from "../../transactions/components";

// Icon mapping (same as in page.tsx)
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

const DARK_TEXT_COLOR = "#0f265c";

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch category details
  const { data: category, isLoading: loadingCategory } =
    useCategory(categoryId);

  // Fetch transactions for this category and month
  const filters = {
    date: format(selectedMonth, "yyyy-MM"),
    category_id: categoryId,
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
    loadingCategory ||
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
  const [selectedTx, setSelectedTx] = useState<TransactionWithRelations | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const handleRowClick = (tx: TransactionWithRelations) => {
    setSelectedTx(tx);
    setDetailOpen(true);
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
  if (loadingCategory) {
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

  if (!category) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Categoría no encontrada
        </div>
      </div>
    );
  }

  const categoryColor = category.color || "#6366f1";
  const useDarkText = isLightColor(categoryColor);
  const IconComponent = getIconComponent(category.icon);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/categories")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
              color: useDarkText ? DARK_TEXT_COLOR : "white",
            }}
          >
            <IconComponent className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Transacciones de esta categoría
            </p>
          </div>
        </div>
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
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
            <p className="text-3xl font-bold tracking-tight mt-1">
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
            <p className="text-3xl font-bold tracking-tight mt-1">
              {balance >= 0 ? "+" : "-"}${Math.abs(balance).toFixed(2)}
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
              description="No hay transacciones en esta categoría para el mes seleccionado."
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

      {/* Transaction Detail Sheet */}
      <TransactionSheet
        transaction={selectedTx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(tx) => {
          setDetailOpen(false);
          setEditingTx(tx);
        }}
        onDelete={(tx) => {
          setDetailOpen(false);
          setDeletingTx(tx);
        }}
      />
    </div>
  );
}
