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
} from "../emails/hooks";
import {
  useSubscriptions,
  useCreateSubscription,
} from "../subscriptions/hooks";
import { SubscriptionRow } from "../subscriptions/SubscriptionRow";
import { useBanks } from "../[month]/banks/hooks";
import { useCards } from "../[month]/cards/hooks";
import { useBudgets } from "../[month]/budgets/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  type MicrosoftMeMessage,
  type TransactionWithRelations,
  type TransactionInsert,
} from "../emails/service";
import { EditTransactionSheet } from "../[month]/transactions/components/EditTransactionSheet";
import { DeleteTransactionDialog } from "../[month]/transactions/components/DeleteTransactionDialog";
import { CreateTransactionSheet } from "../[month]/transactions/components/CreateTransactionSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Bell,
  Loader2,
  RefreshCw,
  Sparkles,
  Eye,
  Plus,
  List,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EmailList } from "./components/EmailList";

type Tab = "emails" | "subscriptions";

const getTodayDate = () => format(new Date(), "yyyy-MM-dd");

function EmailsContent({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
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

  const { data: selectedEmail, isLoading: loadingEmail } = useEmail(
    selectedEmailId || "",
  );

  const { data: linkedTransaction, isLoading: loadingTransaction } =
    useTransactionByMessageId(selectedEmailId || "");

  const { data: banks = [] } = useBanks();
  const { data: cards = [] } = useCards();
  const { data: budgets = [] } = useBudgets();
  const whitelistedEmails = useMemo(
    () => banks.flatMap((bank) => bank.emails || []),
    [banks],
  );
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

  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<TransactionWithRelations | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<TransactionInsert | null>(
    null,
  );
  const [emailsSheetOpen, setEmailsSheetOpen] = useState(false);

  const emails = useMemo(() => {
    return data?.pages.flatMap((page) => page.messages) ?? [];
  }, [data]);

  const isSubjectBlacklisted = (subject: string | undefined) => {
    const subjectUpper = subject?.toUpperCase() || "";
    return blacklistedSubjects.some((blacklisted) =>
      subjectUpper.includes(blacklisted.toUpperCase()),
    );
  };

  const handleSelectEmail = (email: MicrosoftMeMessage) => {
    setSelectedEmailId(email.id);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Error al cargar los emails. Asegúrate de estar autenticado con
            Microsoft.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Tab Buttons + Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "emails" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("emails")}
          >
            <Mail className="h-4 w-4" />
            Emails
          </Button>
          <Button
            variant={activeTab === "subscriptions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("subscriptions")}
          >
            <Bell className="h-4 w-4" />
            Subscriptions
          </Button>
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={cn(
            "w-full min-w-0 max-w-44 shrink-0 sm:w-auto",
            !selectedDate && "text-muted-foreground",
          )}
        />
      </div>

      {/* Mobile: button to open email list sheet */}
      <div className="flex md:hidden">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setEmailsSheetOpen(true)}
        >
          <List className="h-4 w-4 mr-2" />
          Ver lista de emails ({emails.length})
        </Button>
      </div>

      {/* Grid: on mobile only detail; on md+ list + detail */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-8 min-h-[50vh] md:min-h-[calc(100vh-250px)]">
        {/* Email List - desktop: sidebar; mobile: inside Sheet below */}
        <Card className="hidden overflow-hidden flex-col py-0 gap-0 md:flex md:col-span-3">
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
            <EmailList
              emails={emails}
              selectedEmailId={selectedEmailId}
              onSelectEmail={handleSelectEmail}
              isLoading={isLoading}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              whitelistedEmails={whitelistedEmails}
              bankByEmail={bankByEmail}
              isSubjectBlacklisted={isSubjectBlacklisted}
            />
          </CardContent>
        </Card>

        {/* Email Detail */}
        <Card className="col-span-1 overflow-hidden flex flex-col py-0 gap-0 md:col-span-5">
          <CardContent className="p-0 flex-1 overflow-auto flex flex-col min-h-0">
            {!selectedEmailId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un email para ver su contenido</p>
                </div>
                <Button
                  variant="outline"
                  className="md:hidden"
                  onClick={() => setEmailsSheetOpen(true)}
                >
                  <List className="h-4 w-4 mr-2" />
                  Abrir lista de emails
                </Button>
              </div>
            ) : loadingEmail ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-64 w-full mt-4" />
              </div>
            ) : selectedEmail ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setEmailsSheetOpen(true)}
                    aria-label="Ver lista de emails"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-end gap-2 ml-auto">
                  {linkedTransaction ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!whitelistedEmails.includes(selectedEmail.from)}
                      onClick={() =>
                        setEditingTransaction(linkedTransaction)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Find transaction
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        !whitelistedEmails.includes(selectedEmail.from) ||
                        extractDataMutation.isPending
                      }
                      onClick={() => {
                        if (!selectedEmailId) return;
                        extractDataMutation.mutate(selectedEmailId, {
                          onSuccess: (data) => {
                            setExtractedData(data);
                            setCreateSheetOpen(true);
                          },
                          onError: (err) => {
                            const message =
                              err instanceof Error
                                ? err.message
                                : "Error al extraer";
                            toast.error(message);
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
                  )}
                  </div>
                </div>
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

      {/* Mobile: Sheet with email list */}
      <Sheet open={emailsSheetOpen} onOpenChange={setEmailsSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-full flex-col p-0 sm:max-w-sm"
          showCloseButton
        >
          <SheetHeader className="border-b shrink-0 px-3 py-2 pr-12">
            <div className="flex items-center justify-between w-full">
              <SheetTitle className="text-base">Emails</SheetTitle>
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
            <p className="text-sm text-muted-foreground font-normal">
              {emails.length} en esta fecha
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-auto min-h-0">
            <EmailList
              emails={emails}
              selectedEmailId={selectedEmailId}
              onSelectEmail={(email) => {
                handleSelectEmail(email);
                setEmailsSheetOpen(false);
              }}
              isLoading={isLoading}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              whitelistedEmails={whitelistedEmails}
              bankByEmail={bankByEmail}
              isSubjectBlacklisted={isSubjectBlacklisted}
              emptyMessage="No hay emails en esta fecha"
            />
          </div>
        </SheetContent>
      </Sheet>

      <EditTransactionSheet
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onDelete={(tx) => {
          setEditingTransaction(null);
          setTimeout(() => setDeletingTransaction(tx), 0);
        }}
        cards={cards}
        banks={banks}
        budgets={budgets}
      />
      <DeleteTransactionDialog
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
      />
      <CreateTransactionSheet
        open={createSheetOpen}
        onOpenChange={(open) => {
          setCreateSheetOpen(open);
          if (!open) setExtractedData(null);
        }}
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
    </>
  );
}

function SubscriptionsContent({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useSubscriptions();
  const createMutation = useCreateSubscription();

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Error al cargar las subscriptions. Asegúrate de estar autenticado
            con Microsoft.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Tab Buttons + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "emails" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("emails")}
          >
            <Mail className="h-4 w-4" />
            Emails
          </Button>
          <Button
            variant={activeTab === "subscriptions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("subscriptions")}
          >
            <Bell className="h-4 w-4" />
            Subscriptions
          </Button>
        </div>
        <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          <RefreshCw className={isRefetching ? "animate-spin" : ""} />
        </Button>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nueva Subscription
        </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions activas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay subscriptions activas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Expira (Ecuador)</TableHead>
                  <TableHead>Notification URL</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <SubscriptionRow
                    key={subscription.id}
                    subscription={subscription}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function MicrosoftPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("emails");

  return (
    <div className="space-y-4">
      {activeTab === "emails"
        ? <EmailsContent activeTab={activeTab} setActiveTab={setActiveTab} />
        : <SubscriptionsContent activeTab={activeTab} setActiveTab={setActiveTab} />
      }
    </div>
  );
}

function MicrosoftPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid grid-cols-8 gap-4 h-[calc(100vh-250px)]">
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

export default function MicrosoftPage() {
  return (
    <Suspense fallback={<MicrosoftPageSkeleton />}>
      <MicrosoftPageContent />
    </Suspense>
  );
}
