import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toEcuadorDateTimeLocal } from "@/utils/ecuador-time";
import { type CardWithBank } from "../../cards/service";
import { CARD_TYPES, CARD_KINDS } from "../../cards/utils";
import { type Bank } from "../../banks/service";
import { type Budget } from "../../budgets/service";

export interface TransactionFormData {
  type: "expense" | "income";
  description: string;
  amount: number;
  occurred_at: string; // datetime-local string in Ecuador time
  card_id: string;
  bank_id: string;
  budget_id: string;
  comment: string;
}

export const defaultTransactionFormValues: TransactionFormData = {
  type: "expense",
  description: "",
  amount: 0,
  occurred_at: toEcuadorDateTimeLocal(), // Current time in Ecuador
  card_id: "",
  bank_id: "",
  budget_id: "",
  comment: "",
};

interface TransactionFormProps {
  form: UseFormReturn<TransactionFormData>;
  cards: CardWithBank[];
  banks: Bank[];
  budgets: Budget[];
}

export function TransactionForm({
  form,
  cards,
  banks,
  budgets,
}: TransactionFormProps) {
  const { register, watch, setValue } = form;

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tipo</label>
        <Tabs
          value={watch("type")}
          onValueChange={(v) => setValue("type", v as "expense" | "income")}
        >
          <TabsList className="w-full h-11 p-1">
            <TabsTrigger
              value="expense"
              className="flex-1 gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border data-[state=active]:border-red-200 data-[state=active]:shadow-sm dark:data-[state=active]:bg-red-950/50 dark:data-[state=active]:text-red-300 dark:data-[state=active]:border-red-800"
            >
              <TrendingDown className="h-4 w-4" />
              Gasto
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="flex-1 gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border data-[state=active]:border-emerald-200 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 dark:data-[state=active]:border-emerald-800"
            >
              <TrendingUp className="h-4 w-4" />
              Ingreso
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descripción</label>
        <Input
          {...register("description")}
          placeholder="Ej: Almuerzo, Netflix, Salario..."
        />
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Monto</label>
        <Input
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          placeholder="0.00"
        />
      </div>

      {/* Date and Time */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Fecha y Hora</label>
        <Input type="datetime-local" {...register("occurred_at")} />
      </div>

      {/* Card */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tarjeta</label>
        <Select
          value={watch("card_id") || "__none__"}
          onValueChange={(v) => setValue("card_id", v === "__none__" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar tarjeta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Ninguna</SelectItem>
            {cards.map((card) => {
              const kindLabel = CARD_KINDS.find((k) => k.value === card.card_kind)?.label ?? null;
              const typeLabel = CARD_TYPES.find((t) => t.value === card.card_type)?.label ?? null;
              const cardLabel = [kindLabel, typeLabel, card.bank?.name ?? null, card.last4 ?? null]
                .filter(Boolean)
                .join(" ");
              return (
                <SelectItem key={card.id} value={card.id}>
                  <div className="flex items-center gap-2">
                    {card.bank?.image ? (
                      <Image
                        src={card.bank.image}
                        alt={card.bank.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0 rounded object-contain"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span>{cardLabel || card.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Bank */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Banco</label>
        <Select
          value={watch("bank_id") || "__none__"}
          onValueChange={(v) => setValue("bank_id", v === "__none__" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Ninguno</SelectItem>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                <div className="flex items-center gap-2">
                  {bank.image ? (
                    <Image
                      src={bank.image}
                      alt={bank.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 rounded object-contain"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>{bank.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Presupuesto</label>
        <Select
          value={watch("budget_id") || "__none__"}
          onValueChange={(v) =>
            setValue("budget_id", v === "__none__" ? "" : v)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar presupuesto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Ninguno</SelectItem>
            {budgets.map((budget) => (
              <SelectItem key={budget.id} value={budget.id}>
                {budget.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Comentario</label>
        <Textarea
          {...register("comment")}
          placeholder="Agregar un comentario..."
          rows={3}
        />
      </div>
    </div>
  );
}
