import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
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
};

interface CardFormProps {
  form: UseFormReturn<CardFormData>;
  banks: { id: string; name: string }[];
}

export function CardForm({ form, banks }: CardFormProps) {
  const { register, watch, setValue } = form;
  const color = watch("color") || "#1e293b";
  const cardType = watch("card_type");
  const cardKind = watch("card_kind");
  const bankId = watch("bank_id");

  // Auto-generate name from card_type + card_kind + bank_name
  useEffect(() => {
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
  }, [cardType, cardKind, bankId, banks, setValue]);

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
            <SelectTrigger>
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
            <SelectTrigger>
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
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                {bank.name}
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
            <label className="text-sm font-medium">Saldo pendiente</label>
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
