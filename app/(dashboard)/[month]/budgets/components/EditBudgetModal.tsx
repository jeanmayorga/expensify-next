"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateBudget, useDeleteBudget } from "../hooks";
import type { Budget } from "../service";
import { formatBudgetCurrency } from "./BudgetCard";
import { getBudgetIconComponent } from "./BudgetIconPicker";
import { BudgetIconPicker } from "./BudgetIconPicker";

export interface BudgetFormData {
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

type EditBudgetModalProps = {
  budget: Budget | null;
  open: boolean;
  onClose: () => void;
  /** Called after successful update (modal will close) */
  onSuccess?: () => void;
  /** Called after successful delete (caller should e.g. redirect to list) */
  onDeleted?: () => void;
};

export function EditBudgetModal({
  budget,
  open,
  onClose,
  onSuccess,
  onDeleted,
}: EditBudgetModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const form = useForm<BudgetFormData>({
    defaultValues: defaultFormValues,
  });
  const { register, watch, reset, handleSubmit, formState, setValue } = form;
  const amount = watch("amount");
  const icon = watch("icon");
  const amountNum = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;

  useEffect(() => {
    if (open && budget) {
      reset(budgetToForm(budget));
      setShowDeleteConfirm(false);
    }
  }, [open, budget, reset]);

  const onSubmit = async (data: BudgetFormData) => {
    if (!budget) return;
    await updateBudget.mutateAsync({
      id: budget.id,
      data: {
        name: data.name.trim(),
        amount: Number(data.amount),
        icon: data.icon || null,
      },
    });
    onSuccess?.();
    onClose();
  };

  const handleDelete = async () => {
    if (!budget) return;
    await deleteBudget.mutateAsync(budget.id);
    setShowDeleteConfirm(false);
    onDeleted?.();
    onClose();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
    }
  };

  if (!budget) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                {(() => {
                  const Icon = getBudgetIconComponent(budget.icon);
                  return <Icon className="h-4 w-4 text-muted-foreground" />;
                })()}
              </div>
              Editar presupuesto
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="edit-budget-form"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                {...register("name", { required: "El nombre es obligatorio" })}
                placeholder="Ej. Comida mensual"
                autoFocus
              />
              {formState.errors.name && (
                <p className="text-xs text-destructive">
                  {formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("amount", {
                    required: "El monto es obligatorio",
                    valueAsNumber: true,
                    min: { value: 0, message: "El monto debe ser mayor o igual a 0" },
                    validate: (v) =>
                      !Number.isNaN(v) || "Ingresa un monto válido",
                  })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
              {formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {formState.errors.amount.message}
                </p>
              )}
            </div>

            <BudgetIconPicker
              value={icon}
              onChange={(v) => setValue("icon", v)}
            />

            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Vista previa
              </p>
              <p className="text-lg font-semibold">
                {formatBudgetCurrency(amountNum, budget.currency)}
              </p>
            </div>
          </form>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={updateBudget.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="edit-budget-form"
                disabled={
                  updateBudget.isPending ||
                  !watch("name")?.trim() ||
                  Number.isNaN(amountNum) ||
                  amountNum < 0
                }
              >
                {updateBudget.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm" showCloseButton={true}>
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
    </>
  );
}
