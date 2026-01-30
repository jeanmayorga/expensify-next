import { UseFormReturn } from "react-hook-form";
import { TrendingDown, TrendingUp } from "lucide-react";
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
import { type Category } from "../../categories/service";
import { type CardWithBank } from "../../cards/service";
import { type Bank } from "../../banks/service";
import { type Budget } from "../../budgets/service";

export interface TransactionFormData {
  type: "expense" | "income";
  description: string;
  amount: number;
  occurred_at: string;
  category_id: string;
  card_id: string;
  bank_id: string;
  budget_id: string;
  comment: string;
}

export const defaultTransactionFormValues: TransactionFormData = {
  type: "expense",
  description: "",
  amount: 0,
  occurred_at: new Date().toISOString().slice(0, 16),
  category_id: "",
  card_id: "",
  bank_id: "",
  budget_id: "",
  comment: "",
};

interface TransactionFormProps {
  form: UseFormReturn<TransactionFormData>;
  categories: Category[];
  cards: CardWithBank[];
  banks: Bank[];
  budgets: Budget[];
}

export function TransactionForm({
  form,
  categories,
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
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1 gap-2">
              <TrendingDown className="h-4 w-4" />
              Gasto
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1 gap-2">
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

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Categoría</label>
        <Select
          value={watch("category_id") || "__none__"}
          onValueChange={(v) =>
            setValue("category_id", v === "__none__" ? "" : v)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Ninguna</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || "#888" }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name}
                {card.last4 && ` •••• ${card.last4}`}
              </SelectItem>
            ))}
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
                {bank.name}
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
