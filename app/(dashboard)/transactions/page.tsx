"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  ListFilter,
} from "lucide-react";
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
import {
  Card as CardUI,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionRow, TransactionRowSkeleton, EmptyState, TransactionSheet } from "./components";

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");

  // Filters
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

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (typeFilter === "all") return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  // Helper to parse date without timezone issues
  const parseDate = (date: string | Date): Date => {
    if (typeof date === "string") {
      return parseISO(date);
    }
    return date;
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithRelations[]> = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = format(parseDate(tx.occurred_at), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  // Edit dialog
  const [editingTx, setEditingTx] = useState<TransactionWithRelations | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: 0,
    category_id: "",
    card_id: "",
    bank_id: "",
  });

  // Delete dialog
  const [deletingTx, setDeletingTx] = useState<TransactionWithRelations | null>(null);

  // Detail sheet
  const [selectedTx, setSelectedTx] = useState<TransactionWithRelations | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRowClick = (tx: TransactionWithRelations) => {
    setSelectedTx(tx);
    setSheetOpen(true);
  };

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

  const balance = totalIncomes - totalExpenses;

  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const incomeCount = transactions.filter((t) => t.type === "income").length;

  const hasActiveFilters =
    categoryFilter !== "__all__" ||
    cardFilter !== "__all__" ||
    bankFilter !== "__all__";

  const clearFilters = () => {
    setCategoryFilter("__all__");
    setCardFilter("__all__");
    setBankFilter("__all__");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your financial activity
          </p>
        </div>
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <CardUI>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenseCount} transaction{expenseCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </CardUI>

        <CardUI>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalIncomes.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {incomeCount} transaction{incomeCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </CardUI>

        <CardUI>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {balance >= 0 ? "+" : "-"}${Math.abs(balance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.length} total transaction{transactions.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </CardUI>
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Type Tabs */}
        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
        >
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <ListFilter className="h-4 w-4" />
              All
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {transactions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="expense" className="gap-1.5">
              <TrendingDown className="h-4 w-4" />
              Expenses
              <span className="ml-1 rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-xs font-medium">
                {expenseCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Income
              <span className="ml-1 rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-xs font-medium">
                {incomeCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Additional Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
              <SelectValue placeholder="Category" />
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
            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
              <SelectValue placeholder="Card" />
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
            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
              <SelectValue placeholder="Bank" />
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

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <CardUI className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title={
                hasActiveFilters || typeFilter !== "all"
                  ? "No matching transactions"
                  : "No transactions yet"
              }
              description={
                hasActiveFilters || typeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Your transactions for this month will appear here."
              }
            />
          ) : (
            <div>
              {groupedTransactions.map(([dateKey, txs]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(parseISO(dateKey), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                  {/* Transactions for this date */}
                  <div className="divide-y">
                    {txs.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        onEdit={handleEdit}
                        onDelete={setDeletingTx}
                        onClick={handleRowClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </CardUI>

      {/* Edit Dialog */}
      <Dialog open={!!editingTx} onOpenChange={() => setEditingTx(null)}>
        <DialogContent className="sm:max-w-md">
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
                placeholder="Enter description"
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
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectValue placeholder="Select" />
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
                    <SelectValue placeholder="Select" />
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
              {updateTransaction.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingTx} onOpenChange={() => setDeletingTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &quot;{deletingTx?.description}&quot;
              </span>
              ? This action cannot be undone.
            </p>
          </div>
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

      {/* Transaction Detail Sheet */}
      <TransactionSheet
        transaction={selectedTx}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={handleEdit}
        onDelete={setDeletingTx}
      />
    </div>
  );
}
