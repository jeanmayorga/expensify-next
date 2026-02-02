"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useCard, useUpdateCard, useDeleteCard } from "../../hooks";
import { useCanEdit } from "@/lib/auth-context";
import { useBanks } from "../../../banks/hooks";
import { type CardWithBank } from "../../service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  CardForm,
  defaultCardFormValues,
  type CardFormData,
} from "../../components";

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
  };
}

export default function EditCardPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const canEdit = useCanEdit();

  // Redirect to detail page if user can't edit
  useEffect(() => {
    if (!canEdit) {
      router.replace("..");
    }
  }, [canEdit, router]);

  const { data: card, isLoading } = useCard(cardId);

  // Don't render anything if user can't edit
  if (!canEdit) {
    return null;
  }
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CardFormData>({ defaultValues: defaultCardFormValues });
  const { reset, watch, handleSubmit } = form;

  useEffect(() => {
    if (card) {
      reset(cardToForm(card));
    }
  }, [card, reset]);

  const onEditSubmit = async (data: CardFormData) => {
    if (!card) return;
    await updateCard.mutateAsync({
      id: card.id,
      data: formToPayload(data),
    });
    router.push("..");
  };

  const handleDelete = async () => {
    if (!card) return;
    await deleteCard.mutateAsync(card.id);
    router.push("/cards");
  };

  const handleCancel = () => {
    router.push("..");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Tarjeta no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Tarjeta</h1>
          <p className="text-sm text-muted-foreground">
            Actualiza la información de tu tarjeta
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-background rounded-xl border p-6">
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
          <CardForm form={form} banks={banks} />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateCard.isPending || !watch("name")}
              >
                {updateCard.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation */}
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
    </div>
  );
}
