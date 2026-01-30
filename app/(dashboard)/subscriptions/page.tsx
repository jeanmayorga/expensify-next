"use client";

import { useSubscriptions, useCreateSubscription } from "./hooks";
import { SubscriptionRow } from "./SubscriptionRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, Loader2 } from "lucide-react";

export default function SubscriptionsPage() {
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Microsoft Subscriptions</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Error al cargar las subscriptions. Asegúrate de estar autenticado
              con Microsoft.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Microsoft Subscriptions</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={isRefetching ? "animate-spin" : ""} />
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
            Nueva Subscription
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions activas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay subscriptions activas
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
