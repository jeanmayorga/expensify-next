"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCards } from "@/app/(dashboard)/[month]/cards/hooks";
import { useBanks } from "@/app/(dashboard)/[month]/banks/hooks";
import { useBudgets } from "@/app/(dashboard)/[month]/budgets/hooks";
import { CARD_TYPES, CARD_KINDS } from "@/app/(dashboard)/[month]/cards/utils";
import { useCreateSubscription, useUpdateSubscription } from "../hooks";
import type { SubscriptionWithRelations } from "../service";

export interface SubscriptionFormData {
  name: string;
  amount: number;
  billing_day: number;
  billing_cycle: string;
  card_id: string;
  budget_id: string;
  bank_id: string;
}

const defaultFormValues: SubscriptionFormData = {
  name: "",
  amount: 0,
  billing_day: 1,
  billing_cycle: "monthly",
  card_id: "",
  budget_id: "",
  bank_id: "",
};

function formatCardLabel(card: {
  name: string;
  last4: string | null;
  card_kind: string | null;
  card_type: string | null;
  bank?: { name: string } | null;
}) {
  const kindLabel =
    CARD_KINDS.find((k) => k.value === card.card_kind)?.label ?? null;
  const typeLabel =
    CARD_TYPES.find((t) => t.value === card.card_type)?.label ?? null;
  const parts = [
    kindLabel,
    typeLabel,
    card.bank?.name ?? null,
    card.last4 ?? null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : card.name;
}

interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<SubscriptionFormData>;
  editingSubscription?: SubscriptionWithRelations | null;
}

export function CreateSubscriptionDialog({
  open,
  onOpenChange,
  defaultValues,
  editingSubscription,
}: CreateSubscriptionDialogProps) {
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const { data: cards = [] } = useCards();
  const { data: banks = [] } = useBanks();
  const { data: budgets = [] } = useBudgets();

  const isEditing = !!editingSubscription;
  const isPending =
    createSubscription.isPending || updateSubscription.isPending;

  const form = useForm<SubscriptionFormData>({
    defaultValues: defaultFormValues,
  });
  const { register, reset, handleSubmit, watch, setValue } = form;
  const name = watch("name");

  useEffect(() => {
    if (open) {
      if (editingSubscription) {
        reset({
          name: editingSubscription.name,
          amount: editingSubscription.amount,
          billing_day: editingSubscription.billing_day,
          billing_cycle: editingSubscription.billing_cycle,
          card_id: editingSubscription.card_id || "",
          budget_id: editingSubscription.budget_id || "",
          bank_id: editingSubscription.bank_id || "",
        });
      } else {
        reset({ ...defaultFormValues, ...defaultValues });
      }
    }
  }, [open, reset, defaultValues, editingSubscription]);

  const onSubmit = async (data: SubscriptionFormData) => {
    const payload = {
      name: data.name.trim(),
      amount: Number(data.amount),
      billing_day: Number(data.billing_day),
      billing_cycle: data.billing_cycle,
      card_id: data.card_id || null,
      budget_id: data.budget_id || null,
      bank_id: data.bank_id || null,
    };

    if (isEditing) {
      await updateSubscription.mutateAsync({
        id: editingSubscription.id,
        data: payload,
      });
    } else {
      await createSubscription.mutateAsync(payload);
    }

    onOpenChange(false);
    reset(defaultFormValues);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(defaultFormValues);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar suscripción" : "Nueva suscripción"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="sub-name" className="text-sm font-medium">
              Nombre *
            </label>
            <Input
              id="sub-name"
              {...register("name", { required: true })}
              placeholder="Ej: Netflix, Spotify..."
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="sub-amount" className="text-sm font-medium">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0"
                {...register("amount", { valueAsNumber: true, min: 0 })}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          {/* Billing Day */}
          <div className="space-y-1.5">
            <label htmlFor="sub-billing-day" className="text-sm font-medium">
              Día de cobro *
            </label>
            <Input
              id="sub-billing-day"
              type="number"
              min="1"
              max="31"
              {...register("billing_day", {
                valueAsNumber: true,
                min: 1,
                max: 31,
              })}
              placeholder="15"
            />
          </div>

          {/* Billing Cycle */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ciclo</label>
            <Select
              value={watch("billing_cycle")}
              onValueChange={(v) => setValue("billing_cycle", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Banco</label>
            <Select
              value={watch("bank_id") || "none"}
              onValueChange={(v) =>
                setValue("bank_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ninguno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <div className="flex items-center gap-2">
                      {bank.image ? (
                        <Image
                          src={bank.image}
                          alt={bank.name}
                          width={16}
                          height={16}
                          className="h-4 w-4 rounded object-contain shrink-0"
                        />
                      ) : (
                        <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      {bank.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tarjeta</label>
            <Select
              value={watch("card_id") || "none"}
              onValueChange={(v) =>
                setValue("card_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center gap-2">
                      {card.bank?.image ? (
                        <Image
                          src={card.bank.image}
                          alt={card.bank.name}
                          width={16}
                          height={16}
                          className="h-4 w-4 rounded object-contain shrink-0"
                        />
                      ) : (
                        <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      {formatCardLabel(card)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Presupuesto</label>
            <Select
              value={watch("budget_id") || "none"}
              onValueChange={(v) =>
                setValue("budget_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ninguno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !name?.trim()}>
              {isPending
                ? isEditing
                  ? "Guardando..."
                  : "Creando..."
                : isEditing
                  ? "Guardar"
                  : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
