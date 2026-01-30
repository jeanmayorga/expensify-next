"use client";

import { useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Clock,
  Building2,
  CreditCard,
  Tag,
  Wallet,
  Mail,
  Loader2,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { type TransactionWithRelations } from "../service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

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

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${valueClassName || ""}`}>{value}</p>
      </div>
    </div>
  );
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

  // Reset email state when transaction changes
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
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Amount Header */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isExpense ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {isExpense ? (
                <TrendingDown className="h-5 w-5 text-white" />
              ) : (
                <TrendingUp className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  isExpense ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
              </p>
              <Badge variant={isExpense ? "destructive" : "default"} className="text-xs">
                {isExpense ? "Gasto" : "Ingreso"}
              </Badge>
            </div>
          </div>

          <SheetTitle className="text-left text-base mt-2">
            {tx.description}
          </SheetTitle>
          <SheetDescription className="text-left">
            ID: #{tx.id}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Details Section */}
        <div className="py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Detalles
          </h3>

          <DetailRow
            icon={Calendar}
            label="Fecha"
            value={format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          />

          <DetailRow
            icon={Clock}
            label="Hora"
            value={format(date, "HH:mm:ss")}
          />

          {tx.bank && (
            <div className="flex items-start gap-3 py-3">
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
                <p className="text-xs text-muted-foreground mb-0.5">Banco</p>
                <p className="text-sm font-medium">{tx.bank.name}</p>
              </div>
            </div>
          )}

          {tx.card && (
            <DetailRow
              icon={CreditCard}
              label="Tarjeta"
              value={
                <span>
                  {tx.card.name}
                  {tx.card.last4 && (
                    <span className="text-muted-foreground ml-1">
                      •••• {tx.card.last4}
                    </span>
                  )}
                </span>
              }
            />
          )}

          {tx.category && (
            <DetailRow
              icon={Tag}
              label="Categoría"
              value={
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: tx.category.color ? `${tx.category.color}20` : undefined,
                    color: tx.category.color || undefined,
                  }}
                >
                  {tx.category.name}
                </Badge>
              }
            />
          )}

          {tx.budget && (
            <DetailRow
              icon={Wallet}
              label="Presupuesto"
              value={tx.budget.name}
            />
          )}

          <DetailRow
            icon={FileText}
            label="Tipo de registro"
            value={tx.is_manual ? "Manual" : "Automático (desde email)"}
          />
        </div>

        <Separator />

        {/* Email Section */}
        <div className="py-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Email Original
          </h3>

          {!tx.income_message_id ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Esta transacción no tiene un email asociado
              </p>
            </div>
          ) : !email ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                {emailError || "El email no ha sido cargado"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadEmail}
                disabled={loadingEmail}
              >
                {loadingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Cargar Email
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              {/* Email Header */}
              <div className="p-3 border-b bg-muted/50">
                <p className="text-sm font-medium truncate">{email.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  De: {email.fromName || email.from}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(email.receivedDateTime), "d MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              {/* Email Body */}
              <div
                className="p-3 text-xs max-h-64 overflow-y-auto prose prose-sm prose-gray dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: email.body }}
              />
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
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
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onDelete(tx);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
