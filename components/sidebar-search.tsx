"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Search, TrendingDown, TrendingUp, Building2, CreditCard } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getTransactions, type TransactionWithRelations } from "@/app/(dashboard)/[month]/transactions/service";

const fmt = (amount: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export function SidebarSearch() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [transactions, setTransactions] = React.useState<
    TransactionWithRelations[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      setSearch("");
      setTransactions([]);
    }
  }, [open]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!search.trim()) {
      setTransactions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getTransactions({ search: search.trim() });
        setTransactions(data);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (tx: TransactionWithRelations) => {
    const monthStr = format(parseISO(tx.occurred_at), "yyyy-MM");
    router.push(`/${monthStr}/transactions?transactionId=${tx.id}`);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex w-full items-center gap-2 rounded-md bg-sidebar-accent px-3 py-1.5 text-left text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80 focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
        <span className="truncate">Buscar transacciones...</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por descripción, comentario o precio..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="py-8">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm">Buscando transacciones...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Search className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Sin resultados</p>
                  <p className="text-muted-foreground text-xs max-w-[200px]">
                    Intenta con otra descripción, comentario o precio
                  </p>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup heading="Transacciones" className="p-1">
              {transactions.map((tx) => {
                const isExpense = tx.type === "expense";
                return (
                  <CommandItem
                    key={tx.id}
                    value={`${tx.id}-${tx.description}-${tx.amount}`}
                    onSelect={() => handleSelect(tx)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-accent"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        isExpense
                          ? "border-red-200 bg-red-500/10 text-red-600 dark:border-red-900/50 dark:text-red-400"
                          : "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-900/50 dark:text-emerald-400"
                      }`}
                    >
                      {isExpense ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                      <span className="truncate font-medium text-foreground">
                        {tx.description}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          {format(parseISO(tx.occurred_at), "d MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                        {(tx.bank || tx.card) && (
                          <>
                            <span className="text-muted-foreground/60">·</span>
                            {tx.bank && (
                              <span className="inline-flex items-center gap-1 truncate">
                                {tx.bank.image ? (
                                  <Image
                                    src={tx.bank.image}
                                    alt=""
                                    width={12}
                                    height={12}
                                    className="h-3 w-3 rounded object-contain"
                                  />
                                ) : (
                                  <Building2 className="h-3 w-3 shrink-0" />
                                )}
                                {tx.bank.name}
                              </span>
                            )}
                            {tx.card && !tx.bank && (
                              <span className="inline-flex items-center gap-1 truncate">
                                <CreditCard className="h-3 w-3 shrink-0" />
                                {tx.card.last4
                                  ? `****${tx.card.last4}`
                                  : tx.card.name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        isExpense
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {fmt(Math.abs(tx.amount))}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
