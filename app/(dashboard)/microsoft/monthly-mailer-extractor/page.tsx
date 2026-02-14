"use client";

import { useState, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useQueryState, parseAsString } from "nuqs";
import {
  Loader2,
  Play,
  Save,
  Trash2,
  ListFilter,
  Calendar,
  Inbox,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getEmailsForMonth } from "../../emails/service";
import { getExtractTransactionData } from "../../emails/service";
import {
  createTransaction,
  type TransactionInsert,
} from "../../[month]/transactions/service";
import type { MicrosoftMeMessage } from "@/app/api/microsoft/me/messages/model";
import { useBanks } from "../../[month]/banks/hooks";
import { useCards } from "../../[month]/cards/hooks";
import { useBudgets } from "../../[month]/budgets/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { getEcuadorDate } from "@/utils/ecuador-time";
import { ExtractedTransactionRow } from "../daily-mailer-extractor/components/ExtractedTransactionRow";
import type { ExtractedItem } from "../daily-mailer-extractor/types";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const getCurrentMonth = () => format(new Date(), "yyyy-MM");

function groupByDay(items: ExtractedItem[]): [string, ExtractedItem[]][] {
  const groups: Record<string, ExtractedItem[]> = {};
  items.forEach((item) => {
    const date = parseISO(item.data.occurred_at ?? new Date().toISOString());
    const ecuadorDate = getEcuadorDate(date);
    const dateKey = format(ecuadorDate, "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function findMergePairs(items: ExtractedItem[]): Map<string, { ids: [string, string] }> {
  const result = new Map<string, { ids: [string, string] }>();
  const expenses = items.filter((i) => i.data.type === "expense");
  const incomes = items.filter((i) => i.data.type === "income");
  const usedExpense = new Set<string>();
  const usedIncome = new Set<string>();

  for (const exp of expenses) {
    if (usedExpense.has(exp.tempId)) continue;
    const match = incomes.find(
      (inc) =>
        !usedIncome.has(inc.tempId) &&
        Math.abs(inc.data.amount - exp.data.amount) < 0.01,
    );
    if (match) {
      usedExpense.add(exp.tempId);
      usedIncome.add(match.tempId);
      result.set(exp.tempId, { ids: [exp.tempId, match.tempId] });
      result.set(match.tempId, { ids: [exp.tempId, match.tempId] });
    }
  }
  return result;
}

export default function MonthlyMailerExtractorPage() {
  const [selectedMonth, setSelectedMonth] = useQueryState(
    "month",
    parseAsString.withDefault(getCurrentMonth()),
  );
  const [emails, setEmails] = useState<MicrosoftMeMessage[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [extractingEmailId, setExtractingEmailId] = useState<string | null>(null);
  const [savingTempId, setSavingTempId] = useState<string | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [emailFilter, setEmailFilter] = useState<"all" | "highlighted">("all");

  const { data: banks = [] } = useBanks();
  const { data: cards = [] } = useCards();
  const { data: budgets = [] } = useBudgets();
  const queryClient = useQueryClient();

  const whitelistedEmails = useMemo(
    () => banks.flatMap((b) => b.emails || []),
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
    () => banks.flatMap((b) => b.blacklisted_subjects || []),
    [banks],
  );
  const isSubjectBlacklisted = useCallback((subject: string | undefined) => {
    const upper = subject?.toUpperCase() || "";
    return blacklistedSubjects.some((s) => upper.includes(s.toUpperCase()));
  }, [blacklistedSubjects]);
  const isHighlighted = useCallback(
    (email: MicrosoftMeMessage) =>
      whitelistedEmails.includes(email.from) && !isSubjectBlacklisted(email.subject),
    [whitelistedEmails, isSubjectBlacklisted],
  );

  const loadAllEmails = useCallback(async () => {
    setEmailsLoading(true);
    try {
      const all: MicrosoftMeMessage[] = [];
      let cursor: string | undefined;
      do {
        const result = await getEmailsForMonth(selectedMonth, cursor);
        all.push(...result.messages);
        cursor = result.nextLink ?? undefined;
      } while (cursor);
      setEmails(all);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Error al cargar emails: " + msg);
    } finally {
      setEmailsLoading(false);
    }
  }, [selectedMonth]);

  const highlightedEmails = useMemo(
    () => emails.filter(isHighlighted),
    [emails, isHighlighted],
  );
  const displayedEmails =
    emailFilter === "highlighted" ? highlightedEmails : emails;

  const startExtraction = useCallback(async () => {
    if (highlightedEmails.length === 0) {
      toast.error("No hay emails de banco para procesar");
      return;
    }
    let count = 0;
    for (let i = 0; i < highlightedEmails.length; i++) {
      const email = highlightedEmails[i];
      setExtractingEmailId(email.id);
      try {
        const data = await getExtractTransactionData(email.id);
        const newItem: ExtractedItem = {
          tempId: `ext-${email.id}-${Date.now()}`,
          data,
          messageId: email.id,
        };
        setExtractedItems((prev) => [...prev, newItem]);
        count++;
      } catch {
        // Skip - no extractor for this email
      }
    }
    setExtractingEmailId(null);
    toast.success(`${count} transacciones extraídas`);
  }, [highlightedEmails]);

  const saveAll = useCallback(async () => {
    if (extractedItems.length === 0) {
      toast.error("No hay transacciones para guardar");
      return;
    }
    for (const item of extractedItems) {
      setSavingTempId(item.tempId);
      try {
        await createTransaction(item.data);
        setExtractedItems((prev) => prev.filter((i) => i.tempId !== item.tempId));
        if (item.messageId) {
          queryClient.invalidateQueries({
            queryKey: ["transactions", "by-message", item.messageId],
          });
        }
      } catch (err) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ??
          (err instanceof Error ? err.message : String(err));
        const isDuplicate =
          typeof msg === "string" &&
          (msg.toLowerCase().includes("duplicate key") ||
            msg.includes("income_message_id"));
        if (isDuplicate) {
          setExtractedItems((prev) => prev.filter((i) => i.tempId !== item.tempId));
          if (item.messageId) {
            queryClient.invalidateQueries({
              queryKey: ["transactions", "by-message", item.messageId],
            });
          }
        } else {
          toast.error(`Error guardando ${item.data.description}: ${msg}`);
        }
      }
    }
    setSavingTempId(null);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    toast.success("Transacciones guardadas");
  }, [extractedItems, queryClient]);

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

  const handleMerge = useCallback((ids: [string, string]) => {
    removeItems(ids);
    toast.success("Par fusionado (eliminado de la lista)");
  }, [removeItems]);

  const groupedByDay = useMemo(
    () => groupByDay(extractedItems),
    [extractedItems],
  );
  const mergePairsMap = useMemo(
    () => findMergePairs(extractedItems),
    [extractedItems],
  );

  const currentEmailIndex = highlightedEmails.findIndex((e) => e.id === extractingEmailId);

  const monthLabel = selectedMonth
    ? format(parseISO(selectedMonth + "-01"), "MMMM yyyy", { locale: es })
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Mes</span>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 w-40"
            />
            <Button
              onClick={loadAllEmails}
              disabled={emailsLoading}
              size="sm"
              variant="outline"
              className="h-9"
            >
              {emailsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Inbox className="h-4 w-4 mr-1.5" />
                  Cargar emails
                </>
              )}
            </Button>
          </div>
        </div>
        {emails.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {emails.length} emails · {highlightedEmails.length} de banco · {monthLabel}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden flex flex-col gap-0">
          <CardHeader className="py-2.5 px-4 pb-2! flex flex-row items-center justify-between gap-2 border-b">
            <CardTitle className="text-sm font-medium">Emails del mes</CardTitle>
            <div className="flex items-center gap-1.5">
              <Button
                variant={emailFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setEmailFilter("all")}
              >
                Todos ({emails.length})
              </Button>
              <Button
                variant={emailFilter === "highlighted" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setEmailFilter("highlighted")}
              >
                <ListFilter className="h-3.5 w-3.5 mr-1" />
                Emails de banco ({highlightedEmails.length})
              </Button>
              <Button
                onClick={startExtraction}
                disabled={highlightedEmails.length === 0 || !!extractingEmailId}
                size="sm"
                className="h-8"
              >
                {extractingEmailId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {currentEmailIndex + 1}/{highlightedEmails.length}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1.5" />
                    Empezar
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto min-h-[140px] max-h-[360px] flex flex-col">
            {emails.length === 0 && !emailsLoading ? (
              <Empty className="min-h-[140px] border-0 p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">Sin emails</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : displayedEmails.length === 0 ? (
              <Empty className="min-h-[140px] border-0 p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">No hay emails de banco</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y">
                {displayedEmails.map((email) => {
                  const highlighted = isHighlighted(email);
                  const bank = bankByEmail.get(email.from);
                  const bankColor = bank?.color ?? null;
                  const highlightStyle =
                    highlighted && bankColor
                      ? { borderLeftColor: bankColor, backgroundColor: `${bankColor}15` }
                      : undefined;
                  return (
                    <div
                      key={email.id}
                      className={cn(
                        "px-3 py-2 flex items-center justify-between gap-2 border-l-4 border-l-transparent transition-colors",
                        highlighted && !bankColor && "border-l-green-500 bg-green-50 dark:bg-green-950/20",
                        extractingEmailId === email.id && "bg-primary/10",
                      )}
                      style={highlightStyle}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {email.fromName || email.from}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {email.subject || "(Sin asunto)"}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {extractingEmailId === email.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          format(new Date(email.receivedDateTime), "d MMM HH:mm", { locale: es })
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden flex flex-col gap-0">
          <CardHeader className="py-2.5 px-4 pb-2! flex flex-row items-center justify-between gap-2 border-b">
            <CardTitle className="text-sm font-medium">Transacciones extraídas</CardTitle>
            <div className="flex items-center gap-1.5">
              {selectedForDelete.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={() => removeItems([...selectedForDelete])}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar ({selectedForDelete.size})
                </Button>
              )}
              <Button
                onClick={saveAll}
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
          <CardContent className="p-0 flex-1 overflow-auto min-h-[140px] max-h-[360px] flex flex-col">
            {extractedItems.length === 0 ? (
              <Empty className="min-h-[140px] border-0 p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileSearch className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">Sin transacciones</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y">
                {groupedByDay.map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-3 py-1 border-b flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        {format(parseISO(dateKey), "EEEE d MMM", { locale: es })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({items.length})
                      </span>
                    </div>
                    {items.map((item) => (
                      <ExtractedTransactionRow
                        key={item.tempId}
                        item={item}
                        banks={banks}
                        cards={cards}
                        budgets={budgets}
                        onUpdate={(patch) => updateItem(item.tempId, patch)}
                        onRemove={() => removeItems([item.tempId])}
                        mergePair={mergePairsMap.get(item.tempId)}
                        onMerge={handleMerge}
                        isSaving={savingTempId === item.tempId}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
