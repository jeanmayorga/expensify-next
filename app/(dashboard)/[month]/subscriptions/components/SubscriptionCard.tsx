"use client";

import { Pencil, Trash2, CreditCard, CalendarDays, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBudgetIconComponent } from "@/app/(dashboard)/[month]/budgets/components/BudgetIconPicker";
import { BudgetLabel } from "@/app/(dashboard)/[month]/budgets/components/BudgetLabel";
import type { SubscriptionWithRelations } from "../service";
import { cn } from "@/lib/utils";

const CYCLE_LABELS: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

interface SubscriptionCardProps {
  subscription: SubscriptionWithRelations;
  onEdit?: (sub: SubscriptionWithRelations) => void;
  onDelete?: (sub: SubscriptionWithRelations) => void;
  today?: number;
}

export function SubscriptionCard({
  subscription: sub,
  onEdit,
  onDelete,
  today,
}: SubscriptionCardProps) {
  const Icon = getBudgetIconComponent(sub.icon);
  const isDueToday = today === sub.billing_day;

  return (
    <Card
      className={cn(
        "transition-colors",
        isDueToday && "ring-2 ring-amber-400/60",
        !sub.is_active && "opacity-60",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: icon + name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{sub.name}</p>
              <p className="text-xs text-muted-foreground">
                {CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isDueToday && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] px-1.5">
                Hoy
              </Badge>
            )}
            {!sub.is_active && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                Inactiva
              </Badge>
            )}
          </div>
        </div>

        {/* Amount */}
        <p className="text-xl font-bold tracking-tight">
          ${sub.amount.toFixed(2)}
        </p>

        {/* Billing day */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>Día {sub.billing_day} de cada mes</span>
        </div>

        {/* Bank, Card & Budget */}
        {(sub.bank || sub.card || sub.budget) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {(sub.bank || sub.card?.bank) && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {sub.bank?.name ?? sub.card?.bank?.name}
              </span>
            )}
            {sub.card && (
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {sub.card.name}
                {sub.card.last4 && ` ·${sub.card.last4}`}
              </span>
            )}
            {sub.budget && (
              <BudgetLabel
                budget={sub.budget}
                iconClassName="h-3 w-3"
              />
            )}
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 pt-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onEdit(sub)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:text-red-600"
                onClick={() => onDelete(sub)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriptionCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-7 w-20 bg-muted rounded animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
