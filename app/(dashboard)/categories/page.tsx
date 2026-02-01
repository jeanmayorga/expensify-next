"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { useCategories, useCreateCategory } from "./hooks";
import { useTransactions } from "../transactions/hooks";
import { useMonthInUrl } from "@/lib/use-month-url";
import { type Category } from "./service";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tag,
  Plus,
  Pencil,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Wifi,
  Phone,
  Tv,
  Music,
  Gamepad2,
  Dumbbell,
  Heart,
  Pill,
  GraduationCap,
  Briefcase,
  Plane,
  Bus,
  Fuel,
  ParkingCircle,
  ShoppingBag,
  Shirt,
  Scissors,
  Gift,
  Baby,
  PawPrint,
  Coffee,
  Beer,
  Pizza,
  IceCream,
  Cake,
  Apple,
  Salad,
  Sandwich,
  Popcorn,
  UtensilsCrossed,
  Banknote,
  Wallet,
  PiggyBank,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Landmark,
  HandCoins,
  Coins,
  DollarSign,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";

// Icon options for categories
const CATEGORY_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Tag", icon: Tag },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Utensils", icon: Utensils },
  { name: "Car", icon: Car },
  { name: "Home", icon: Home },
  { name: "Zap", icon: Zap },
  { name: "Wifi", icon: Wifi },
  { name: "Phone", icon: Phone },
  { name: "Tv", icon: Tv },
  { name: "Music", icon: Music },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Heart", icon: Heart },
  { name: "Pill", icon: Pill },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Briefcase", icon: Briefcase },
  { name: "Plane", icon: Plane },
  { name: "Bus", icon: Bus },
  { name: "Fuel", icon: Fuel },
  { name: "ParkingCircle", icon: ParkingCircle },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Shirt", icon: Shirt },
  { name: "Scissors", icon: Scissors },
  { name: "Gift", icon: Gift },
  { name: "Baby", icon: Baby },
  { name: "PawPrint", icon: PawPrint },
  { name: "Coffee", icon: Coffee },
  { name: "Beer", icon: Beer },
  { name: "Pizza", icon: Pizza },
  { name: "IceCream", icon: IceCream },
  { name: "Cake", icon: Cake },
  { name: "Apple", icon: Apple },
  { name: "Salad", icon: Salad },
  { name: "Sandwich", icon: Sandwich },
  { name: "Popcorn", icon: Popcorn },
  { name: "UtensilsCrossed", icon: UtensilsCrossed },
  { name: "Banknote", icon: Banknote },
  { name: "Wallet", icon: Wallet },
  { name: "PiggyBank", icon: PiggyBank },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "Receipt", icon: Receipt },
  { name: "CreditCard", icon: CreditCard },
  { name: "Building2", icon: Building2 },
  { name: "Landmark", icon: Landmark },
  { name: "HandCoins", icon: HandCoins },
  { name: "Coins", icon: Coins },
  { name: "DollarSign", icon: DollarSign },
  { name: "CircleDollarSign", icon: CircleDollarSign },
];

// Helper to get icon component by name
function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName) return Tag;
  const found = CATEGORY_ICONS.find((i) => i.name === iconName);
  return found?.icon ?? Tag;
}

const DARK_TEXT_COLOR = "#0f265c";

