"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  ListFilter,
  Tag,
  CreditCard,
  Building2,
  RefreshCw,
} from "lucide-react";
import {
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
} from "./hooks";
import { useCategories } from "../categories/hooks";
import { useCards } from "../cards/hooks";
import { useBanks } from "../banks/hooks";
import { useBudgets } from "../budgets/hooks";
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
import {
  TransactionRow,
  TransactionRowSkeleton,
  EmptyState,
  TransactionSheet,
} from "./components";

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [cardFilter, setCardFilter] = useState<string>("__all__");
  const [bankFilter, setBankFilter] = useState<string>("__all__");
  const [budgetFilter, setBudgetFilter] = useState<string>("__all__");

  // Build filters
  const filters: Record<string, string> = {
    date: format(selectedMonth, "yyyy-MM"),
  };
  if (categoryFilter !== "__all__") filters.category_id = categoryFilter;
  if (cardFilter !== "__all__") filters.card_id = cardFilter;
  if (bankFilter !== "__all__") filters.bank_id = bankFilter;
  if (budgetFilter !== "__all__") filters.budget_id = budgetFilter;

  // Queries
  const {
    data: transactions = [],
    isLoading: loadingTx,
    refetch,
    isRefetching,
  } = useTransactions(filters);
  const { data: categories = [], isLoading: loadingCat } = useCategories();
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const loading =
    loadingTx || loadingCat || loadingCards || loadingBanks || loadingBudgets;

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

  // Detail sheet
  const [selectedTx, setSelectedTx] = useState<TransactionWithRelations | null>(
    null,
  );
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

  const handleQuickUpdate = async (
    id: number,
    data: Record<string, string | null>,
  ) => {
    await updateTransaction.mutateAsync({
      id,
      data,
    });
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
    bankFilter !== "__all__" ||
    budgetFilter !== "__all__";

  const clearFilters = () => {
    setCategoryFilter("__all__");
    setCardFilter("__all__");
    setBankFilter("__all__");
    setBudgetFilter("__all__");
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
        {/* Expenses Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <TrendingDown className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Gastos</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              ${totalExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {expenseCount} transacción{expenseCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="absolute top-3 right-3 opacity-20">
            <TrendingUp className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Total Ingresos</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              ${totalIncomes.toFixed(2)}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {incomeCount} transacción{incomeCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${
            balance >= 0
              ? "bg-gradient-to-br from-blue-500 to-blue-600"
              : "bg-gradient-to-br from-orange-500 to-orange-600"
          }`}
        >
          <div className="absolute top-3 right-3 opacity-20">
            <Wallet className="h-16 w-16" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Balance</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {balance >= 0 ? "+" : "-"}${Math.abs(balance).toFixed(2)}
            </p>
            <p className="text-xs text-white/70 mt-2">
              {transactions.length} transacción
              {transactions.length !== 1 ? "es" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        {/* Type Tabs Row */}
        <div className="flex items-center justify-between">
          <Tabs
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          >
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5 text-xs">
                Todas
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  {transactions.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="expense" className="gap-1.5 text-xs">
                <TrendingDown className="h-3.5 w-3.5" />
                Gastos
                <span className="ml-1 rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-medium">
                  {expenseCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                Ingresos
                <span className="ml-1 rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-medium">
                  {incomeCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[120px] ${
                categoryFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || "#888" }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Card Filter */}
          <Select value={cardFilter} onValueChange={setCardFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[120px] ${
                cardFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <SelectValue placeholder="Tarjeta" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todas las tarjetas</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <div className="flex items-center gap-2">
                    <CreditCard
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: card.color || undefined }}
                    />
                    <span>{card.name}</span>
                    {card.last4 && (
                      <span className="text-muted-foreground text-xs">
                        •••• {card.last4}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bank Filter */}
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[100px] ${
                bankFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todos los bancos</SelectItem>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  <div className="flex items-center gap-2">
                    {bank.image ? (
                      <Image
                        src={bank.image}
                        alt={bank.name}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded object-contain shrink-0"
                      />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {bank.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Budget Filter */}
          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger
              className={`h-8 text-xs shrink-0 min-w-[120px] ${
                budgetFilter !== "__all__"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background"
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <SelectValue placeholder="Presupuesto" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="__all__">Todos los presupuestos</SelectItem>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    {budget.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      <CardUI className="overflow-hidden py-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
          <span className="text-sm font-medium">Transacciones</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            disabled={isRefetching || loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
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
                      {format(
                        parseISO(dateKey),
                        "EEEE, d 'de' MMMM 'de' yyyy",
                        { locale: es },
                      )}
                    </p>
                  </div>
                  {/* Transactions for this date */}
                  <div className="divide-y">
                    {txs.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        categories={categories}
                        cards={cards}
                        banks={banks}
                        budgets={budgets}
                        onUpdate={handleQuickUpdate}
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
