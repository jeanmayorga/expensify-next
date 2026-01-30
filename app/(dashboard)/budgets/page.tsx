"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "./hooks";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Plus, Trash2 } from "lucide-react";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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

function budgetToForm(budget: Budget): BudgetFormData {
  return {
    name: budget.name,
    amount: budget.amount,
  };
}

function BudgetCard({
  budget,
  onClick,
}: {
  budget: Budget;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{budget.name}</h3>
              <p className="text-xs text-muted-foreground">Monthly budget</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(budget.amount, budget.currency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <Skeleton className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetsPage() {
  const { data: budgets = [], isLoading } = useBudgets();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<BudgetFormData>({ defaultValues: defaultFormValues });
  const { register, watch, reset, handleSubmit } = form;
  const amount = watch("amount") || 0;

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

  useEffect(() => {
    if (editingBudget) {
      reset(budgetToForm(editingBudget));
    }
  }, [editingBudget, reset]);

  const onCreateSubmit = async (data: BudgetFormData) => {
    await createBudget.mutateAsync({
      name: data.name,
      amount: data.amount,
    });
    setIsCreating(false);
    reset(defaultFormValues);
  };

  const onEditSubmit = async (data: BudgetFormData) => {
    if (!editingBudget) return;
    await updateBudget.mutateAsync({
      id: editingBudget.id,
      data: {
        name: data.name,
        amount: data.amount,
      },
    });
    setEditingBudget(null);
    reset(defaultFormValues);
  };

  const handleDelete = async () => {
    if (!editingBudget) return;
    await deleteBudget.mutateAsync(editingBudget.id);
    setShowDeleteConfirm(false);
    setEditingBudget(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set spending limits and track your expenses
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold tracking-tight mt-1">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {budgets.length} budget{budgets.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets Grid */}
      {isLoading ? (
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
          <p className="text-muted-foreground mb-4">No budgets yet</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add budget
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onClick={() => setEditingBudget(budget)}
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

      {/* Edit Sheet */}
      <Sheet
        open={!!editingBudget && !showDeleteConfirm}
        onOpenChange={() => setEditingBudget(null)}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Budget</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit(onEditSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <FormFields />
            </div>
            <SheetFooter className="flex-col sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingBudget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateBudget.isPending || !watch("name")}
              >
                {updateBudget.isPending ? "Saving..." : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {editingBudget?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
