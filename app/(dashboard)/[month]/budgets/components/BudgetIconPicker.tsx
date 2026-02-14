"use client";

import {
  Wallet,
  PiggyBank,
  ShoppingCart,
  DollarSign,
  Home,
  Car,
  UtensilsCrossed,
  Coffee,
  Plane,
  Fuel,
  Gift,
  Heart,
  Shirt,
  Smartphone,
  Laptop,
  Gamepad2,
  Music,
  BookOpen,
  Dumbbell,
  Stethoscope,
  Baby,
  GraduationCap,
  Palette,
  Wrench,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  PiggyBank,
  ShoppingCart,
  DollarSign,
  Home,
  Car,
  UtensilsCrossed,
  Coffee,
  Plane,
  Fuel,
  Gift,
  Heart,
  Shirt,
  Smartphone,
  Laptop,
  Gamepad2,
  Music,
  BookOpen,
  Dumbbell,
  Stethoscope,
  Baby,
  GraduationCap,
  Palette,
  Wrench,
  Building2,
};

export const BUDGET_ICON_OPTIONS = Object.keys(ICON_MAP) as [string, ...string[]];

export function getBudgetIconComponent(iconName: string | null): LucideIcon {
  if (!iconName || !ICON_MAP[iconName]) return Wallet;
  return ICON_MAP[iconName];
}

type BudgetIconPickerProps = {
  value: string | null;
  onChange: (icon: string | null) => void;
  className?: string;
};

export function BudgetIconPicker({
  value,
  onChange,
  className,
}: BudgetIconPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">Icono</label>
      <div className="flex flex-wrap gap-2">
        {BUDGET_ICON_OPTIONS.map((name) => {
          const Icon = getBudgetIconComponent(name);
          const isSelected = value === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(isSelected ? null : name)}
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted hover:border-muted-foreground/50 hover:bg-muted/50",
              )}
              title={name}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
