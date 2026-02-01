"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  useCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks";
import { type Category } from "../../service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Trash2,
  Tag,
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

function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName) return Tag;
  const found = CATEGORY_ICONS.find((i) => i.name === iconName);
  return found?.icon ?? Tag;
}

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

function categoryToForm(category: Category): CategoryFormData {
  return {
    name: category.name,
    color: category.color || "#6366f1",
    icon: category.icon || "Tag",
  };
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const { data: category, isLoading } = useCategory(categoryId);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);

  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: "",
      color: "#6366f1",
      icon: "Tag",
    },
  });
  const { register, watch, setValue, reset, handleSubmit } = form;
  const color = watch("color") || "#6366f1";
  const selectedIcon = watch("icon") || "Tag";
  const SelectedIconComponent = getIconComponent(selectedIcon);

  useEffect(() => {
    if (category) {
      reset(categoryToForm(category));
    }
  }, [category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    await updateCategory.mutateAsync({
      id: categoryId,
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
      },
    });
    router.push(`/categories/${categoryId}`);
  };

  const handleDelete = async () => {
    await deleteCategory.mutateAsync(categoryId);
    setShowDeleteConfirm(false);
    router.push("/categories");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Categoría no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/categories/${categoryId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Categoría</h1>
          <p className="text-sm text-muted-foreground">{category.name}</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input {...register("name")} placeholder="Food & Drinks" />
            </div>

            {/* Icon Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ícono</label>
              <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-7 gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue("color", c.value)}
                    className={`h-10 w-10 rounded-full transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Vista previa</label>
              <div
                className="rounded-xl p-4 transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
                  color: isLightColor(color) ? DARK_TEXT_COLOR : "white",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isLightColor(color)
                        ? "rgba(0,0,0,0.1)"
                        : "rgba(255,255,255,0.2)",
                    }}
                  >
                    <SelectedIconComponent className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-semibold">
                    {watch("name") || "Nombre de categoría"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/categories/${categoryId}`)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateCategory.isPending || !watch("name")}
                >
                  {updateCategory.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Estás seguro de que quieres eliminar{" "}
            <span className="font-medium text-foreground">{category.name}</span>
            ? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
