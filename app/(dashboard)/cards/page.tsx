"use client";

import { useState } from "react";
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from "./hooks";
import { useBanks } from "../banks/hooks";
import { type CardWithBank } from "./service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardsPage() {
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const isLoading = loadingCards || loadingBanks;

  const [editingCard, setEditingCard] = useState<CardWithBank | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardWithBank | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: "", last4: "", bank_id: "" });

  const handleCreate = async () => {
    await createCard.mutateAsync({
      name: form.name,
      last4: form.last4 || null,
      bank_id: form.bank_id || null,
    });
    setIsCreating(false);
    setForm({ name: "", last4: "", bank_id: "" });
  };

  const handleEdit = (card: CardWithBank) => {
    setEditingCard(card);
    setForm({
      name: card.name,
      last4: card.last4 || "",
      bank_id: card.bank_id || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    await updateCard.mutateAsync({
      id: editingCard.id,
      data: {
        name: form.name,
        last4: form.last4 || null,
        bank_id: form.bank_id || null,
      },
    });
    setEditingCard(null);
    setForm({ name: "", last4: "", bank_id: "" });
  };

  const handleDelete = async () => {
    if (!deletingCard) return;
    await deleteCard.mutateAsync(deletingCard.id);
    setDeletingCard(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cards</h1>
        <Button onClick={() => setIsCreating(true)}>Add Card</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cards</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Last 4</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : cards.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No cards found
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.name}</TableCell>
                    <TableCell>
                      {card.last4 ? (
                        <span className="text-muted-foreground">
                          •••• {card.last4}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {card.bank?.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(card)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setDeletingCard(card)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Card name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last 4 digits</label>
              <Input
                value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank</label>
              <Select
                value={form.bank_id || "__none__"}
                onValueChange={(v) =>
                  setForm({ ...form, bank_id: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createCard.isPending}>
              {createCard.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last 4 digits</label>
              <Input
                value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value })}
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank</label>
              <Select
                value={form.bank_id || "__none__"}
                onValueChange={(v) =>
                  setForm({ ...form, bank_id: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateCard.isPending}>
              {updateCard.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingCard} onOpenChange={() => setDeletingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete &quot;{deletingCard?.name}&quot;?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCard(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCard.isPending}
            >
              {deleteCard.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
