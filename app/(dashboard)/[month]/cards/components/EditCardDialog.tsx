"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useUpdateCard, useDeleteCard } from "../hooks";
import { useBanks } from "../../banks/hooks";
import { type CardWithBank } from "../service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import {
  CardForm,
  defaultCardFormValues,
  type CardFormData,
} from "./CardForm";

function cardToForm(card: CardWithBank): CardFormData {
  return {
    name: card.name,
    last4: card.last4 || "",
    bank_id: card.bank_id || "",
    color: card.color || "#1e293b",
    card_type: card.card_type || "",
    card_kind: card.card_kind || "",
    cardholder_name: card.cardholder_name || "",
    expiration_date: card.expiration_date || "",
    outstanding_balance: card.outstanding_balance?.toString() || "",
    credit_limit: card.credit_limit?.toString() || "",
    cut_start_day: card.cut_start_day?.toString() || "",
    cut_end_day: card.cut_end_day?.toString() || "",
    payment_due_day: card.payment_due_day?.toString() || "",
  };
}

function formToPayload(form: CardFormData) {
  return {
    name: form.name,
    last4: form.last4 || null,
    bank_id: form.bank_id || null,
    color: form.color || null,
    card_type: form.card_type || null,
    card_kind: form.card_kind || null,
    cardholder_name: form.cardholder_name || null,
    expiration_date: form.expiration_date || null,
    outstanding_balance: form.outstanding_balance
      ? parseFloat(form.outstanding_balance)
      : null,
    credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
    cut_start_day: form.cut_start_day
      ? parseInt(form.cut_start_day, 10)
      : null,
    cut_end_day: form.cut_end_day ? parseInt(form.cut_end_day, 10) : null,
    payment_due_day: form.payment_due_day
      ? parseInt(form.payment_due_day, 10)
      : null,
  };
}

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardWithBank | null;
  month: string;
}

export function EditCardDialog({
  open,
  onOpenChange,
  card,
  month,
}: EditCardDialogProps) {
  const router = useRouter();
  const { data: banks = [] } = useBanks();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CardFormData>({ defaultValues: defaultCardFormValues });
  const { reset, watch, handleSubmit } = form;

  useEffect(() => {
    if (open && card) {
      reset(cardToForm(card));
    }
  }, [open, card, reset]);

  const onEditSubmit = async (data: CardFormData) => {
    if (!card) return;
    await updateCard.mutateAsync({
      id: card.id,
      data: formToPayload(data),
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!card) return;
    await deleteCard.mutateAsync(card.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
    router.push(`/${month}/cards`);
  };

  if (!card) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarjeta</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <CardForm form={form} banks={banks} />
            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateCard.isPending || !watch("name")}
              >
                {updateCard.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Tarjeta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Estás seguro de que quieres eliminar{" "}
            <span className="font-medium text-foreground">{card.name}</span>?
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
              disabled={deleteCard.isPending}
            >
              {deleteCard.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
