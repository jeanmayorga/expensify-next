"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCards, useCreateCard } from "./hooks";
import { useBanks } from "../banks/hooks";
import { useCanEdit } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard } from "lucide-react";
import { type CardWithBank } from "./service";
import { CreditCardVisual, CardForm, defaultCardFormValues, type CardFormData } from "./components";

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
  const canEdit = useCanEdit();
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const createCard = useCreateCard();

  const isLoading = loadingCards || loadingBanks;

  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CardFormData>({ defaultValues: defaultCardFormValues });
  const { reset, watch, handleSubmit } = form;

  const onCreateSubmit = async (data: CardFormData) => {
    await createCard.mutateAsync(formToPayload(data));
    setIsCreating(false);
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
            {canEdit ? "Tap a card to edit its details" : "Tus tarjetas"}
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
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
          {canEdit && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add card
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
            />
          ))}
        </div>
      )}

      {/* Create Sheet - only in edit mode */}
      {canEdit && (
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
      )}
    </div>
  );
}
