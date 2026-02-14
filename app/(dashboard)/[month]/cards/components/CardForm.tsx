import { useEffect } from "react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARD_TYPES, CARD_KINDS } from "../utils";

export interface CardFormData {
  name: string;
  last4: string;
  bank_id: string;
  color: string;
  card_type: string;
  card_kind: string;
  cardholder_name: string;
  expiration_date: string;
  outstanding_balance: string;
  credit_limit: string;
  cut_start_day: string;
  cut_end_day: string;
  payment_due_day: string;
}

export const defaultCardFormValues: CardFormData = {
  name: "",
  last4: "",
  bank_id: "",
  color: "#1e293b",
  card_type: "",
  card_kind: "",
  cardholder_name: "",
  expiration_date: "",
  outstanding_balance: "",
  credit_limit: "",
  cut_start_day: "",
  cut_end_day: "",
  payment_due_day: "",
};

interface CardFormProps {
  form: UseFormReturn<CardFormData>;
  banks: { id: string; name: string; image?: string | null }[];
}

export function CardForm({ form, banks }: CardFormProps) {
  const { register, watch, setValue, getValues } = form;
  const color = watch("color") || "#1e293b";
  const cardType = watch("card_type");
  const cardKind = watch("card_kind");
  const bankId = watch("bank_id");

  // Auto-generate name from card_type + card_kind + bank_name (solo cuando name está vacío, para no sobrescribir al editar)
  useEffect(() => {
    const currentName = getValues("name");
    if (currentName?.trim()) return;

    const parts: string[] = [];

    const typeLabel = CARD_TYPES.find((t) => t.value === cardType)?.label;
    if (typeLabel) parts.push(typeLabel);

    const kindLabel = CARD_KINDS.find((k) => k.value === cardKind)?.label;
    if (kindLabel) parts.push(kindLabel);

    const bankName = banks.find((b) => b.id === bankId)?.name;
    if (bankName) parts.push(bankName);

    if (parts.length > 0) {
      setValue("name", parts.join(" "));
    }
  }, [cardType, cardKind, bankId, banks, setValue, getValues]);

  return (
    <div className="space-y-4">
      {/* Card type & Credit/Debit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Card type</label>
          <Select
            value={watch("card_type") || "__none__"}
            onValueChange={(v) => setValue("card_type", v === "__none__" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not specified</SelectItem>
              {CARD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Credit / Debit</label>
          <Select
            value={watch("card_kind") || "__none__"}
            onValueChange={(v) => setValue("card_kind", v === "__none__" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not specified</SelectItem>
              {CARD_KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bank */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Bank</label>
        <Select
          value={watch("bank_id") || "__none__"}
          onValueChange={(v) => setValue("bank_id", v === "__none__" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                <div className="flex items-center gap-2">
                  {bank.image ? (
                    <Image
                      src={bank.image}
                      alt={bank.name}
                      width={16}
                      height={16}
                      className="h-4 w-4 rounded object-contain shrink-0"
                    />
                  ) : (
                    <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {bank.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Name (auto-generated) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name</label>
        <Input
          {...register("name")}
          placeholder="Visa Credit Banco Pichincha"
          className="bg-muted/50"
        />
        <p className="text-xs text-muted-foreground">Auto-generated from card type, kind and bank</p>
      </div>

      {/* Last 4 & Expiration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Last 4 digits</label>
          <Input {...register("last4")} placeholder="1234" maxLength={4} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Expiration date</label>
          <Input
            {...register("expiration_date")}
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>
      </div>

      {/* Cardholder name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cardholder name</label>
        <Input
          {...register("cardholder_name")}
          placeholder="JOHN DOE"
          className="uppercase"
        />
      </div>

      {/* Outstanding balance & Credit limit - only for credit cards */}
      {cardKind === "credit" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Saldo utilizado</label>
            <Input
              type="number"
              {...register("outstanding_balance")}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cupo máximo</label>
            <Input
              type="number"
              {...register("credit_limit")}
              placeholder="0.00"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Límite de crédito de la tarjeta (para la barra de uso)
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Ciclo de corte</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Inicio
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...register("cut_start_day")}
                  placeholder="16"
                />
                <p className="text-[10px] text-muted-foreground">
                  Día inicio ciclo
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Fin
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...register("cut_end_day")}
                  placeholder="13"
                />
                <p className="text-[10px] text-muted-foreground">
                  Día fin (mes sig.)
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Pago máximo
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...register("payment_due_day")}
                  placeholder="28"
                />
                <p className="text-[10px] text-muted-foreground">
                  Fecha límite pago
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Color */}
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
            placeholder="#1e293b"
            className="flex-1 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
