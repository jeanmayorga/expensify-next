"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  RefreshCw,
  Plus,
  CalendarDays,
  Zap,
  Building2,
  CreditCard,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
  Clock,
} from "lucide-react";
import { useSubscriptions, useDeleteSubscription } from "./hooks";
import { useTransactions } from "../transactions/hooks";
import { useCanEdit } from "@/lib/auth-context";
import { useMonth } from "@/lib/month-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BudgetLabel } from "@/app/(dashboard)/[month]/budgets/components/BudgetLabel";
import { CARD_TYPES, CARD_KINDS } from "@/app/(dashboard)/[month]/cards/utils";
import { CreateSubscriptionDialog } from "./components/CreateSubscriptionDialog";
import type { SubscriptionWithRelations } from "./service";
import type { TransactionWithRelations } from "../transactions/service";
import { cn } from "@/lib/utils";

const CYCLE_LABELS: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

function formatCardLabel(card: {
  name: string;
  last4: string | null;
  card_kind: string | null;
  card_type: string | null;
  bank?: { name: string } | null;
}) {
  const kindLabel =
    CARD_KINDS.find((k) => k.value === card.card_kind)?.label ?? null;
  const typeLabel =
    CARD_TYPES.find((t) => t.value === card.card_type)?.label ?? null;
  const parts = [
    kindLabel,
    typeLabel,
    card.last4 ?? null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : card.name;
}

function findMatchingTransactions(
  sub: SubscriptionWithRelations,
  transactions: TransactionWithRelations[],
): TransactionWithRelations[] {
  const subName = sub.name.toLowerCase();
  return transactions.filter((tx) => {
    if (tx.type !== "expense") return false;
    const desc = tx.description.toLowerCase();
    return desc.includes(subName) || subName.includes(desc);
  });
}

export default function SubscriptionsPage() {
  const canEdit = useCanEdit();
  const { selectedMonth } = useMonth();
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const deleteSubscription = useDeleteSubscription();

  const filters = useMemo(
    () => ({
      date: format(selectedMonth, "yyyy-MM"),
      timezone: "America/Guayaquil",
    }),
    [selectedMonth],
  );
  const { data: transactions = [], isLoading: loadingTx } =
    useTransactions(filters);

  const [isCreating, setIsCreating] = useState(false);
  const [editingSub, setEditingSub] =
    useState<SubscriptionWithRelations | null>(null);
  const [deletingSub, setDeletingSub] =
    useState<SubscriptionWithRelations | null>(null);

  const today = new Date().getDate();
  const monthParam = format(selectedMonth, "yyyy-MM");

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.is_active),
    [subscriptions],
  );

  const monthlyTotal = useMemo(() => {
    return activeSubscriptions
      .filter((s) => s.billing_cycle === "monthly")
      .reduce((sum, s) => sum + s.amount, 0);
  }, [activeSubscriptions]);

  const nextDue = useMemo(() => {
    if (activeSubscriptions.length === 0) return null;
    const sorted = [...activeSubscriptions].sort((a, b) => {
      const aDist =
        a.billing_day >= today
          ? a.billing_day - today
          : a.billing_day + 31 - today;
      const bDist =
        b.billing_day >= today
          ? b.billing_day - today
          : b.billing_day + 31 - today;
      return aDist - bDist;
    });
    return sorted[0];
  }, [activeSubscriptions, today]);

  // Map subscriptions to their matching transactions
  const matchMap = useMemo(() => {
    const map = new Map<string, TransactionWithRelations[]>();
    for (const sub of subscriptions) {
      map.set(sub.id, findMatchingTransactions(sub, transactions));
    }
    return map;
  }, [subscriptions, transactions]);

  const handleDelete = async () => {
    if (!deletingSub) return;
    await deleteSubscription.mutateAsync(deletingSub.id);
    setDeletingSub(null);
  };

  const loading = isLoading || loadingTx;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suscripciones</h1>
          <p className="text-sm text-muted-foreground">
            Tus suscripciones recurrentes y cuándo se cobran
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {activeSubscriptions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total mensual
              </p>
              <p className="text-2xl font-bold tracking-tight">
                ${monthlyTotal.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Activas</p>
              <p className="text-2xl font-bold tracking-tight">
                {activeSubscriptions.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Próxima</p>
              {nextDue ? (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold tracking-tight truncate">
                    {nextDue.name}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    Día {nextDue.billing_day}
                  </span>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Table */}
      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <RefreshCw className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No hay suscripciones</p>
          {canEdit && (
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar suscripción
            </Button>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden py-0 gap-0">
          <CardContent className="p-0">
            {/* Due today banner */}
            {activeSubscriptions.some((s) => s.billing_day === today) && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {
                    activeSubscriptions.filter((s) => s.billing_day === today)
                      .length
                  }{" "}
                  suscripción(es) se cobran hoy
                </span>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Día de cobro
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Ciclo</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Cobrado
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Estado
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const isDueToday = sub.billing_day === today;
                  const matchedTxs = matchMap.get(sub.id) ?? [];
                  const isCharged = matchedTxs.length > 0;
                  return (
                    <TableRow
                      key={sub.id}
                      className={cn(
                        isDueToday && "bg-amber-50/50 dark:bg-amber-950/20",
                        !sub.is_active && "opacity-50",
                      )}
                    >
                      {/* Name + Card/Budget/Bank */}
                      <TableCell>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {sub.name}
                            </p>
                            <span className="text-xs text-muted-foreground sm:hidden shrink-0">
                              Día {sub.billing_day}
                            </span>
                            {isDueToday && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[10px] px-1.5 shrink-0 sm:hidden"
                              >
                                Hoy
                              </Badge>
                            )}
                          </div>
                          {(sub.bank || sub.card || sub.budget) && (
                            <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0.5 text-xs text-muted-foreground min-w-0 overflow-hidden mt-0.5">
                              {(sub.bank || sub.card?.bank) && (
                                <span className="inline-flex items-center gap-1.5 shrink-0">
                                  {(sub.bank?.image ?? sub.card?.bank?.image) ? (
                                    <Image
                                      src={(sub.bank?.image ?? sub.card?.bank?.image)!}
                                      alt={sub.bank?.name ?? sub.card?.bank?.name ?? ""}
                                      width={14}
                                      height={14}
                                      className="h-3.5 w-3.5 rounded object-contain"
                                    />
                                  ) : (
                                    <Building2 className="h-3 w-3" />
                                  )}
                                  {sub.bank?.name ?? sub.card?.bank?.name}
                                </span>
                              )}
                              {sub.card && (
                                <span className="inline-flex items-center gap-1.5 shrink-0">
                                  <CreditCard className="h-3 w-3" />
                                  {formatCardLabel(sub.card)}
                                </span>
                              )}
                              {sub.budget && (
                                <BudgetLabel
                                  budget={sub.budget}
                                  iconClassName="h-3 w-3"
                                  className="shrink-0"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <span className="font-semibold text-sm tabular-nums">
                          ${sub.amount.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* Billing Day */}
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{sub.billing_day}</span>
                          {isDueToday && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[10px] px-1.5"
                            >
                              Hoy
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Cycle */}
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}
                      </TableCell>

                      {/* Charged this month */}
                      <TableCell className="hidden sm:table-cell">
                        {isCharged ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-[10px] gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Cobrado
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="space-y-1">
                              {matchedTxs.map((tx) => (
                                <p key={tx.id}>
                                  {tx.description} — ${tx.amount.toFixed(2)}
                                </p>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-muted text-[10px] gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="hidden sm:table-cell">
                        {sub.is_active ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-[10px]"
                          >
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {/* View transaction */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!isCharged}
                                asChild={isCharged}
                              >
                                {isCharged ? (
                                  <Link
                                    href={`/${monthParam}/transactions?transactionId=${matchedTxs[0].id}`}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                ) : (
                                  <span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isCharged
                                ? "Ver transacción"
                                : "Sin transacción este mes"}
                            </TooltipContent>
                          </Tooltip>

                          {canEdit && (
                            <>
                              {/* Edit */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setEditingSub(sub)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>

                              {/* Delete */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600 hover:text-red-600"
                                    onClick={() => setDeletingSub(sub)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      {canEdit && (
        <>
          <CreateSubscriptionDialog
            open={isCreating}
            onOpenChange={setIsCreating}
          />
          <CreateSubscriptionDialog
            open={!!editingSub}
            onOpenChange={(open) => {
              if (!open) setEditingSub(null);
            }}
            editingSubscription={editingSub}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingSub}
        onOpenChange={(open) => {
          if (!open) setDeletingSub(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar suscripción</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar <strong>{deletingSub?.name}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSubscription.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
