"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  X,
  ImageIcon,
  Building2,
  CreditCard,
  Wallet,
  Save,
  ArrowLeft,
  Play,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCards } from "../../cards/hooks";
import { useBanks } from "../../banks/hooks";
import { useBudgets } from "../../budgets/hooks";
import { BudgetLabel } from "../../budgets/components/BudgetLabel";
import { useExtractBulkFromImage, useCreateTransactions } from "../hooks";
import type { ParsedTransaction, ImageExtractionHints, TransactionInsert } from "../service";
import { ExtractedTransactionRow } from "@/app/(dashboard)/microsoft/daily-mailer-extractor/components/ExtractedTransactionRow";
import type { ExtractedItem } from "@/app/(dashboard)/microsoft/daily-mailer-extractor/types";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

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

export default function FromImagePage() {
  const router = useRouter();

  const { data: cards = [] } = useCards();
  const { data: banks = [] } = useBanks();
  const { data: budgets = [] } = useBudgets();

  const extractBulk = useExtractBulkFromImage();
  const createTransactions = useCreateTransactions();

  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBankId, setSelectedBankId] = useState<string>("__none__");
  const [selectedCardId, setSelectedCardId] = useState<string>("__none__");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("__none__");

  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [savingTempId, setSavingTempId] = useState<string | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());

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
      if (file) handleFileSelect(file);
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
      if (files?.length) handleFileSelect(files[0]);
    },
    [handleFileSelect],
  );

  const handleExtract = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Escribe o pega el texto de las transacciones");
      return;
    }

    setError(null);

    const hints: ImageExtractionHints = {};
    if (selectedBankId !== "__none__") hints.preselectedBankId = selectedBankId;
    if (selectedCardId !== "__none__") hints.preselectedCardId = selectedCardId;
    if (selectedBudgetId !== "__none__") hints.preselectedBudgetId = selectedBudgetId;

    try {
      const result = await extractBulk.mutateAsync({
        text: trimmed,
        ...(pendingImage
          ? { image: pendingImage.base64, mimeType: pendingImage.mimeType }
          : {}),
        hints,
      });

      const defaultBudget =
        selectedBudgetId !== "__none__" ? selectedBudgetId : null;

      const items: ExtractedItem[] = result.map((tx: ParsedTransaction, i: number) => ({
        tempId: `ext-${Date.now()}-${i}`,
        data: {
          ...tx,
          payment_method: tx.card_id ? "card" : "transfer",
          budget_id: defaultBudget,
        } as TransactionInsert,
      }));

      setExtractedItems(items);
    } catch (err) {
      setError("Error al extraer transacciones. Intenta de nuevo.");
      console.error("Extraction error:", err);
    }
  }, [
    text,
    pendingImage,
    selectedBankId,
    selectedCardId,
    selectedBudgetId,
    extractBulk,
  ]);

  const updateItem = useCallback((tempId: string, patch: Partial<TransactionInsert>) => {
    setExtractedItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId ? { ...i, data: { ...i.data, ...patch } } : i,
      ),
    );
  }, []);

  const removeItems = useCallback((tempIds: string[]) => {
    setExtractedItems((prev) => prev.filter((i) => !tempIds.includes(i.tempId)));
    setSelectedForDelete(new Set());
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (extractedItems.length === 0) return;

    setSavingTempId("all");
    try {
      const payloads = extractedItems.map((i) => i.data);
      await createTransactions.mutateAsync(payloads);
      router.push("..");
    } catch (err) {
      setError("Error al guardar las transacciones.");
      console.error("Save error:", err);
    } finally {
      setSavingTempId(null);
    }
  }, [extractedItems, createTransactions, router]);

  const handleClearImage = useCallback(() => {
    setPreview(null);
    setPendingImage(null);
  }, []);

  const isLoading = isCompressing || extractBulk.isPending;
  const isSaving = createTransactions.isPending;
  const canExtract = text.trim().length > 0 && !isLoading;

  const totalAmount = extractedItems.reduce((sum, item) => {
    return item.data.type === "expense"
      ? sum - item.data.amount
      : sum + item.data.amount;
  }, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => router.push("..")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Extraer transacciones
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Solo texto o texto + imagen. El texto puede ser las transacciones o contexto para la imagen.
          </p>
        </div>
      </div>

      {/* Two columns - same layout as daily/monthly extractor */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Left: Text + optional image */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3 px-4 sm:px-5">
            <CardTitle className="text-sm font-medium">
              Texto e imagen (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
            {/* Text - primary input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Texto de transacciones o contexto
              </label>
              <Textarea
                placeholder="Ej: Café Starbucks $5.50
Supermercado $45.30

O pega el estado de cuenta. Si agregas imagen, este texto será el contexto."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] resize-none text-sm sm:min-h-[140px]"
                disabled={isLoading}
              />
            </div>

            {/* Optional image */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Imagen (opcional)
              </label>
              {preview ? (
                <div className="relative rounded-lg border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="max-h-40 w-full object-contain rounded-lg sm:max-h-48"
                  />
                  {!isLoading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7 bg-background/90 hover:bg-background"
                      onClick={handleClearImage}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 transition-colors sm:py-8",
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50",
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {isDragging ? "Suelta aquí" : "Arrastra imagen o haz clic"}
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
                        <BudgetLabel
                          budget={budget}
                          iconClassName="h-3.5 w-3.5"
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleExtract}
              disabled={!canExtract}
            >
              {extractBulk.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extrayendo...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Extraer transacciones
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Extracted transactions - same as daily/monthly */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3 px-4 sm:px-5">
            <CardTitle className="text-sm font-medium">
              Transacciones extraídas
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedForDelete.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={() => removeItems([...selectedForDelete])}
                >
                  Eliminar ({selectedForDelete.size})
                </Button>
              )}
              <Button
                onClick={handleSaveAll}
                disabled={extractedItems.length === 0 || !!savingTempId}
                size="sm"
                className="h-8"
              >
                {savingTempId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Guardar todo
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            {extractedItems.length === 0 ? (
              <Empty className="min-h-[200px] border-0 p-6 sm:min-h-[240px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileSearch className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">
                    Sin transacciones
                  </EmptyTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escribe o pega el texto y extrae. Las transacciones aparecerán aquí.
                  </p>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {extractedItems.length > 0 && (
                  <div className="px-4 py-2 border-b bg-muted/30">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        totalAmount >= 0 ? "text-emerald-600" : "text-red-600",
                      )}
                    >
                      {totalAmount >= 0 ? "+" : ""}${totalAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex-1 overflow-auto min-h-[140px] max-h-[360px] divide-y">
                  {extractedItems.map((item) => (
                    <ExtractedTransactionRow
                      key={item.tempId}
                      item={item}
                      banks={banks}
                      cards={cards}
                      budgets={budgets}
                      onUpdate={(patch) => updateItem(item.tempId, patch)}
                      onRemove={() => removeItems([item.tempId])}
                      isSaving={savingTempId === item.tempId || savingTempId === "all"}
                      selected={selectedForDelete.has(item.tempId)}
                      onToggleSelect={() => {
                        setSelectedForDelete((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.tempId)) next.delete(item.tempId);
                          else next.add(item.tempId);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
