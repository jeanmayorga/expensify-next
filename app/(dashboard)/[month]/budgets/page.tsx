"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBudgets, useCreateBudget } from "./hooks";
import { useTransactions } from "../transactions/hooks";
import { type Budget } from "./service";
import { useAuth, useCanEdit } from "@/lib/auth-context";
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
import { useMonth } from "@/lib/month-context";
import { Wallet, Plus } from "lucide-react";
import {
  BudgetCard,
  BudgetCardSkeleton,
  formatBudgetCurrency,
} from "./components/BudgetCard";

interface BudgetFormData {
  name: string;
  amount: number;
}

const defaultFormValues: BudgetFormData = {
  name: "",
  amount: 0,
};

export default function BudgetsPage() {
  const router = useRouter();
  const { selectedMonth } = useMonth();
  const { budgetId } = useAuth();
  const canEdit = useCanEdit();
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

  // When budgetId is set (key / budget-scoped), only show that budget
  const filteredBudgets = useMemo(() => {
    if (budgetId) {
      return budgets.filter((b) => b.id === budgetId);
    }
    return budgets;
  }, [budgets, budgetId]);

  const budgetSpending = useMemo(() => {
    return filteredBudgets.map((budget) => {
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
  }, [filteredBudgets, transactions]);

  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<BudgetFormData>({ defaultValues: defaultFormValues });
  const { register, watch, reset, handleSubmit } = form;
  const amount = watch("amount") || 0;

  const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
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
            <p className="text-xl font-bold">{formatBudgetCurrency(amount)}</p>
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
            {canEdit ? "Toca un presupuesto para ver gastos y transacciones del mes" : "Tu presupuesto"}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredBudgets.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total presupuestado ·{" "}
                  {format(selectedMonth, "MMMM yyyy", { locale: es })}
                </p>
                <p className="text-2xl font-bold tracking-tight mt-1">
                  {formatBudgetCurrency(totalBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {filteredBudgets.length} presupuesto{filteredBudgets.length !== 1 ? "s" : ""}
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
      ) : filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No hay presupuestos</p>
          {canEdit && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar presupuesto
            </Button>
          )}
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

      {/* Create Sheet - only in edit mode */}
      {canEdit && (
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
      )}
    </div>
  );
}
