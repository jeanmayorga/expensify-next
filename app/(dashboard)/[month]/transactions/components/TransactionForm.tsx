import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  Landmark,
  PiggyBank,
  MessageSquare,
} from "lucide-react";
import { BudgetLabel } from "@/app/(dashboard)/[month]/budgets/components/BudgetLabel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const selectedType = watch("type");

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setValue("type", "expense")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
            selectedType === "expense"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
              : "border-input bg-transparent text-muted-foreground hover:bg-accent/50"
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setValue("type", "income")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
            selectedType === "income"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "border-input bg-transparent text-muted-foreground hover:bg-accent/50"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Ingreso
        </button>
      </div>

      {/* Amount & Description — primary fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Monto
          </label>
          <Input
            type="number"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0.00"
            className="h-12 text-2xl font-semibold tabular-nums md:text-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Descripción
          </label>
          <Input
            {...register("description")}
            placeholder="Ej: Almuerzo, Netflix, Salario..."
          />
        </div>
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Fecha y Hora
        </label>
        <Input type="datetime-local" {...register("occurred_at")} />
      </div>

      {/* Financial details */}
      <div className="space-y-3 rounded-lg border border-dashed p-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Detalles financieros
        </p>

        {/* Card */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Tarjeta
          </label>
          <Select
            value={watch("card_id") || "__none__"}
            onValueChange={(v) =>
              setValue("card_id", v === "__none__" ? "" : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar tarjeta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Ninguna</SelectItem>
              {cards.map((card) => {
                const kindLabel =
                  CARD_KINDS.find((k) => k.value === card.card_kind)?.label ??
                  null;
                const typeLabel =
                  CARD_TYPES.find((t) => t.value === card.card_type)?.label ??
                  null;
                const cardLabel = [
                  kindLabel,
                  typeLabel,
                  card.bank?.name ?? null,
                  card.last4 ?? null,
                ]
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
                        <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" />
            Banco
          </label>
          <Select
            value={watch("bank_id") || "__none__"}
            onValueChange={(v) =>
              setValue("bank_id", v === "__none__" ? "" : v)
            }
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
                      <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <PiggyBank className="h-3.5 w-3.5" />
            Presupuesto
          </label>
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
                  <BudgetLabel budget={budget} iconClassName="h-3.5 w-3.5" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          Comentario
        </label>
        <Textarea
          {...register("comment")}
          placeholder="Agregar un comentario..."
          rows={2}
        />
      </div>
    </div>
  );
}
