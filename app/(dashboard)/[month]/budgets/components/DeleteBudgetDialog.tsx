"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeleteBudget } from "../hooks";
import type { Budget } from "../service";

interface DeleteBudgetDialogProps {
  budget: Budget | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteBudgetDialog({
  budget,
  onClose,
  onDeleted,
}: DeleteBudgetDialogProps) {
  const deleteBudget = useDeleteBudget();

  const handleDelete = async () => {
    if (!budget) return;
    await deleteBudget.mutateAsync(budget.id);
    onDeleted?.();
    onClose();
  };

  return (
    <Dialog open={!!budget} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar presupuesto</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar el presupuesto{" "}
            <span className="font-medium text-foreground">
              &quot;{budget?.name}&quot;
            </span>
            ? Esta acción no se puede deshacer.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteBudget.isPending}
          >
            {deleteBudget.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
