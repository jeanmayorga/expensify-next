"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/** Convert API TransactionInsert to form values (occurred_at → Ecuador local) */
function transactionInsertToFormData(
  insert: TransactionInsert,
): Partial<TransactionFormData> {
  return {
    type: (insert.type as "expense" | "income") ?? "expense",
    description: insert.description ?? "",
    amount: insert.amount ?? 0,
    occurred_at: insert.occurred_at
      ? toEcuadorDateTimeLocal(insert.occurred_at)
      : toEcuadorDateTimeLocal(),
    category_id: insert.category_id ?? "",
    card_id: insert.card_id ?? "",
    bank_id: insert.bank_id ?? "",
    budget_id: insert.budget_id ?? "",
    comment: insert.comment ?? "",
  };
}

interface CreateTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  cards: CardWithBank[];
  banks: Bank[];
  budgets: Budget[];
  /** Pre-fill form with extracted data (e.g. from email extract-transaction) */
  initialData?: TransactionInsert | null;
  /** Called after creating a transaction that has income_message_id (e.g. from email) */
  onCreatedFromMessage?: (messageId: string) => void;
}

export function CreateTransactionSheet({
  open,
  onOpenChange,
  categories,
  cards,
  banks,
  budgets,
  initialData,
  onCreatedFromMessage,
}: CreateTransactionSheetProps) {
  const createTransaction = useCreateTransaction();
  const initialDataRef = useRef<TransactionInsert | null | undefined>(null);

  const form = useForm<TransactionFormData>({
    defaultValues: defaultTransactionFormValues,
  });

  const { handleSubmit, reset, watch } = form;

  // Reset form when sheet opens: use initialData if provided, else defaults
  useEffect(() => {
    if (open) {
      initialDataRef.current = initialData;
      if (initialData) {
        reset({
          ...defaultTransactionFormValues,
          ...transactionInsertToFormData(initialData),
        });
      } else {
        reset({
          ...defaultTransactionFormValues,
          occurred_at: toEcuadorDateTimeLocal(),
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: TransactionFormData) => {
    const payload: TransactionInsert = {
      type: data.type,
      description: data.description,
      amount: data.amount,
      occurred_at: fromEcuadorDateTimeLocalToUTC(data.occurred_at),
      category_id: data.category_id || null,
      card_id: data.card_id || null,
      bank_id: data.bank_id || null,
      budget_id: data.budget_id || null,
      comment: data.comment || null,
    };
    if (initialDataRef.current?.income_message_id) {
      payload.income_message_id = initialDataRef.current.income_message_id;
    }
    await createTransaction.mutateAsync(payload);
    if (payload.income_message_id && onCreatedFromMessage) {
      onCreatedFromMessage(payload.income_message_id);
    }
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
          {initialData?.income_message_id && (
            <div className="px-6 pt-2 pb-2 border-b space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                ID del mensaje (email)
              </label>
              <Input
                readOnly
                value={initialData.income_message_id}
                className="font-mono text-xs bg-muted"
              />
              <a
                href={`/api/microsoft/me/messages/${initialData.income_message_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Abrir mensaje en API
              </a>
            </div>
          )}
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
