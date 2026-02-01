"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useBanks, useCreateBank } from "./hooks";
import { type Bank } from "./service";
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
import { Building2, Plus, Mail } from "lucide-react";

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

function BankCard({ bank, onClick }: { bank: Bank; onClick: () => void }) {
  const bankColor = bank.color || "#2563eb";
  const emailCount = bank.emails?.length || 0;
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
            <div className="flex items-center justify-center overflow-hidden">
              {bank.image ? (
                <Image
                  src={bank.image}
                  alt={bank.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain rounded-full"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold tracking-tight">{bank.name}</h3>

          {emailCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-sm opacity-70">
              <Mail className="h-4 w-4" />
              <span>
                {emailCount} email{emailCount !== 1 ? "s" : ""} configured
              </span>
            </div>
          )}
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
  const { data: banks = [], isLoading } = useBanks();
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
            Toca un banco para ver detalles y transacciones
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Banks Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BankCardSkeleton key={i} />
          ))}
        </div>
      ) : banks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No banks configured yet</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add bank
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              onClick={() => router.push(`banks/${bank.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Sheet */}
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
    </div>
  );
}
