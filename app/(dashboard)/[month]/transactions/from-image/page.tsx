"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Loader2,
  X,
  ImageIcon,
  Building2,
  CreditCard,
  Tag,
  Wallet,
  Trash2,
  Save,
  ArrowLeft,
  Edit2,
  Check,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "../../categories/hooks";
import { useCards } from "../../cards/hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../../budgets/hooks";
import { useExtractBulkFromImage, useCreateTransactions } from "../hooks";
import type {
  ParsedTransaction,
  ImageExtractionHints,
  TransactionInsert,
} from "../service";

const MAX_DIMENSION = 1024;
const INITIAL_QUALITY = 0.7;
const REDUCED_QUALITY = 0.5;
const MAX_SIZE_KB = 800;

async function compressImage(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION;
          width = MAX_DIMENSION;
        } else {
          width = (width / height) * MAX_DIMENSION;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL("image/jpeg", INITIAL_QUALITY);
      let base64 = dataUrl.split(",")[1];

      const sizeKB = (base64.length * 3) / 4 / 1024;
      if (sizeKB > MAX_SIZE_KB) {
        dataUrl = canvas.toDataURL("image/jpeg", REDUCED_QUALITY);
        base64 = dataUrl.split(",")[1];
      }

      resolve({ base64, mimeType: "image/jpeg" });
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    reader.readAsDataURL(file);
  });
}

interface EditableTransaction extends ParsedTransaction {
  id: string;
  budget_id: string | null;
}

