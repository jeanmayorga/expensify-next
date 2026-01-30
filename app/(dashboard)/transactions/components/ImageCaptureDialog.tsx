"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import {
  Camera,
  Upload,
  Loader2,
  X,
  ImageIcon,
  Building2,
  CreditCard,
  Tag,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Bank } from "@/app/api/banks/model";
import type { Category } from "@/app/api/categories/model";
import type { CardWithBank } from "@/app/api/cards/model";
import type { Budget } from "@/app/api/budgets/model";
import type { ImageExtractionHints } from "../service";

interface ImageCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageCaptured: (
    imageBase64: string,
    mimeType: string,
    hints: ImageExtractionHints,
  ) => void;
  isProcessing?: boolean;
  banks: Bank[];
  cards: CardWithBank[];
  categories: Category[];
  budgets: Budget[];
}

const MAX_DIMENSION = 1024;
const INITIAL_QUALITY = 0.7;
const REDUCED_QUALITY = 0.5;
const MAX_SIZE_KB = 500;

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

      // Scale down if needed
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

      // Try with initial quality
      let dataUrl = canvas.toDataURL("image/jpeg", INITIAL_QUALITY);
      let base64 = dataUrl.split(",")[1];

      // If still too large, reduce quality
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

export function ImageCaptureDialog({
  open,
  onOpenChange,
  onImageCaptured,
  isProcessing = false,
  banks,
  cards,
  categories,
  budgets,
}: ImageCaptureDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Hints state
  const [userContext, setUserContext] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("__none__");
  const [selectedCardId, setSelectedCardId] = useState<string>("__none__");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("__none__");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("__none__");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handleFileSelect],
  );

  // Drag and drop handlers
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

  const handleConfirm = useCallback(() => {
    if (pendingImage) {
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
      onImageCaptured(pendingImage.base64, pendingImage.mimeType, hints);
    }
  }, [
    pendingImage,
    userContext,
    selectedBankId,
    selectedCardId,
    selectedCategoryId,
    selectedBudgetId,
    onImageCaptured,
  ]);

  const resetState = useCallback(() => {
    setPreview(null);
    setPendingImage(null);
    setError(null);
    setUserContext("");
    setSelectedBankId("__none__");
    setSelectedCardId("__none__");
    setSelectedCategoryId("__none__");
    setSelectedBudgetId("__none__");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setPendingImage(null);
    setError(null);
  }, []);

  const isLoading = isCompressing || isProcessing;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capturar recibo</DialogTitle>
          <DialogDescription>
            Toma una foto o sube una imagen de tu recibo para extraer
            automáticamente los datos de la transacción.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Image Preview or Drop Zone */}
          {preview ? (
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full max-h-48 object-contain rounded-lg border bg-muted"
              />
              {!isLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={handleRetake}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {isCompressing ? "Comprimiendo..." : "Extrayendo datos..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Drop Zone */}
              <div
                className={`flex items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
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
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm text-center px-4">
                    {isDragging
                      ? "Suelta la imagen aquí"
                      : "Arrastra una imagen aquí o haz clic para seleccionar"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Cámara
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Galería
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Context and Filters - Only show when image is selected */}
          {pendingImage && (
            <div className="space-y-4 border-t pt-4">
              {/* User Context */}
              <div className="space-y-2">
                <label htmlFor="userContext" className="text-sm font-medium">
                  Contexto adicional (opcional)
                </label>
                <Textarea
                  id="userContext"
                  placeholder="Ej: Compra de materiales de oficina, almuerzo con cliente..."
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  className="resize-none h-16 text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Pre-select Filters */}
              <div className="grid grid-cols-2 gap-3">
                {/* Bank */}
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

                {/* Card */}
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

                {/* Category */}
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

                {/* Budget */}
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
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!pendingImage || isLoading}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extrayendo...
              </>
            ) : (
              "Extraer datos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
