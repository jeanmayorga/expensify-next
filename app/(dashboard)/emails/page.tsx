"use client";

import { Suspense, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQueryState, parseAsString } from "nuqs";
import {
  useEmails,
  useEmail,
  useTransactionByMessageId,
  useExtractTransactionData,
} from "./hooks";
import { useBanks } from "../[month]/banks/hooks";
import { useCategories } from "../[month]/categories/hooks";
import { useCards } from "../[month]/cards/hooks";
import { useBudgets } from "../[month]/budgets/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  type MicrosoftMeMessage,
  type TransactionWithRelations,
  type TransactionInsert,
} from "./service";
import { EditTransactionSheet } from "../[month]/transactions/components/EditTransactionSheet";
import { DeleteTransactionDialog } from "../[month]/transactions/components/DeleteTransactionDialog";
import { CreateTransactionSheet } from "../[month]/transactions/components/CreateTransactionSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  CalendarIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Get today's date in YYYY-MM-DD format (using local timezone)
const getTodayDate = () => {
  return format(new Date(), "yyyy-MM-dd");
};

function EmailsPageContent() {
  const [selectedDate, setSelectedDate] = useQueryState(
    "date",
    parseAsString.withDefault(getTodayDate()),
  );
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useEmails(selectedDate);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: selectedEmail, isLoading: loadingEmail } = useEmail(
    selectedEmailId || "",
  );

  const { data: linkedTransaction, isLoading: loadingTransaction } =
    useTransactionByMessageId(selectedEmailId || "");

  const { data: banks = [] } = useBanks();
  const { data: categories = [] } = useCategories();
  const { data: cards = [] } = useCards();
  const { data: budgets = [] } = useBudgets();
  const whitelistedEmails = useMemo(
    () => banks.flatMap((bank) => bank.emails || []),
    [banks],
  );
  /** Map email address -> bank (first bank that has this email in emails[]) */
  const bankByEmail = useMemo(() => {
    const map = new Map<string, (typeof banks)[number]>();
    for (const bank of banks) {
      for (const email of bank.emails || []) {
        if (email && !map.has(email)) map.set(email, bank);
      }
    }
    return map;
  }, [banks]);
  const blacklistedSubjects = useMemo(
    () => banks.flatMap((bank) => bank.blacklisted_subjects || []),
    [banks],
  );

  const queryClient = useQueryClient();
  const extractDataMutation = useExtractTransactionData();

  // State for editing transaction sheet
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);

  // State for delete transaction dialog
  const [deletingTransaction, setDeletingTransaction] =
    useState<TransactionWithRelations | null>(null);

  // State for create sheet with extracted data (Convert to transaction)
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<TransactionInsert | null>(
    null,
  );
  const [extractError, setExtractError] = useState<string | null>(null);

  // Flatten all pages into a single array of emails
  const emails = useMemo(() => {
    return data?.pages.flatMap((page) => page.messages) ?? [];
  }, [data]);

  // Check if an email subject is blacklisted
  const isSubjectBlacklisted = (subject: string | undefined) => {
    const subjectUpper = subject?.toUpperCase() || "";
    return blacklistedSubjects.some((blacklisted) =>
      subjectUpper.includes(blacklisted.toUpperCase()),
    );
  };

  const handleSelectEmail = (email: MicrosoftMeMessage) => {
    setSelectedEmailId(email.id);
    setExtractError(null);
  };

  // Convert string date to Date object for calendar
  const selectedDateObj = selectedDate
    ? new Date(selectedDate + "T12:00:00")
    : new Date();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setSelectedDate(dateStr);
      setCalendarOpen(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Emails</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Error al cargar los emails. Asegúrate de estar autenticado con
              Microsoft.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Emails</h1>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {selectedDate ? (
                format(selectedDateObj, "EEEE, d/MMMM/yyyy", {
                  locale: es,
                })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDateObj}
              onSelect={handleDateSelect}
              locale={es}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Grid Layout: 3 cols for list, 5 cols for detail */}
      <div className="grid grid-cols-8 gap-4 h-[calc(100vh-200px)]">
        {/* Email List - 3 columns */}
        <Card className="col-span-3 overflow-hidden flex flex-col py-0 gap-0">
          {/* List Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
            <span className="text-sm text-muted-foreground">
              {emails.length} emails
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  (isLoading || isRefetching) && "animate-spin",
                )}
              />
            </Button>
          </div>
          <CardContent className="p-0 flex-1 overflow-auto">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="px-3 py-2 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay emails en esta fecha
              </div>
            ) : (
              <div className="divide-y">
                {emails.map((email) => {
                  const isWhitelisted = whitelistedEmails.includes(email.from);
                  const isBlacklisted = isSubjectBlacklisted(email.subject);
                  const shouldHighlight = isWhitelisted && !isBlacklisted;
                  const bank = bankByEmail.get(email.from);
                  const bankColor = bank?.color ?? null;
                  const highlightStyle =
                    shouldHighlight && bankColor
                      ? {
                          borderLeftColor: bankColor,
                          backgroundColor: `${bankColor}15`,
                        }
                      : undefined;
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-transparent",
                        selectedEmailId === email.id && "bg-muted",
                        shouldHighlight &&
                          !bankColor &&
                          "border-l-green-500 bg-green-50 dark:bg-green-950/20",
                      )}
                      style={highlightStyle}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-semibold text-sm">
                          {email.fromName || email.from}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {email.receivedDateTime
                            ? format(
                                new Date(email.receivedDateTime),
                                "HH:mm",
                                { locale: es },
                              )
                            : "—"}
                        </div>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {email.fromName ? email.from : "\u00A0"}
                      </div>
                      <div className="truncate text-sm">
                        {email.subject || "(Sin asunto)"}
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        "Cargar más"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Detail - 5 columns */}
        <Card className="col-span-5 overflow-hidden flex flex-col py-0 gap-0">
          <CardContent className="p-0 flex-1 overflow-auto">
            {!selectedEmailId ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un email para ver su contenido</p>
                </div>
              </div>
            ) : loadingEmail ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-64 w-full mt-4" />
              </div>
            ) : selectedEmail ? (
              <div className="flex flex-col h-full">
                {/* Actions Header */}
                <div className="flex items-center justify-end gap-2 px-3 py-2 border-b shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      !whitelistedEmails.includes(selectedEmail.from) ||
                      !linkedTransaction ||
                      loadingTransaction
                    }
                    onClick={() =>
                      linkedTransaction &&
                      setEditingTransaction(linkedTransaction)
                    }
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {loadingTransaction ? "Loading..." : "Find transaction"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      !whitelistedEmails.includes(selectedEmail.from) ||
                      extractDataMutation.isPending
                    }
                    onClick={() => {
                      if (!selectedEmailId) return;
                      setExtractError(null);
                      extractDataMutation.mutate(selectedEmailId, {
                        onSuccess: (data) => {
                          setExtractError(null);
                          setExtractedData(data);
                          setCreateSheetOpen(true);
                        },
                        onError: (err) => {
                          setExtractError(
                            err instanceof Error
                              ? err.message
                              : "Error al extraer",
                          );
                        },
                      });
                    }}
                  >
                    {extractDataMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    {extractDataMutation.isPending
                      ? "Extrayendo..."
                      : "Convert to transaction"}
                  </Button>
                  {extractError && (
                    <p className="text-sm text-destructive mt-1">
                      {extractError}
                    </p>
                  )}
                </div>
                {/* Email Header */}
                <div className="px-4 py-3 border-b shrink-0">
                  <h2 className="text-lg font-semibold truncate">
                    {selectedEmail.subject || "(Sin asunto)"}
                  </h2>
                  <div className="space-y-0.5 text-sm mt-2">
                    <div className="flex gap-2 items-center">
                      <span className="font-medium w-14 shrink-0">ID:</span>
                      <a
                        href={`/api/microsoft/me/messages/${selectedEmail.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate font-mono text-xs"
                      >
                        {selectedEmail.id}
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-14">De:</span>
                      <span className="text-muted-foreground truncate">
                        {selectedEmail.fromName || selectedEmail.from}
                        {selectedEmail.fromName && (
                          <span className="ml-1">({selectedEmail.from})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-14">Fecha:</span>
                      <span className="text-muted-foreground">
                        {selectedEmail.receivedDateTime
                          ? format(
                              new Date(selectedEmail.receivedDateTime),
                              "EEEE, d 'de' MMMM 'de' yyyy, HH:mm",
                              { locale: es },
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Body - Isolated in iframe */}
                <div className="flex-1 overflow-hidden">
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8">
                          <style>
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                              font-size: 14px;
                              line-height: 1.5;
                              color: #333;
                              margin: 0;
                              padding: 16px;
                            }
                            img { max-width: 100%; height: auto; }
                            a { color: #0066cc; }
                          </style>
                        </head>
                        <body>${selectedEmail.body}</body>
                      </html>
                    `}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                    title="Email content"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No se pudo cargar el email
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Transaction Sheet */}
      <EditTransactionSheet
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onDelete={(tx) => {
          setEditingTransaction(null);
          // Defer opening the delete dialog until after the sheet has closed
          // (avoids Radix Dialog/Sheet conflict when opening one while the other closes)
          setTimeout(() => setDeletingTransaction(tx), 0);
        }}
        categories={categories}
        cards={cards}
        banks={banks}
        budgets={budgets}
      />

      {/* Delete Transaction Dialog */}
      <DeleteTransactionDialog
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
      />

      {/* Create Transaction Sheet (pre-filled from extracted email data) */}
      <CreateTransactionSheet
        open={createSheetOpen}
        onOpenChange={(open) => {
          setCreateSheetOpen(open);
          if (!open) setExtractedData(null);
        }}
        categories={categories}
        cards={cards}
        banks={banks}
        budgets={budgets}
        initialData={extractedData}
        onCreatedFromMessage={(messageId) => {
          queryClient.invalidateQueries({
            queryKey: ["transactions", "by-message", messageId],
          });
        }}
      />
    </div>
  );
}

function EmailsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-8 gap-4 h-[calc(100vh-200px)]">
        <Card className="col-span-3">
          <CardContent className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-5">
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={<EmailsPageSkeleton />}>
      <EmailsPageContent />
    </Suspense>
  );
}
