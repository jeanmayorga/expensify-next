"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Mail, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  TransactionForm,
  TransactionFormData,
  defaultTransactionFormValues,
} from "./TransactionForm";
import { useUpdateTransaction } from "../hooks";
import { type TransactionWithRelations } from "../service";
import { type CardWithBank } from "../../cards/service";
import { type Bank } from "../../banks/service";
import { type Budget } from "../../budgets/service";
import {
  toEcuadorDateTimeLocal,
  fromEcuadorDateTimeLocalToUTC,
} from "@/utils/ecuador-time";
import { getEmail } from "../../../emails/service";
import { useExtractTransactionData } from "../../../emails/hooks";
import type { MicrosoftMeMessage } from "../../../emails/service";
import type { TransactionInsert } from "@/app/api/transactions/model";

/** Map extracted API data to form values (occurred_at → Ecuador local) */
function transactionInsertToFormData(
  insert: TransactionInsert,
): TransactionFormData {
  return {
    ...defaultTransactionFormValues,
    type: (insert.type as "expense" | "income") ?? "expense",
    description: insert.description ?? "",
    amount: insert.amount ?? 0,
    occurred_at: insert.occurred_at
      ? toEcuadorDateTimeLocal(insert.occurred_at)
      : toEcuadorDateTimeLocal(),
    card_id: insert.card_id ?? "",
    bank_id: insert.bank_id ?? "",
    budget_id: insert.budget_id ?? "",
    comment: insert.comment ?? "",
  };
}

interface EditTransactionSheetProps {
  transaction: TransactionWithRelations | null;
  onClose: () => void;
  onDelete: (tx: TransactionWithRelations) => void;
  cards: CardWithBank[];
  banks: Bank[];
  budgets: Budget[];
}

export function EditTransactionSheet({
  transaction,
  onClose,
  onDelete,
  cards,
  banks,
  budgets,
}: EditTransactionSheetProps) {
  const updateTransaction = useUpdateTransaction();
  const extractDataMutation = useExtractTransactionData();
  const [email, setEmail] = useState<MicrosoftMeMessage | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const form = useForm<TransactionFormData>({
    defaultValues: defaultTransactionFormValues,
  });

  const { handleSubmit, reset, watch } = form;

  const loadEmail = async () => {
    if (!transaction?.income_message_id) return;
    setLoadingEmail(true);
    setEmailError(null);
    try {
      const data = await getEmail(transaction.income_message_id);
      setEmail(data);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail(null);
      setEmailError(null);
      setExtractError(null);
      onClose();
    }
  };

  const handleExtractInfo = () => {
    if (!transaction?.income_message_id) return;
    setExtractError(null);
    extractDataMutation.mutate(transaction.income_message_id, {
      onSuccess: (data) => {
        setExtractError(null);
        reset(transactionInsertToFormData(data));
      },
      onError: (err) => {
        setExtractError(
          err instanceof Error ? err.message : "Error al extraer",
        );
      },
    });
  };

  // Reset form and email when transaction changes
  useEffect(() => {
    setEmail(null);
    setEmailError(null);
    setExtractError(null);
    if (transaction) {
      reset({
        type: transaction.type as "expense" | "income",
        description: transaction.description,
        amount: transaction.amount,
        occurred_at: transaction.occurred_at
          ? toEcuadorDateTimeLocal(transaction.occurred_at) // Convert UTC to Ecuador time
          : toEcuadorDateTimeLocal(),
        card_id: transaction.card_id || "",
        bank_id: transaction.bank_id || "",
        budget_id: transaction.budget_id || "",
        comment: transaction.comment || "",
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: TransactionFormData) => {
    if (!transaction) return;
    await updateTransaction.mutateAsync({
      id: transaction.id,
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        occurred_at: fromEcuadorDateTimeLocalToUTC(data.occurred_at), // Convert Ecuador time to UTC
        card_id: data.card_id || null,
        bank_id: data.bank_id || null,
        budget_id: data.budget_id || null,
        comment: data.comment || null,
      },
    });
    onClose();
  };

  const description = watch("description");

  return (
    <Sheet open={!!transaction} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Transacción</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 px-6 pt-0 overflow-y-auto">
            {transaction?.income_message_id && (
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={extractDataMutation.isPending}
                  onClick={handleExtractInfo}
                >
                  {extractDataMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5" />
                  )}
                  {extractDataMutation.isPending
                    ? "Extrayendo..."
                    : "Extract info"}
                </Button>
                {extractError && (
                  <p className="text-sm text-destructive">{extractError}</p>
                )}
              </div>
            )}
            <TransactionForm
              form={form}
              cards={cards}
              banks={banks}
              budgets={budgets}
            />

            {/* Ver email: si la transacción tiene income_message_id */}
            {transaction?.income_message_id && (
              <div className="mt-6 pt-6 border-t space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email original
                </h3>
                {!email ? (
                  <button
                    type="button"
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
                      {loadingEmail
                        ? "Cargando..."
                        : emailError || "Ver email original"}
                    </span>
                  </button>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b">
                      <p className="text-sm font-medium leading-tight">
                        {email.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{email.fromName || email.from}</span>
                        <span>·</span>
                        <span>
                          {format(
                            parseISO(email.receivedDateTime),
                            "d MMM, HH:mm",
                            { locale: es },
                          )}
                        </span>
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
                        title="Contenido del email"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <SheetFooter className="flex-col sm:flex-row px-6 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto"
              onClick={() => transaction && onDelete(transaction)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateTransaction.isPending || !description}
            >
              {updateTransaction.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
