"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
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
import { useUpdateTransaction } from "../hooks";
import { type TransactionWithRelations } from "../service";
import { type Category } from "../../categories/service";
import { type CardWithBank } from "../../cards/service";
import { type Bank } from "../../banks/service";
import { type Budget } from "../../budgets/service";

interface EditTransactionSheetProps {
  transaction: TransactionWithRelations | null;
  onClose: () => void;
  onDelete: (tx: TransactionWithRelations) => void;
  categories: Category[];
  cards: CardWithBank[];
  banks: Bank[];
  budgets: Budget[];
}

export function EditTransactionSheet({
  transaction,
  onClose,
  onDelete,
  categories,
  cards,
  banks,
  budgets,
}: EditTransactionSheetProps) {
  const updateTransaction = useUpdateTransaction();

  const form = useForm<TransactionFormData>({
    defaultValues: defaultTransactionFormValues,
  });

  const { handleSubmit, reset, watch } = form;

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type as "expense" | "income",
        description: transaction.description,
        amount: transaction.amount,
        occurred_at: transaction.occurred_at
          ? new Date(transaction.occurred_at).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        category_id: transaction.category_id || "",
        card_id: transaction.card_id || "",
        bank_id: transaction.bank_id || "",
        budget_id: transaction.budget_id || "",
        comment: transaction.comment || "",
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: TransactionFormData) => {
    if (!transaction) return;
    await updateTransaction.mutateAsync({
      id: transaction.id,
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        occurred_at: new Date(data.occurred_at).toISOString(),
        category_id: data.category_id || null,
        card_id: data.card_id || null,
        bank_id: data.bank_id || null,
        budget_id: data.budget_id || null,
        comment: data.comment || null,
      },
    });
    onClose();
  };

  const description = watch("description");

  return (
    <Sheet open={!!transaction} onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Transacción</SheetTitle>
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
          <SheetFooter className="flex-col sm:flex-row px-6 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto"
              onClick={() => transaction && onDelete(transaction)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateTransaction.isPending || !description}
            >
              {updateTransaction.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
