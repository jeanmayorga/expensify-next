"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQueryState, parseAsString } from "nuqs";
import {
  useEmails,
  useEmail,
  useTransactionByMessageId,
  useExtractTransaction,
} from "./hooks";
import { useBanks } from "../banks/hooks";
import { type MicrosoftMeMessage } from "./service";
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

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export default function EmailsPage() {
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
  const whitelistedEmails = useMemo(
    () => banks.flatMap((bank) => bank.emails || []),
    [banks],
  );

  const extractMutation = useExtractTransaction();

  // Flatten all pages into a single array of emails
  const emails = useMemo(() => {
    return data?.pages.flatMap((page) => page.messages) ?? [];
  }, [data]);

  const handleSelectEmail = (email: MicrosoftMeMessage) => {
    setSelectedEmailId(email.id);
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
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-transparent",
                        selectedEmailId === email.id && "bg-muted",
                        isWhitelisted &&
                          "border-l-green-500 bg-green-50 dark:bg-green-950/20",
                      )}
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
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {loadingTransaction ? "Loading..." : "Find transaction"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      !whitelistedEmails.includes(selectedEmail.from) ||
                      extractMutation.isPending
                    }
                    onClick={() =>
                      selectedEmailId && extractMutation.mutate(selectedEmailId)
                    }
                  >
                    {extractMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    {extractMutation.isPending
                      ? "Extracting..."
                      : "Convert to transaction"}
                  </Button>
                </div>
                {/* Email Header */}
                <div className="px-4 py-3 border-b shrink-0">
                  <h2 className="text-lg font-semibold truncate">
                    {selectedEmail.subject || "(Sin asunto)"}
                  </h2>
                  <div className="space-y-0.5 text-sm mt-2">
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
    </div>
  );
}
