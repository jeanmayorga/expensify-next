"use client";

import { useSubscriptions, useCreateSubscription } from "../../subscriptions/hooks";
import { SubscriptionRow } from "../../subscriptions/SubscriptionRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function MicrosoftSubscriptionsPage() {
  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useSubscriptions();
  const createMutation = useCreateSubscription();

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Error al cargar las subscriptions. Asegúrate de estar autenticado
            con Microsoft.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          <RefreshCw className={cn(isRefetching && "animate-spin")} />
        </Button>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nueva suscripción
        </Button>
      </div>

      <Card className="gap-0">
        <CardHeader className="py-2.5 px-4 !pb-2 flex flex-row items-center justify-between gap-2 border-b">
          <CardTitle className="text-sm font-medium">Suscripciones activas</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay suscripciones activas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Expira (Ecuador)</TableHead>
                  <TableHead>Notification URL</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <SubscriptionRow
                    key={subscription.id}
                    subscription={subscription}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
