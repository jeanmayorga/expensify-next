"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBudgets } from "./hooks";
import { useTransactions } from "../transactions/hooks";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMonth } from "@/lib/month-context";
import { Wallet, Plus } from "lucide-react";
import {
  BudgetCard,
  BudgetCardSkeleton,
  formatBudgetCurrency,
} from "./components/BudgetCard";
import { CreateBudgetDialog } from "./components/CreateBudgetDialog";
import { EditBudgetModal } from "./components/EditBudgetModal";
import { DeleteBudgetDialog } from "./components/DeleteBudgetDialog";
import type { Budget } from "./service";

export default function BudgetsPage() {
  const router = useRouter();
  const { selectedMonth } = useMonth();
  const { budgetId } = useAuth();
  const canEdit = useCanEdit();
  const { data: budgets = [], isLoading } = useBudgets();

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
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetSpending.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverBudget = totalSpent > totalBudget;
  const statusBg = isOverBudget
    ? "from-red-500 to-red-600"
    : totalPercentage > 80
      ? "from-orange-500 to-orange-600"
      : "from-emerald-500 to-emerald-600";
  const loading = isLoading || loadingTx;

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
            <Button onClick={() => setIsCreating(true)} size="sm">
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
                <div className="flex items-baseline gap-1 flex-wrap mt-1">
                  <span className="text-2xl font-bold tracking-tight">
                    {formatBudgetCurrency(totalSpent)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatBudgetCurrency(totalBudget)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {filteredBudgets.length} presupuesto{filteredBudgets.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm font-semibold mt-0.5">
                  {totalPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Progress
                value={Math.min(totalPercentage, 100)}
                className="h-2.5"
                indicatorClassName={cn("bg-gradient-to-r", statusBg)}
              />
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
            <Button onClick={() => setIsCreating(true)} size="sm">
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
              onEdit={canEdit ? (b) => setEditingBudget(b) : undefined}
              onDelete={canEdit ? (b) => setDeletingBudget(b) : undefined}
            />
          ))}
        </div>
      )}

      {/* Create Budget Dialog */}
      {canEdit && (
        <CreateBudgetDialog
          open={isCreating}
          onOpenChange={setIsCreating}
        />
      )}

      {/* Edit Budget Modal */}
      {canEdit && (
        <EditBudgetModal
          budget={editingBudget}
          open={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          onSuccess={() => setEditingBudget(null)}
          onDeleted={() => setEditingBudget(null)}
        />
      )}

      {/* Delete Budget Dialog */}
      {canEdit && (
        <DeleteBudgetDialog
          budget={deletingBudget}
          onClose={() => setDeletingBudget(null)}
          onDeleted={() => setDeletingBudget(null)}
        />
      )}
    </div>
  );
}
