"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Mail, Loader2, Sparkles, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <div className="flex-1 px-6 pt-0 overflow-hidden flex flex-col min-h-0">
            {transaction?.income_message_id ? (
              <Tabs defaultValue="transaction" className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="transaction" className="flex items-center gap-1.5">
                    <Receipt className="h-4 w-4" />
                    Transaction
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="transaction"
                  className="flex-1 overflow-y-auto mt-0 min-h-0"
                >
                  <button
                    type="button"
                    disabled={extractDataMutation.isPending}
                    onClick={handleExtractInfo}
                    className="mb-4 flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      {extractDataMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {extractDataMutation.isPending ? "Extracting..." : "Fill out from email"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Auto-fill fields using the linked email
                      </p>
                    </div>
                  </button>
                  {extractError && (
                    <p className="text-sm text-destructive mb-4">{extractError}</p>
                  )}
                  <TransactionForm
                    form={form}
                    cards={cards}
                    banks={banks}
                    budgets={budgets}
                  />
                </TabsContent>
                <TabsContent
                  value="email"
                  className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden"
                >
                  {!email ? (
                    <button
                      type="button"
                      onClick={loadEmail}
                      disabled={loadingEmail}
                      className="flex-1 w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50 transition-all p-8 flex flex-col items-center justify-center gap-2 min-h-0"
                    >
                      {loadingEmail ? (
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                      ) : (
                        <Mail className="h-8 w-8 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {loadingEmail
                          ? "Cargando..."
                          : emailError || "Ver email original"}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-lg">
                      <div className="shrink-0 px-4 py-3 bg-muted/50 border-b">
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
                      <div className="flex-1 min-h-0 w-full">
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta charset="utf-8">
                                <style>
                                  body {
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                    font-size: 13px;
                                    line-height: 1.6;
                                    color: #333;
                                    margin: 0;
                                    padding: 16px;
                                  }
                                  img { max-width: 100%; height: auto; }
                                  a { color: #0066cc; }
                                </style>
                              </head>
                              <body>${email.body}</body>
                            </html>
                          `}
                          className="w-full h-full border-0 rounded-b-lg"
                          sandbox="allow-same-origin"
                          title="Contenido del email"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="overflow-y-auto">
                <TransactionForm
                  form={form}
                  cards={cards}
                  banks={banks}
                  budgets={budgets}
                />
              </div>
            )}
          </div>
          <SheetFooter className="flex-row items-center px-6 pt-4 border-t">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => transaction && onDelete(transaction)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateTransaction.isPending || !description}
              >
                {updateTransaction.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
