"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from "./hooks";
import { useBanks } from "../banks/hooks";
import { type CardWithBank } from "./service";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { CreditCardVisual, CardForm, defaultCardFormValues, type CardFormData } from "./components";

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
    outstanding_balance: form.outstanding_balance ? parseFloat(form.outstanding_balance) : null,
  };
}

function CardSkeleton() {
  return <Skeleton className="w-full aspect-[1.586/1] rounded-2xl" />;
}

export default function CardsPage() {
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const isLoading = loadingCards || loadingBanks;

  const [editingCard, setEditingCard] = useState<CardWithBank | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CardFormData>({ defaultValues: defaultCardFormValues });
  const { reset, watch, handleSubmit } = form;

  useEffect(() => {
    if (editingCard) {
      reset(cardToForm(editingCard));
    }
  }, [editingCard, reset]);

  const onCreateSubmit = async (data: CardFormData) => {
    await createCard.mutateAsync(formToPayload(data));
    setIsCreating(false);
    reset(defaultCardFormValues);
  };

  const onEditSubmit = async (data: CardFormData) => {
    if (!editingCard) return;
    await updateCard.mutateAsync({
      id: editingCard.id,
      data: formToPayload(data),
    });
    setEditingCard(null);
    reset(defaultCardFormValues);
  };

  const handleDelete = async () => {
    if (!editingCard) return;
    await deleteCard.mutateAsync(editingCard.id);
    setShowDeleteConfirm(false);
    setEditingCard(null);
    reset(defaultCardFormValues);
  };

  const openCreate = () => {
    reset(defaultCardFormValues);
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cards</h1>
          <p className="text-sm text-muted-foreground">
            Tap a card to edit its details
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <CreditCard className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No cards yet</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add card
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              onClick={() => setEditingCard(card)}
            />
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>New Card</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <CardForm form={form} banks={banks} />
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCard.isPending || !watch("name")}>
                {createCard.isPending ? "Creating..." : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingCard && !showDeleteConfirm} onOpenChange={() => setEditingCard(null)}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Card</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <CardForm form={form} banks={banks} />
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
              <Button type="button" variant="outline" onClick={() => setEditingCard(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCard.isPending || !watch("name")}>
                {updateCard.isPending ? "Saving..." : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <span className="font-medium text-foreground">{editingCard?.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCard.isPending}>
              {deleteCard.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