export default function FromImagePage() {
  const router = useRouter();

  // Data queries
  const { data: categories = [] } = useCategories();
  const { data: cards = [] } = useCards();
  const { data: banks = [] } = useBanks();
  const { data: budgets = [] } = useBudgets();

  // Mutations
  const extractBulk = useExtractBulkFromImage();
  const createTransactions = useCreateTransactions();

  // Image state
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hints state
  const [userContext, setUserContext] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("__none__");
  const [selectedCardId, setSelectedCardId] = useState<string>("__none__");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("__none__");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("__none__");

  // Extracted transactions state
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen");
      return;
    }

    setError(null);
    setIsCompressing(true);

    try {
      const { base64, mimeType } = await compressImage(file);
      setPendingImage({ base64, mimeType });
      setPreview(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      setError("Error al procesar la imagen. Intenta de nuevo.");
      console.error("Image compression error:", err);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      e.target.value = "";
    },
    [handleFileSelect],
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleExtract = useCallback(async () => {
    if (!pendingImage) return;

    const hints: ImageExtractionHints = {};
    if (userContext.trim()) {
      hints.userContext = userContext.trim();
    }
    if (selectedBankId !== "__none__") {
      hints.preselectedBankId = selectedBankId;
    }
    if (selectedCardId !== "__none__") {
      hints.preselectedCardId = selectedCardId;
    }
    if (selectedCategoryId !== "__none__") {
      hints.preselectedCategoryId = selectedCategoryId;
    }
    if (selectedBudgetId !== "__none__") {
      hints.preselectedBudgetId = selectedBudgetId;
    }

    try {
      const result = await extractBulk.mutateAsync({
        image: pendingImage.base64,
        mimeType: pendingImage.mimeType,
        hints,
      });

      // Convert to editable transactions with IDs
      const editableTransactions: EditableTransaction[] = result.map(
        (tx, index) => ({
          ...tx,
          id: `tx-${Date.now()}-${index}`,
          budget_id: selectedBudgetId !== "__none__" ? selectedBudgetId : null,
        }),
      );

      setTransactions(editableTransactions);
    } catch (err) {
      setError("Error al extraer transacciones. Intenta de nuevo.");
      console.error("Extraction error:", err);
    }
  }, [
    pendingImage,
    userContext,
    selectedBankId,
    selectedCardId,
    selectedCategoryId,
    selectedBudgetId,
    extractBulk,
  ]);

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const handleUpdateTransaction = useCallback(
    (
      id: string,
      field: keyof EditableTransaction,
      value: string | number | null,
    ) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, [field]: value } : tx)),
      );
    },
    [],
  );

  const handleSaveAll = useCallback(async () => {
    if (transactions.length === 0) return;

    const payloads: TransactionInsert[] = transactions.map((tx) => ({
      type: tx.type,
      description: tx.description,
      amount: tx.amount,
      occurred_at: tx.occurred_at,
      bank_id: tx.bank_id,
      card_id: tx.card_id,
      category_id: tx.category_id,
      budget_id: tx.budget_id,
    }));

    try {
      await createTransactions.mutateAsync(payloads);
      router.push("..");
    } catch (err) {
      setError("Error al guardar las transacciones.");
      console.error("Save error:", err);
    }
  }, [transactions, createTransactions, router]);

  const handleClearImage = useCallback(() => {
    setPreview(null);
    setPendingImage(null);
    setTransactions([]);
    setError(null);
  }, []);

  const isLoading = isCompressing || extractBulk.isPending;
  const isSaving = createTransactions.isPending;

  const totalAmount = transactions.reduce((sum, tx) => {
    return tx.type === "expense" ? sum - tx.amount : sum + tx.amount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("..")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Extraer desde imagen
          </h1>
          <p className="text-sm text-muted-foreground">
            Sube un estado de cuenta o documento con múltiples transacciones
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Imagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Preview or Drop Zone */}
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Document preview"
                  className="w-full max-h-64 object-contain rounded-lg border bg-muted"
                />
                {!isLoading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={handleClearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {isCompressing ? "Comprimiendo..." : "Extrayendo..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={`flex items-center justify-center w-full h-40 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30 bg-muted/50 hover:border-primary/50 hover:bg-muted"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground pointer-events-none">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-sm text-center px-4">
                      {isDragging
                        ? "Suelta la imagen aquí"
                        : "Arrastra una imagen o haz clic"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Context and Filters */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Contexto adicional (opcional)
                </span>
                <Textarea
                  placeholder="Ej: Estado de cuenta de enero, tarjeta de crédito..."
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  className="resize-none h-16 text-sm"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Banco
                  </span>
                  <Select
                    value={selectedBankId}
                    onValueChange={setSelectedBankId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin preselección</SelectItem>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Tarjeta
                  </span>
                  <Select
                    value={selectedCardId}
                    onValueChange={setSelectedCardId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin preselección</SelectItem>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name}
                          {card.last4 && ` •••• ${card.last4}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Categoría
                  </span>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin preselección</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    Presupuesto
                  </span>
                  <Select
                    value={selectedBudgetId}
                    onValueChange={setSelectedBudgetId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin preselección</SelectItem>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleExtract}
              disabled={!pendingImage || isLoading}
            >
              {extractBulk.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extrayendo transacciones...
                </>
              ) : (
                "Extraer transacciones"
              )}
            </Button>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </CardContent>
        </Card>

        {/* Right Column - Transactions List */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              Transacciones extraídas ({transactions.length})
            </CardTitle>
            {transactions.length > 0 && (
              <div
                className={`text-sm font-medium ${totalAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {totalAmount >= 0 ? "+" : ""}${totalAmount.toFixed(2)}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">
                  Las transacciones extraídas aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    isEditing={editingId === tx.id}
                    onEdit={() => setEditingId(tx.id)}
                    onSave={() => setEditingId(null)}
                    onDelete={() => handleDeleteTransaction(tx.id)}
                    onUpdate={(field, value) =>
                      handleUpdateTransaction(tx.id, field, value)
                    }
                    banks={banks}
                    cards={cards}
                    categories={categories}
                    budgets={budgets}
                  />
                ))}
              </div>
            )}

            {transactions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={handleSaveAll}
                  disabled={isSaving || transactions.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar todas ({transactions.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface TransactionItemProps {
  transaction: EditableTransaction;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUpdate: (
    field: keyof EditableTransaction,
    value: string | number | null,
  ) => void;
  banks: Array<{ id: string; name: string }>;
  cards: Array<{ id: string; name: string; last4: string | null }>;
  categories: Array<{ id: string; name: string }>;
  budgets: Array<{ id: string; name: string }>;
}

function TransactionItem({
  transaction,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onUpdate,
  banks,
  cards,
  categories,
  budgets,
}: TransactionItemProps) {
  const bank = banks.find((b) => b.id === transaction.bank_id);
  const card = cards.find((c) => c.id === transaction.card_id);
  const category = categories.find((c) => c.id === transaction.category_id);
  const budget = budgets.find((b) => b.id === transaction.budget_id);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <Select
            value={transaction.type}
            onValueChange={(v) => onUpdate("type", v)}
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Gasto</SelectItem>
              <SelectItem value="income">Ingreso</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onSave}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Input
          value={transaction.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          className="h-8 text-sm"
          placeholder="Descripción"
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            step="0.01"
            value={transaction.amount}
            onChange={(e) =>
              onUpdate("amount", parseFloat(e.target.value) || 0)
            }
            className="h-8 text-sm"
            placeholder="Monto"
          />
          <Input
            type="datetime-local"
            value={transaction.occurred_at.slice(0, 16)}
            onChange={(e) => onUpdate("occurred_at", e.target.value + ":00Z")}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={transaction.bank_id || "__none__"}
            onValueChange={(v) =>
              onUpdate("bank_id", v === "__none__" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin banco</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={transaction.card_id || "__none__"}
            onValueChange={(v) =>
              onUpdate("card_id", v === "__none__" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tarjeta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin tarjeta</SelectItem>
              {cards.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={transaction.category_id || "__none__"}
            onValueChange={(v) =>
              onUpdate("category_id", v === "__none__" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={transaction.budget_id || "__none__"}
            onValueChange={(v) =>
              onUpdate("budget_id", v === "__none__" ? null : v)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Presupuesto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin presupuesto</SelectItem>
              {budgets.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {transaction.type === "expense" ? (
              <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <span className="font-medium text-sm truncate">
              {transaction.description}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span>{formatDate(transaction.occurred_at)}</span>
            {bank && <span>{bank.name}</span>}
            {card && <span>•••• {card.last4}</span>}
            {category && <span>{category.name}</span>}
            {budget && <span>{budget.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-sm whitespace-nowrap ${
              transaction.type === "expense"
                ? "text-red-600"
                : "text-emerald-600"
            }`}
          >
            {transaction.type === "expense" ? "-" : "+"}$
            {transaction.amount.toFixed(2)}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
