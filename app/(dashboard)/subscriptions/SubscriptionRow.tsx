"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MicrosoftSubscription } from "@/app/api/microsoft/subscriptions/model";
import { useDeleteSubscription, useRenewSubscription } from "./hooks";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, RefreshCw, Loader2 } from "lucide-react";

interface SubscriptionRowProps {
  subscription: MicrosoftSubscription;
}

export function SubscriptionRow({ subscription }: SubscriptionRowProps) {
  const deleteMutation = useDeleteSubscription();
  const renewMutation = useRenewSubscription();

  const isDeleting =
    deleteMutation.isPending && deleteMutation.variables === subscription.id;
  const isRenewing =
    renewMutation.isPending && renewMutation.variables === subscription.id;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {subscription.id.slice(0, 8)}...
      </TableCell>
      <TableCell className="text-sm">{subscription.resource}</TableCell>
      <TableCell className="text-sm">
        {subscription.expirationDateTimeEcuador ||
          format(
            new Date(subscription.expirationDateTime),
            "yyyy-MM-dd HH:mm",
            {
              locale: es,
            },
          )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
        {subscription.notificationUrl}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => renewMutation.mutate(subscription.id)}
            disabled={isRenewing}
            title="Renovar subscription"
          >
            {isRenewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate(subscription.id)}
            disabled={isDeleting}
            title="Eliminar subscription"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
