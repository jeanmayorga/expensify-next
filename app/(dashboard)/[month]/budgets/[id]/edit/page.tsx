"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useBudget, useUpdateBudget, useDeleteBudget } from "../../hooks";
import { useCanEdit } from "@/lib/auth-context";
import { type Budget } from "../../service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getBudgetIconComponent } from "../../components/BudgetIconPicker";
import { BudgetIconPicker } from "../../components/BudgetIconPicker";

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
  icon: string | null;
}

const defaultFormValues: BudgetFormData = {
  name: "",
  amount: 0,
  icon: null,
};

function budgetToForm(budget: Budget): BudgetFormData {
  return {
    name: budget.name,
    amount: budget.amount,
    icon: budget.icon ?? null,
  };
}

export default function EditBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const month = params.month as string;
  const budgetId = params.id as string;
  const canEdit = useCanEdit();
  const budgetsListPath = `/${month}/budgets`;

  // Redirect to list if user can't edit
  useEffect(() => {
    if (!canEdit) {
      router.replace(budgetsListPath);
    }
  }, [canEdit, router, budgetsListPath]);

  const { data: budget, isLoading } = useBudget(budgetId);

  // Don't render anything if user can't edit
  if (!canEdit) {
    return null;
  }
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<BudgetFormData>({ defaultValues: defaultFormValues });
  const { register, watch, reset, handleSubmit, setValue } = form;
  const amount = watch("amount") || 0;

  useEffect(() => {
    if (budget) {
      reset(budgetToForm(budget));
    }
  }, [budget, reset]);

  const onEditSubmit = async (data: BudgetFormData) => {
    if (!budget) return;
    await updateBudget.mutateAsync({
      id: budget.id,
      data: {
        name: data.name,
        amount: data.amount,
        icon: data.icon || null,
      },
    });
    router.push("..");
  };

  const handleDelete = async () => {
    if (!budget) return;
    await deleteBudget.mutateAsync(budget.id);
    setShowDeleteConfirm(false);
    router.push(budgetsListPath);
  };

  const handleCancel = () => {
    router.push(budgetsListPath);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(budgetsListPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a presupuestos
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Presupuesto no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(budgetsListPath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            {(() => {
              const Icon = getBudgetIconComponent(budget.icon);
              return <Icon className="h-6 w-6 text-muted-foreground" />;
            })()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Editar presupuesto
            </h1>
            <p className="text-sm text-muted-foreground">{budget.name}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre *</label>
              <Input {...register("name")} placeholder="Ej. Comida mensual" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monto *</label>
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

            <BudgetIconPicker
              value={watch("icon")}
              onChange={(v) => setValue("icon", v)}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vista previa</label>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      {(() => {
                        const Icon = getBudgetIconComponent(watch("icon"));
                        return <Icon className="h-4 w-4 text-muted-foreground" />;
                      })()}
                    </div>
                    <span className="font-medium">
                      {watch("name") || "Nombre del presupuesto"}
                    </span>
                  </div>
                  <p className="text-xl font-bold">
                    {formatCurrency(amount, budget.currency)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateBudget.isPending || !watch("name")}
              >
                {updateBudget.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar presupuesto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Estás seguro de que quieres eliminar{" "}
            <span className="font-medium text-foreground">{budget.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
