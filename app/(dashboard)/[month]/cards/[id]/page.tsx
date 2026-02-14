"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCard } from "../hooks";
import { useTransactions } from "../../transactions/hooks";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditCardDialog, CardStats, CardDetails } from "../components";
import {
  getBillingCycleByOffset,
  getBillingCycleOptions,
} from "../utils/billing-cycle";

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const month = params.month as string;
  const cardId = params.id as string;
  const { budgetId } = useAuth();
  const canEdit = useCanEdit();
  const cardsListPath = `/${month}/cards`;

  // Fetch card details
  const { data: card, isLoading: loadingCard } = useCard(cardId);

  // Billing cycle: selected period offset (0=current, -1=previous, etc.)
  const [cycleOffset, setCycleOffset] = useState(0);

  // Billing cycle filters (for credit cards with cut dates)
  const cycleFilters = useMemo(() => {
    if (!card) return null;
    const cutStart = card.cut_start_day ?? 16;
    const cutEnd = card.cut_end_day ?? 13;
    const { fromStr, toStr } = getBillingCycleByOffset(
      cutStart,
      cutEnd,
      new Date(),
      cycleOffset
    );
    return {
      date_from: fromStr,
      date_to: toStr,
      card_id: cardId,
      ...(budgetId ? { budget_id: budgetId } : {}),
    };
  }, [card, cardId, budgetId, cycleOffset]);

  const showCycleStats =
    card?.card_kind === "credit" &&
    card?.credit_limit != null &&
    card?.credit_limit > 0 &&
    !!cycleFilters;

  const { data: cycleTransactions = [] } = useTransactions(
    cycleFilters ?? {},
    { enabled: showCycleStats }
  );

  const [editCardOpen, setEditCardOpen] = useState(false);

  // Loading skeleton
  if (loadingCard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(cardsListPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a tarjetas
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Tarjeta no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Details - header con back, logo, título y botones dentro del bg */}
      <CardDetails
        card={card}
        cardsListPath={cardsListPath}
        month={month}
        canEdit={canEdit}
        onEditClick={() => setEditCardOpen(true)}
      />

      {/* Card Stats - billing cycle summary for credit cards */}
      {showCycleStats && (
        <CardStats
          card={card}
          cycleTransactions={cycleTransactions}
          month={month}
          cycleOffset={cycleOffset}
          onCycleOffsetChange={setCycleOffset}
          cycleOptions={getBillingCycleOptions(
            card.cut_start_day ?? 16,
            card.cut_end_day ?? 13
          )}
        />
      )}

      {canEdit && (
        <EditCardDialog
          open={editCardOpen}
          onOpenChange={setEditCardOpen}
          card={card}
          month={month}
        />
      )}
    </div>
  );
}
