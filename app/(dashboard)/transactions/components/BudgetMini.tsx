import { HandCoins } from "lucide-react";
import { type Budget } from "../../budgets/service";

interface BudgetMiniProps {
  budget: Budget;
}

export function BudgetMini({ budget }: BudgetMiniProps) {
  return (
    <div className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 text-white">
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/20">
          <HandCoins className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{budget.name}</p>
          <p className="text-xs opacity-70">Budget</p>
        </div>
      </div>
    </div>
  );
}
