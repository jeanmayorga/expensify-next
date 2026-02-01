"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBudgets, useCreateBudget } from "./hooks";
import { useTransactions } from "../transactions/hooks";
import { type Budget } from "./service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMonth } from "@/lib/month-context";
import { Wallet, Plus } from "lucide-react";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface BudgetFormData {
  name: string;
  amount: number;
}

const defaultFormValues: BudgetFormData = {
  name: "",
  amount: 0,
};

type BudgetCardData = {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
};

function BudgetCard({
  data,
  onClick,
}: {
  data: BudgetCardData;
  onClick: () => void;
}) {
  const { budget, spent, remaining, percentage, isOverBudget } = data;
  const statusBg = isOverBudget
    ? "from-red-500 to-red-600"
    : percentage > 80
      ? "from-orange-500 to-orange-600"
      : "from-emerald-500 to-emerald-600";

  return (
    <Card
      className="relative cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 active:scale-[0.98] overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="relative p-4">
        {/* Barra de acento lateral */}
        <div
          className={`absolute top-0 left-0 w-1 h-full rounded-l-md bg-gradient-to-b ${statusBg}`}
        />

        {/* Header: icono + nombre + moneda + badge % */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
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
              <p className="font-semibold text-sm text-foreground">
                {budget.name}
              </p>
              <p className="text-xs text-muted-foreground">{budget.currency}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs shrink-0 ${
              isOverBudget
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : percentage > 80
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            }`}
          >
            {percentage.toFixed(0)}%
          </Badge>
        </div>

        {/* Gastado / Total */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(spent, budget.currency)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatCurrency(budget.amount, budget.currency)}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-2">
          <Progress
            value={Math.min(percentage, 100)}
            className="h-2.5"
            indicatorClassName={`bg-gradient-to-r ${statusBg}`}
          />
        </div>

        {/* Footer: Disponible / Excedido por + monto */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isOverBudget ? "Excedido por" : "Disponible"}
          </span>
          <span
            className={`font-semibold ${
              isOverBudget
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isOverBudget && "-"}
            {formatCurrency(Math.abs(remaining), budget.currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-5 w-10 rounded" />
        </div>
        <div className="mb-3">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="mb-2">
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetsPage() {
  const router = useRouter();
  const { selectedMonth } = useMonth();
  const { data: budgets = [], isLoading } = useBudgets();
  const createBudget = useCreateBudget();

  const filters = useMemo(
    () => ({
      date: format(selectedMonth, "yyyy-MM"),
      timezone: "America/Guayaquil",
    }),
    [selectedMonth],
  );
  const { data: transactions = [], isLoading: loadingTx } =
    useTransactions(filters);

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

  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<BudgetFormData>({ defaultValues: defaultFormValues });
  const { register, watch, reset, handleSubmit } = form;
  const amount = watch("amount") || 0;

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const loading = isLoading || loadingTx;

  const onCreateSubmit = async (data: BudgetFormData) => {
    await createBudget.mutateAsync({
      name: data.name,
      amount: data.amount,
    });
    setIsCreating(false);
    reset(defaultFormValues);
  };

  const openCreate = () => {
    reset(defaultFormValues);
    setIsCreating(true);
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name *</label>
        <Input {...register("name")} placeholder="Monthly Groceries" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Amount *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0.00"
            className="pl-7"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Preview</label>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">
                {watch("name") || "Budget Name"}
              </span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(amount)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            Toca un presupuesto para ver gastos y transacciones del mes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total presupuestado ·{" "}
                  {format(selectedMonth, "MMMM yyyy", { locale: es })}
                </p>
                <p className="text-2xl font-bold tracking-tight mt-1">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {budgets.length} presupuesto{budgets.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets Grid - Cards con gastado, barra y estado */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BudgetCardSkeleton key={i} />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No hay presupuestos</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar presupuesto
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetSpending.map((data) => (
            <BudgetCard
              key={data.budget.id}
              data={data}
              onClick={() => router.push(`budgets/${data.budget.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Budget</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit(onCreateSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <FormFields />
            </div>
            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBudget.isPending || !watch("name")}
              >
                {createBudget.isPending ? "Creating..." : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
