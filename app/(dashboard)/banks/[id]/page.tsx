"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  Building2,
  Edit,
  RefreshCw,
  Mail,
  CreditCard,
} from "lucide-react";
import { useBank } from "../hooks";
import {
  useTransactions,
  useUpdateTransaction,
} from "../../transactions/hooks";
import { useCategories } from "../../categories/hooks";
import { useCards } from "../../cards/hooks";
import { useBanks } from "../hooks";
import { useBudgets } from "../../budgets/hooks";
import { type TransactionWithRelations } from "../../transactions/service";
import { useMonthInUrl } from "@/lib/use-month-url";
import { Button } from "@/components/ui/button";
import { Card as CardUI, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  EditTransactionSheet,
  DeleteTransactionDialog,
} from "../../transactions/components";

const DARK_TEXT_COLOR = "#0f265c";

export default function BankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = params.id as string;

  const [selectedMonth] = useMonthInUrl();

  const { data: bank, isLoading: loadingBank } = useBank(bankId);

  const filters = {
    date: format(selectedMonth, "yyyy-MM"),
    bank_id: bankId,
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
    loadingBank ||
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

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncomes = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncomes - totalExpenses;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const incomeCount = transactions.filter((t) => t.type === "income").length;

  const bankCards = useMemo(
    () => cards.filter((c) => c.bank_id === bankId),
    [cards, bankId],
  );

  if (loadingBank) {
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

  if (!bank) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Banco no encontrado
        </div>
      </div>
    );
  }

  const bankColor = bank.color || "#2563eb";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/banks")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(135deg, ${bankColor} 0%, ${bankColor}dd 100%)`,
              color: "white",
            }}
          >
            {bank.image ? (
              <Image
                src={bank.image}
                alt={bank.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
              {bank.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Transacciones de este banco
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/banks/${bank.id}/edit`)}
          >
            <Edit className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${bankColor} 0%, ${bankColor}dd 50%, ${bankColor}aa 100%)`,
          color: "white",
        }}
      >
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: DARK_TEXT_COLOR }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          {bank.emails && bank.emails.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm opacity-90">
              <Mail className="h-4 w-4" />
              <span>{bank.emails.length} email(s) configurado(s)</span>
            </div>
          )}
          {bankCards.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm opacity-90">
              <CreditCard className="h-4 w-4" />
              <span>{bankCards.length} tarjeta(s)</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
              description="No hay transacciones de este banco para el mes seleccionado."
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
