"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
} from "./hooks";
import { useCategories } from "../categories/hooks";
import { useCards } from "../cards/hooks";
import { useBanks } from "../banks/hooks";
import { type TransactionWithRelations } from "./service";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card as CardUI,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Filters (use __all__ since Radix Select reserves "" for clearing)
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [cardFilter, setCardFilter] = useState<string>("__all__");
  const [bankFilter, setBankFilter] = useState<string>("__all__");

  // Build filters
  const filters: Record<string, string> = {
    date: format(selectedMonth, "yyyy-MM"),
  };
  if (categoryFilter !== "__all__") filters.category_id = categoryFilter;
  if (cardFilter !== "__all__") filters.card_id = cardFilter;
  if (bankFilter !== "__all__") filters.bank_id = bankFilter;

  // Queries
  const { data: transactions = [], isLoading: loadingTx } =
    useTransactions(filters);
  const { data: categories = [], isLoading: loadingCat } = useCategories();
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();

  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const loading = loadingTx || loadingCat || loadingCards || loadingBanks;

  // Edit dialog
  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(
    null,
  );
  const [editForm, setEditForm] = useState({
    description: "",
    amount: 0,
    category_id: "",
    card_id: "",
    bank_id: "",
  });

  // Delete dialog
  const [deletingTx, setDeletingTx] = useState<TransactionWithRelations | null>(
    null,
  );

  const handleEdit = (tx: TransactionWithRelations) => {
    setEditingTx(tx);
    setEditForm({
      description: tx.description,
      amount: tx.amount,
      category_id: tx.category_id || "",
      card_id: tx.card_id || "",
      bank_id: tx.bank_id || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    await updateTransaction.mutateAsync({
      id: editingTx.id,
      data: {
        description: editForm.description,
        amount: editForm.amount,
        category_id: editForm.category_id || null,
        card_id: editForm.card_id || null,
        bank_id: editForm.bank_id || null,
      },
    });
    setEditingTx(null);
  };

  const handleDelete = async () => {
    if (!deletingTx) return;
    await deleteTransaction.mutateAsync(deletingTx.id);
    setDeletingTx(null);
  };

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncomes = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <CardUI>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </CardUI>
        <CardUI>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncomes.toFixed(2)}
            </div>
          </CardContent>
        </CardUI>
        <CardUI>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalIncomes - totalExpenses).toFixed(2)}
            </div>
          </CardContent>
        </CardUI>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cardFilter} onValueChange={setCardFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Cards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Cards</SelectItem>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Banks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Banks</SelectItem>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(categoryFilter !== "__all__" ||
          cardFilter !== "__all__" ||
          bankFilter !== "__all__") && (
          <Button
            variant="ghost"
            onClick={() => {
              setCategoryFilter("__all__");
              setCardFilter("__all__");
              setBankFilter("__all__");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <CardUI>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Card</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {format(new Date(tx.occurred_at), "MMM dd")}
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: tx.category.color || undefined,
                          }}
                        >
                          {tx.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.card ? (
                        <span className="text-sm">
                          {tx.card.name}
                          {tx.card.last4 && (
                            <span className="text-muted-foreground">
                              {" "}
                              •••• {tx.card.last4}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === "expense"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tx)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setDeletingTx(tx)}
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
      </CardUI>

      {/* Edit Dialog */}
      <Dialog open={!!editingTx} onOpenChange={() => setEditingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={editForm.category_id || "__none__"}
                onValueChange={(v) =>
                  setEditForm({
                    ...editForm,
                    category_id: v === "__none__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Card</label>
              <Select
                value={editForm.card_id || "__none__"}
                onValueChange={(v) =>
                  setEditForm({
                    ...editForm,
                    card_id: v === "__none__" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select card" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank</label>
              <Select
                value={editForm.bank_id || "__none__"}
                onValueChange={(v) =>
                  setEditForm({
                    ...editForm,
                    bank_id: v === "__none__" ? "" : v,
                  })
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
            <Button variant="outline" onClick={() => setEditingTx(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingTx} onOpenChange={() => setDeletingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete &quot;{deletingTx?.description}
            &quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTx(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
