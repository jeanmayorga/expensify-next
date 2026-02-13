"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useBanks, useCreateBank } from "./hooks";
import { type Bank } from "./service";
import { useMonth } from "@/lib/month-context";
import { useAuth, useCanEdit } from "@/lib/auth-context";
import { useTransactionsForMonth } from "../transactions/hooks";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus } from "lucide-react";

const DARK_TEXT_COLOR = "#0f265c";

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

interface BankFormData {
  name: string;
  image: string;
  color: string;
  emails: string;
  extraction_prompt: string;
  blacklisted_subjects: string;
}

const defaultFormValues: BankFormData = {
  name: "",
  image: "",
  color: "#2563eb",
  emails: "",
  extraction_prompt: "",
  blacklisted_subjects: "",
};

function bankToForm(bank: Bank): BankFormData {
  return {
    name: bank.name,
    image: bank.image || "",
    color: bank.color || "#2563eb",
    emails: bank.emails?.join("\n") || "",
    extraction_prompt: bank.extraction_prompt || "",
    blacklisted_subjects: bank.blacklisted_subjects?.join("\n") || "",
  };
}

function formToPayload(form: BankFormData) {
  return {
    name: form.name,
    image: form.image || null,
    color: form.color || null,
    emails: form.emails
      ? form.emails
          .split("\n")
          .map((e) => e.trim())
          .filter(Boolean)
      : null,
    extraction_prompt: form.extraction_prompt || null,
    blacklisted_subjects: form.blacklisted_subjects
      ? form.blacklisted_subjects
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
  };
}

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

function BankCard({
  bank,
  spentThisMonth,
  onClick,
}: {
  bank: Bank;
  spentThisMonth: number;
  onClick: () => void;
}) {
  const bankColor = bank.color || "#2563eb";
  const useDarkText = isLightColor(bankColor);

  return (
    <button
      onClick={onClick}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${bankColor} 0%, ${bankColor}dd 50%, ${bankColor}aa 100%)`,
          color: useDarkText ? DARK_TEXT_COLOR : "white",
        }}
      >
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />
        <div
          className="absolute -right-2 top-12 w-16 h-16 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            {bank.image ? (
              <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden bg-white/20 shrink-0">
                <Image
                  src={bank.image}
                  alt={bank.name}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 shrink-0">
                <Building2 className="h-5 w-5 opacity-90" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold tracking-tight">{bank.name}</h3>

          <div className="mt-3 rounded-lg bg-white/20 px-3 py-2 inline-block">
            <span className="text-xs opacity-90">Gastado este mes</span>
            <span className="block text-base font-bold tabular-nums">
              {fmt(spentThisMonth)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function BankCardSkeleton() {
  return <Skeleton className="w-full aspect-[1.8/1] rounded-2xl" />;
}

export default function BanksPage() {
  const router = useRouter();
  const canEdit = useCanEdit();
  const { selectedMonth, monthStr } = useMonth();
  const { budgetId } = useAuth();
  const { data: banks = [], isLoading } = useBanks();
  const { data: transactions = [], isLoading: loadingTx } =
    useTransactionsForMonth(selectedMonth);

  const spendingByBank = useMemo(() => {
    const filtered = budgetId
      ? transactions.filter((tx) => tx.budget_id === budgetId)
      : transactions;
    const expenses = filtered.filter((tx) => tx.type === "expense");
    const map: Record<string, number> = {};
    expenses.forEach((tx) => {
      if (tx.bank_id) {
        map[tx.bank_id] = (map[tx.bank_id] ?? 0) + Math.abs(tx.amount);
      }
    });
    return map;
  }, [transactions, budgetId]);

  const createBank = useCreateBank();

  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<BankFormData>({ defaultValues: defaultFormValues });
  const { register, watch, setValue, reset, handleSubmit } = form;
  const color = watch("color") || "#2563eb";
  const imageUrl = watch("image");

  const onCreateSubmit = async (data: BankFormData) => {
    await createBank.mutateAsync(formToPayload(data));
    setIsCreating(false);
    reset(defaultFormValues);
  };

  const openCreate = () => {
    reset(defaultFormValues);
    setIsCreating(true);
  };

  const FormFields = ({ showPreview = false }: { showPreview?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name *</label>
        <Input {...register("name")} placeholder="Bank of America" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Logo URL</label>
        <Input
          {...register("image")}
          placeholder="https://example.com/logo.png"
        />
        {showPreview && imageUrl && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
            <Image
              src={imageUrl}
              alt="Preview"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setValue("color", e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-input p-1"
          />
          <Input
            value={color}
            onChange={(e) => setValue("color", e.target.value)}
            placeholder="#2563eb"
            className="flex-1 font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Notification Emails</label>
        <Textarea
          {...register("emails")}
          placeholder={"alerts@bank.com\nnotifications@bank.com"}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">One email per line</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Extraction Prompt</label>
        <Textarea
          {...register("extraction_prompt")}
          placeholder="Extract transaction details from this email..."
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Blacklisted Subjects</label>
        <Textarea
          {...register("blacklisted_subjects")}
          placeholder={"Security Alert\nPassword Changed"}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          One subject per line. Emails with these subjects will be ignored.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bancos</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit ? "Toca un banco para ver detalles y transacciones" : "Tus bancos"}
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Banks Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BankCardSkeleton key={i} />
          ))}
        </div>
      ) : banks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Aún no hay bancos</p>
          {canEdit && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar banco
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {banks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              spentThisMonth={spendingByBank[bank.id] ?? 0}
              onClick={() => router.push(`/${monthStr}/banks/${bank.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Sheet - only in edit mode */}
      {canEdit && (
        <Sheet open={isCreating} onOpenChange={setIsCreating}>
          <SheetContent className="sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>New Bank</SheetTitle>
            </SheetHeader>
            <form
              onSubmit={handleSubmit(onCreateSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 px-4 pb-4 overflow-y-auto">
                <FormFields />
              </div>
              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBank.isPending || !watch("name")}
                >
                  {createBank.isPending ? "Creating..." : "Create"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
