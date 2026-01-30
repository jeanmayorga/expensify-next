"use client";

import { useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  Building2,
  CreditCard,
  Mail,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
  HandCoins,
} from "lucide-react";
import { type TransactionWithRelations } from "../service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface EmailData {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  receivedDateTime: string;
  body: string;
}

interface TransactionSheetProps {
  transaction: TransactionWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tx: TransactionWithRelations) => void;
  onDelete: (tx: TransactionWithRelations) => void;
}

function parseDate(date: string | Date): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }
  return date;
}

export function TransactionSheet({
  transaction: tx,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TransactionSheetProps) {
  const [email, setEmail] = useState<EmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const loadEmail = async () => {
    if (!tx?.income_message_id) return;

    setLoadingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch(`/api/microsoft/me/messages/${tx.income_message_id}`);
      if (!response.ok) {
        throw new Error("No se pudo cargar el email");
      }
      const { data } = await response.json();
      setEmail(data);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail(null);
      setEmailError(null);
    }
    onOpenChange(newOpen);
  };

  if (!tx) return null;

  const isExpense = tx.type === "expense";
  const date = parseDate(tx.occurred_at);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col">
        <VisuallyHidden>
          <SheetTitle>Detalles de transacción</SheetTitle>
        </VisuallyHidden>
        {/* Hero Header */}
        <div
          className={`relative px-6 pt-12 pb-6 ${
            isExpense
              ? "bg-gradient-to-br from-red-500 to-red-600"
              : "bg-gradient-to-br from-emerald-500 to-emerald-600"
          }`}
        >
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-20">
            {isExpense ? (
              <TrendingDown className="h-24 w-24 text-white" />
            ) : (
              <TrendingUp className="h-24 w-24 text-white" />
            )}
          </div>

          {/* Amount */}
          <p className="text-4xl font-bold text-white tracking-tight">
            {isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
          </p>

          {/* Description */}
          <p className="text-white/90 font-medium mt-2 text-lg leading-tight">
            {tx.description}
          </p>

          {/* Date & Time */}
          <p className="text-white/70 text-sm mt-3">
            {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            <span className="mx-2">·</span>
            {format(date, "HH:mm")}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Info Rows */}
          <div className="space-y-1">
            {/* Bank */}
            {tx.bank && (
              <div className="flex items-center gap-3 py-2.5 border-b">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  {tx.bank.image ? (
                    <Image
                      src={tx.bank.image}
                      alt={tx.bank.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="text-sm font-medium truncate">{tx.bank.name}</p>
                </div>
              </div>
            )}

            {/* Card */}
            {tx.card && (
              <div className="flex items-center gap-3 py-2.5 border-b">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: tx.card.color ? `${tx.card.color}20` : undefined,
                  }}
                >
                  <CreditCard
                    className="h-4 w-4"
                    style={{ color: tx.card.color || "currentColor" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Tarjeta</p>
                  <p className="text-sm font-medium truncate">
                    {tx.card.name}
                    {tx.card.last4 && (
                      <span className="text-muted-foreground ml-1">•••• {tx.card.last4}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Category */}
            {tx.category && (
              <div className="flex items-center gap-3 py-2.5 border-b">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: tx.category.color ? `${tx.category.color}20` : undefined,
                  }}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tx.category.color || "#888" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Categoría</p>
                  <p className="text-sm font-medium" style={{ color: tx.category.color || undefined }}>
                    {tx.category.name}
                  </p>
                </div>
              </div>
            )}

            {/* Budget */}
            {tx.budget && (
              <div className="flex items-center gap-3 py-2.5 border-b">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <HandCoins className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Presupuesto</p>
                  <p className="text-sm font-medium truncate">{tx.budget.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              {tx.is_manual ? (
                <>
                  <Pencil className="h-3 w-3" />
                  Manual
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Automático
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ID: {tx.id}
            </span>
          </div>

          {/* Email Section */}
          {tx.income_message_id && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Original
              </h3>

              {!email ? (
                <button
                  onClick={loadEmail}
                  disabled={loadingEmail}
                  className="w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50 transition-all p-4 flex flex-col items-center gap-2"
                >
                  {loadingEmail ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : (
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {loadingEmail ? "Cargando..." : emailError || "Ver email original"}
                  </span>
                </button>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 border-b">
                    <p className="text-sm font-medium leading-tight">{email.subject}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{email.fromName || email.from}</span>
                      <span>·</span>
                      <span>{format(parseISO(email.receivedDateTime), "d MMM, HH:mm", { locale: es })}</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="utf-8">
                            <style>
                              body {
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                font-size: 12px;
                                line-height: 1.5;
                                color: #333;
                                margin: 0;
                                padding: 12px;
                              }
                              img { max-width: 100%; height: auto; }
                              a { color: #0066cc; }
                            </style>
                          </head>
                          <body>${email.body}</body>
                        </html>
                      `}
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin"
                      title="Email content"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onEdit(tx);
                onOpenChange(false);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onDelete(tx);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
