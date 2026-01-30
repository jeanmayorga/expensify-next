"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  TransactionForm,
  TransactionFormData,
  defaultTransactionFormValues,
} from "./TransactionForm";
import { useCreateTransaction } from "../hooks";
import { type TransactionInsert } from "../service";
import { type Category } from "../../categories/service";
import { type CardWithBank } from "../../cards/service";
import { type Bank } from "../../banks/service";
import { type Budget } from "../../budgets/service";
import {
  toEcuadorDateTimeLocal,
  fromEcuadorDateTimeLocalToUTC,
} from "@/utils/ecuador-time";

interface CreateTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  cards: CardWithBank[];
  banks: Bank[];
  budgets: Budget[];
}

export function CreateTransactionSheet({
  open,
  onOpenChange,
  categories,
  cards,
  banks,
  budgets,
}: CreateTransactionSheetProps) {
  const createTransaction = useCreateTransaction();

  const form = useForm<TransactionFormData>({
    defaultValues: defaultTransactionFormValues,
  });

  const { handleSubmit, reset, watch } = form;

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      reset({
        ...defaultTransactionFormValues,
        occurred_at: toEcuadorDateTimeLocal(), // Current time in Ecuador
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: TransactionFormData) => {
    await createTransaction.mutateAsync({
      type: data.type,
      description: data.description,
      amount: data.amount,
      occurred_at: fromEcuadorDateTimeLocalToUTC(data.occurred_at), // Convert Ecuador time to UTC
      category_id: data.category_id || null,
      card_id: data.card_id || null,
      bank_id: data.bank_id || null,
      budget_id: data.budget_id || null,
      comment: data.comment || null,
    } as TransactionInsert);
    onOpenChange(false);
  };

  const description = watch("description");
  const amount = watch("amount");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nueva Transacción</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 px-6 pt-0 overflow-y-auto">
            <TransactionForm
              form={form}
              categories={categories}
              cards={cards}
              banks={banks}
              budgets={budgets}
            />
          </div>
          <SheetFooter className="px-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTransaction.isPending || !description || !amount}
            >
              {createTransaction.isPending ? "Creando..." : "Crear"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