const CATEGORY_COLORS = [
  { value: "#ef4444", name: "Red" },
  { value: "#f97316", name: "Orange" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#eab308", name: "Yellow" },
  { value: "#84cc16", name: "Lime" },
  { value: "#22c55e", name: "Green" },
  { value: "#14b8a6", name: "Teal" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#3b82f6", name: "Blue" },
  { value: "#6366f1", name: "Indigo" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#a855f7", name: "Purple" },
  { value: "#ec4899", name: "Pink" },
  { value: "#64748b", name: "Slate" },
] as const;

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

const defaultFormValues: CategoryFormData = {
  name: "",
  color: "#6366f1",
  icon: "Tag",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function CategoryCard({
  category,
  totalSpent,
  onClick,
  onEdit,
}: {
  category: Category;
  totalSpent: number;
  onClick: () => void;
  onEdit: () => void;
}) {
  const categoryColor = category.color || "#6366f1";
  const useDarkText = isLightColor(categoryColor);
  const IconComponent = getIconComponent(category.icon);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
      >
        <div
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 50%, ${categoryColor}aa 100%)`,
            color: useDarkText ? DARK_TEXT_COLOR : "white",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
            style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
          />
          <div
            className="absolute -right-2 top-12 w-16 h-16 rounded-full opacity-10"
            style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
          />

          <div className="relative">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: useDarkText
                    ? "rgba(0,0,0,0.1)"
                    : "rgba(255,255,255,0.2)",
                }}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <h3 className="text-xl font-bold tracking-tight truncate pr-8">
              {category.name}
            </h3>

            <p className="text-sm opacity-90 mt-2 font-semibold">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs opacity-70 mt-0.5">gastado este mes</p>
          </div>
        </div>
      </button>
      {/* Edit button overlay */}
      <Button
        size="icon"
        variant="secondary"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CategoryCardSkeleton() {
  return <Skeleton className="w-full aspect-[1.8/1] rounded-2xl" />;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [selectedMonth] = useMonthInUrl();
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();

  const filters = useMemo(
    () => ({
      date: format(selectedMonth, "yyyy-MM"),
      timezone: "America/Guayaquil",
    }),
    [selectedMonth],
  );
  const { data: transactions = [], isLoading: loadingTx } =
    useTransactions(filters);

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((tx) => tx.type === "expense" && tx.category_id != null)
      .forEach((tx) => {
        const id = String(tx.category_id);
        map[id] = (map[id] ?? 0) + Math.abs(tx.amount);
      });
    return map;
  }, [transactions]);

  const [isCreating, setIsCreating] = useState(false);
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);

  const form = useForm<CategoryFormData>({ defaultValues: defaultFormValues });
  const { register, watch, setValue, reset, handleSubmit } = form;
  const color = watch("color") || "#6366f1";
  const selectedIcon = watch("icon") || "Tag";
  const SelectedIconComponent = getIconComponent(selectedIcon);

  const onCreateSubmit = async (data: CategoryFormData) => {
    await createCategory.mutateAsync({
      name: data.name,
      color: data.color,
      icon: data.icon,
    });
    setIsCreating(false);
    reset(defaultFormValues);
  };

  const openCreate = () => {
    reset(defaultFormValues);
    setIsCreating(true);
  };

  const handleCategoryClick = (category: Category) => {
    const monthStr = format(selectedMonth, "yyyy-MM");
    router.push(`/categories/${category.id}?month=${monthStr}`);
  };

  const handleEditClick = (category: Category) => {
    router.push(`/categories/${category.id}/edit`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground capitalize">
            Gastos por categoría ·{" "}
            {format(selectedMonth, "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading || loadingTx ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Tag className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Aún no hay categorías</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar categoría
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              totalSpent={spendingByCategory[String(category.id)] ?? 0}
              onClick={() => handleCategoryClick(category)}
              onEdit={() => handleEditClick(category)}
            />
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nueva categoría</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit(onCreateSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre *</label>
                <Input {...register("name")} placeholder="Comida, Netflix..." />
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Icono</label>
                <Popover
                  open={iconPopoverOpen}
                  onOpenChange={setIconPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <SelectedIconComponent className="h-4 w-4" />
                      <span>{selectedIcon}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2" align="start">
                    <ScrollArea className="h-64">
                      <div className="grid grid-cols-6 gap-1">
                        {CATEGORY_ICONS.map(({ name, icon: Icon }) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setValue("icon", name);
                              setIconPopoverOpen(false);
                            }}
                            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all hover:bg-muted ${
                              selectedIcon === name
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                            title={name}
                          >
                            <Icon className="h-5 w-5" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Color</label>
                <div className="grid grid-cols-7 gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setValue("color", c.value)}
                      className={`h-8 w-8 rounded-full transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                        color === c.value
                          ? "ring-2 ring-offset-2 ring-primary scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vista previa</label>
                <div
                  className="rounded-xl p-4 transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
                    color: isLightColor(color) ? DARK_TEXT_COLOR : "white",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: isLightColor(color)
                          ? "rgba(0,0,0,0.1)"
                          : "rgba(255,255,255,0.2)",
                      }}
                    >
                      <SelectedIconComponent className="h-4 w-4" />
                    </div>
                    <span className="font-semibold">
                      {watch("name") || "Nombre de la categoría"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCategory.isPending || !watch("name")}
              >
                {createCategory.isPending ? "Creando..." : "Crear"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
