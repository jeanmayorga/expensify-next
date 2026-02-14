"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateBudget } from "../hooks";
import { formatBudgetCurrency } from "./BudgetCard";
import { getBudgetIconComponent } from "./BudgetIconPicker";
import { BudgetIconPicker } from "./BudgetIconPicker";

export interface CreateBudgetFormData {
  name: string;
  amount: number;
  icon: string | null;
}

const defaultFormValues: CreateBudgetFormData = {
  name: "",
  amount: 0,
  icon: null,
};

type CreateBudgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateBudgetDialog({
  open,
  onOpenChange,
}: CreateBudgetDialogProps) {
  const createBudget = useCreateBudget();

  const form = useForm<CreateBudgetFormData>({
    defaultValues: defaultFormValues,
  });
  const { register, reset, handleSubmit, watch, setValue } = form;
  const name = watch("name");
  const amount = watch("amount");
  const icon = watch("icon");
  const amountNum = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;

  useEffect(() => {
    if (open) {
      reset(defaultFormValues);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateBudgetFormData) => {
    await createBudget.mutateAsync({
      name: data.name.trim(),
      amount: Number(data.amount),
      icon: data.icon || null,
    });
    onOpenChange(false);
    reset(defaultFormValues);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset(defaultFormValues);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="create-budget-name" className="text-sm font-medium">
                Nombre *
              </label>
              <Input
                id="create-budget-name"
                {...register("name", { required: true })}
                placeholder="Ej: Comida, Transporte..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-budget-amount" className="text-sm font-medium">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="create-budget-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amount", {
                    valueAsNumber: true,
                    min: 0,
                  })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <BudgetIconPicker
              value={icon}
              onChange={(v) => setValue("icon", v)}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vista previa</label>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      {(() => {
                        const Icon = getBudgetIconComponent(icon);
                        return <Icon className="h-4 w-4 text-muted-foreground" />;
                      })()}
                    </div>
                    <span className="font-medium">
                      {name?.trim() || "Nombre del presupuesto"}
                    </span>
                  </div>
                  <p className="text-xl font-bold">
                    {formatBudgetCurrency(amountNum)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createBudget.isPending || !name?.trim()}
            >
              {createBudget.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
