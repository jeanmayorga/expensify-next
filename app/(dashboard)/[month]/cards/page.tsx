"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useCards, useCreateCard } from "./hooks";
import { useBanks } from "../banks/hooks";
import { useMonth } from "@/lib/month-context";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { useTransactionsForMonth } from "../transactions/hooks";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Plus, CreditCard, Wallet } from "lucide-react";
import { type CardWithBank } from "./service";
import {
  CreditCardTile,
  DebitCardTile,
  CardForm,
  defaultCardFormValues,
  type CardFormData,
} from "./components";
import { formatCurrency } from "./utils";
import { cn } from "@/lib/utils";

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
    credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
    cut_start_day: form.cut_start_day ? parseInt(form.cut_start_day, 10) : null,
    cut_end_day: form.cut_end_day ? parseInt(form.cut_end_day, 10) : null,
    payment_due_day: form.payment_due_day
      ? parseInt(form.payment_due_day, 10)
      : null,
  };
}

function CardSkeleton() {
  return <Skeleton className="w-full aspect-[1.6/1] rounded-2xl" />;
}

export default function CardsPage() {
  const canEdit = useCanEdit();
  const { selectedMonth } = useMonth();
  const { budgetId } = useAuth();
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: transactions = [] } = useTransactionsForMonth(selectedMonth);

  const spendingByCard = useMemo(() => {
    const filtered = budgetId
      ? transactions.filter((tx) => tx.budget_id === budgetId)
      : transactions;
    const expenses = filtered.filter((tx) => tx.type === "expense");
    const map: Record<string, number> = {};
    expenses.forEach((tx) => {
      if (tx.card_id) {
        map[tx.card_id] = (map[tx.card_id] ?? 0) + Math.abs(tx.amount);
      }
    });
    return map;
  }, [transactions, budgetId]);

  const { creditCards, debitCards, creditStats } = useMemo(() => {
    const credit = cards.filter((c) => c.card_kind === "credit");
    const debit = cards.filter((c) => c.card_kind !== "credit");
    const totalLimit = credit.reduce(
      (s, c) => s + (Number(c.credit_limit) || 0),
      0
    );
    const totalOutstanding = credit.reduce(
      (s, c) => s + (Number(c.outstanding_balance) || 0),
      0
    );
    const totalAvailable = totalLimit - totalOutstanding;
    const usagePct =
      totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;
    const availablePct = totalLimit > 0 ? 100 - usagePct : 0;
    return {
      creditCards: credit,
      debitCards: debit,
      creditStats:
        credit.length > 0 && totalLimit > 0
          ? { totalLimit, totalOutstanding, totalAvailable, usagePct, availablePct }
          : null,
    };
  }, [cards]);

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
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarjetas</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit ? "Toca una tarjeta para ver detalles" : "Tus tarjetas"}
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Stats de crédito - arriba del grid de tarjetas */}
      {isLoading ? (
        <div className="grid gap-5 grid-cols-2 min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <CreditCard className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Aún no hay tarjetas</p>
          {canEdit && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar tarjeta
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats de crédito - arriba de las tarjetas */}
          {creditStats && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Resumen tarjetas de crédito
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total deuda</p>
                  <p className="text-xl font-bold tabular-nums text-destructive">
                    {formatCurrency(creditStats.totalOutstanding)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disponible</p>
                  <p
                    className={`text-xl font-bold tabular-nums ${
                      creditStats.totalAvailable < 0
                        ? "text-destructive"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(creditStats.totalAvailable))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">% disponible</p>
                  <p
                    className={`text-xl font-bold tabular-nums ${
                      creditStats.availablePct < 0
                        ? "text-destructive"
                        : "text-emerald-600"
                    }`}
                  >
                    {creditStats.availablePct.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">% utilizado</p>
                  <p className="text-xl font-bold tabular-nums text-muted-foreground">
                    {creditStats.usagePct.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(creditStats.totalOutstanding)} / {formatCurrency(creditStats.totalLimit)}
                  </span>
                  <span className="font-medium">
                    {creditStats.usagePct.toFixed(0)}% cupo utilizado
                  </span>
                </div>
                <Progress
                  value={Math.min(creditStats.usagePct, 100)}
                  className="h-3"
                  indicatorClassName={cn(
                    "bg-gradient-to-r",
                    creditStats.usagePct >= 100
                      ? "from-red-500 to-red-600"
                      : creditStats.usagePct >= 80
                        ? "from-amber-500 to-amber-600"
                        : "from-emerald-500 to-emerald-600",
                  )}
                />
              </div>
            </div>
          )}

          {/* Tarjetas de crédito */}
          {creditCards.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Tarjetas de crédito ({creditCards.length})
              </h2>
              <div className="grid gap-5 grid-cols-2 min-w-0">
                {creditCards.map((card) => (
                  <CreditCardTile
                    key={card.id}
                    card={card}
                    spentThisMonth={spendingByCard[card.id] ?? 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tarjetas de débito */}
          {debitCards.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Tarjetas de débito ({debitCards.length})
              </h2>
              <div className="grid gap-5 grid-cols-2 min-w-0">
                {debitCards.map((card) => (
                  <DebitCardTile
                    key={card.id}
                    card={card}
                    spentThisMonth={spendingByCard[card.id] ?? 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Sheet - only in edit mode */}
      {canEdit && (
        <Sheet open={isCreating} onOpenChange={setIsCreating}>
          <SheetContent className="sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Nueva tarjeta</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 px-4 pb-4 overflow-y-auto">
                <CardForm form={form} banks={banks} />
              </div>
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCard.isPending || !watch("name")}>
                  {createCard.isPending ? "Creando..." : "Crear"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
