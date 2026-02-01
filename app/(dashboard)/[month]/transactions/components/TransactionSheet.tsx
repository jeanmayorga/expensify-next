"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getEcuadorDate } from "@/utils/ecuador-time";
import {
  TrendingDown,
  TrendingUp,
  Building2,
  CreditCard,
  Mail,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
  HandCoins,
  Tag,
  MessageSquare,
} from "lucide-react";
import { type TransactionWithRelations } from "../service";
import { getEmail, type MicrosoftMeMessage } from "../../../emails/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { CreditCardMini } from "./CreditCardMini";
import { BankCardMini } from "./BankCardMini";
import { CategoryMini } from "./CategoryMini";
import { BudgetMini } from "./BudgetMini";

interface TransactionSheetProps {
  transaction: TransactionWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tx: TransactionWithRelations) => void;
  onDelete: (tx: TransactionWithRelations) => void;
}

function parseDate(date: string | Date): Date {
  if (typeof date === "string") {
    // Parse as UTC then convert to Ecuador timezone for display
    const utcDate = parseISO(date);
    return getEcuadorDate(utcDate);
  }
  return getEcuadorDate(date);
}

export function TransactionSheet({
  transaction: tx,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TransactionSheetProps) {
  const [email, setEmail] = useState<MicrosoftMeMessage | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const loadEmail = async () => {
    if (!tx?.income_message_id) return;

    setLoadingEmail(true);
    setEmailError(null);

    try {
      const data = await getEmail(tx.income_message_id);
      setEmail(data);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Unknown error");
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
          <SheetTitle>Transaction details</SheetTitle>
        </VisuallyHidden>

        {/* Hero Header */}
        <div
          className={`relative px-6 pt-12 pb-6 ${
            isExpense
              ? "bg-gradient-to-br from-red-500 to-red-600"
              : "bg-gradient-to-br from-emerald-500 to-emerald-600"
          }`}
        >
          <div className="absolute top-4 right-4 opacity-20">
            {isExpense ? (
              <TrendingDown className="h-24 w-24 text-white" />
            ) : (
              <TrendingUp className="h-24 w-24 text-white" />
            )}
          </div>

          <p className="text-4xl font-bold text-white tracking-tight">
            {isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
          </p>

          <p className="text-white/90 font-medium mt-2 text-lg leading-tight">
            {tx.description}
          </p>

          <p className="text-white/70 text-sm mt-3">
            {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            <span className="mx-2">·</span>
            {format(date, "HH:mm")}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Card - Mini visual */}
          {tx.card && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Card Used
              </h3>
              <CreditCardMini card={tx.card} />
            </div>
          )}

          {/* Bank - Visual card */}
          {tx.bank && !tx.card && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Bank Account
              </h3>
              <BankCardMini bank={tx.bank} />
            </div>
          )}

          {/* Bank info when card is present */}
          {tx.bank && tx.card && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Bank
              </h3>
              <BankCardMini bank={tx.bank} />
            </div>
          )}

          {/* Category */}
          {tx.category && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Category
              </h3>
              <CategoryMini category={tx.category} />
            </div>
          )}

          {/* Budget */}
          {tx.budget && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <HandCoins className="h-3.5 w-3.5" />
                Budget
              </h3>
              <BudgetMini budget={tx.budget} />
            </div>
          )}

          {/* Comment */}
          {tx.comment && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comment
              </h3>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {tx.comment}
                </p>
              </div>
            </div>
          )}

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
                  Automatic
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">ID: {tx.id}</span>
          </div>

          {/* Email Section */}
          {tx.income_message_id && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Original Email
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
                    {loadingEmail
                      ? "Loading..."
                      : emailError || "View original email"}
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
              Edit
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
