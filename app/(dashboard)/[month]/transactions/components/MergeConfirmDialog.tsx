"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTransaction } from "../hooks";

interface MergeConfirmDialogProps {
  /** IDs of the expense and reimbursement pair to merge (delete) */
  mergeIds: [number, number] | null;
  onClose: () => void;
}

export function MergeConfirmDialog({
  mergeIds,
  onClose,
}: MergeConfirmDialogProps) {
  const deleteTransaction = useDeleteTransaction();

  const handleMerge = async () => {
    if (!mergeIds) return;
    await Promise.all([
      deleteTransaction.mutateAsync(mergeIds[0]),
      deleteTransaction.mutateAsync(mergeIds[1]),
    ]);
    onClose();
  };

  return (
    <AlertDialog open={!!mergeIds} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Fusionar par de transacciones</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Fusionar este par de gasto y reembolso? Se eliminarán ambas
            transacciones.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleMerge}
            disabled={deleteTransaction.isPending}
          >
            {deleteTransaction.isPending ? "Fusionando..." : "Fusionar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
