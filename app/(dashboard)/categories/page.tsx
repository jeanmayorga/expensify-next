"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "./hooks";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Plus, Trash2 } from "lucide-react";

const DARK_TEXT_COLOR = "#0f265c";

const CATEGORY_COLORS = [
  { value: "#ef4444", name: "Red" }, // Food, Bills
  { value: "#f97316", name: "Orange" }, // Shopping
  { value: "#f59e0b", name: "Amber" }, // Entertainment
  { value: "#eab308", name: "Yellow" }, // Transport
  { value: "#84cc16", name: "Lime" }, // Health
  { value: "#22c55e", name: "Green" }, // Income, Savings
  { value: "#14b8a6", name: "Teal" }, // Investments
  { value: "#06b6d4", name: "Cyan" }, // Utilities
  { value: "#3b82f6", name: "Blue" }, // Education
  { value: "#6366f1", name: "Indigo" }, // General
  { value: "#8b5cf6", name: "Violet" }, // Subscriptions
  { value: "#a855f7", name: "Purple" }, // Personal
  { value: "#ec4899", name: "Pink" }, // Gifts
  { value: "#64748b", name: "Slate" }, // Other
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
}

const defaultFormValues: CategoryFormData = {
  name: "",
  color: "#6366f1",
};

function categoryToForm(category: Category): CategoryFormData {
  return {
    name: category.name,
    color: category.color || "#6366f1",
  };
}

function CategoryCard({
  category,
  onClick,
}: {
  category: Category;
  onClick: () => void;
}) {
  const categoryColor = category.color || "#6366f1";
  const useDarkText = isLightColor(categoryColor);

  return (
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
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: useDarkText
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.2)",
              }}
            >
              <Tag className="h-5 w-5" />
            </div>
          </div>

          <h3 className="text-xl font-bold tracking-tight">{category.name}</h3>

          <p className="text-sm opacity-70 mt-2 font-mono">{categoryColor}</p>
        </div>
      </div>
    </button>
  );
}

function CategoryCardSkeleton() {
  return <Skeleton className="w-full aspect-[1.8/1] rounded-2xl" />;
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CategoryFormData>({ defaultValues: defaultFormValues });
  const { register, watch, setValue, reset, handleSubmit } = form;
  const color = watch("color") || "#6366f1";

  useEffect(() => {
    if (editingCategory) {
      reset(categoryToForm(editingCategory));
    }
  }, [editingCategory, reset]);

  const onCreateSubmit = async (data: CategoryFormData) => {
    await createCategory.mutateAsync(data);
    setIsCreating(false);
    reset(defaultFormValues);
  };

  const onEditSubmit = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      data,
    });
    setEditingCategory(null);
    reset(defaultFormValues);
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    await deleteCategory.mutateAsync(editingCategory.id);
    setShowDeleteConfirm(false);
    setEditingCategory(null);
    reset(defaultFormValues);
  };

  const openCreate = () => {
    reset(defaultFormValues);
    setIsCreating(true);
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name *</label>
        <Input {...register("name")} placeholder="Food & Drinks" />
      </div>

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
        <label className="text-sm font-medium">Preview</label>
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
              <Tag className="h-4 w-4" />
            </div>
            <span className="font-semibold">
              {watch("name") || "Category Name"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your transactions with custom categories
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
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
          <p className="text-muted-foreground mb-4">No categories yet</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add category
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => setEditingCategory(category)}
            />
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Category</SheetTitle>
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
                disabled={createCategory.isPending || !watch("name")}
              >
                {createCategory.isPending ? "Creating..." : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet
        open={!!editingCategory && !showDeleteConfirm}
        onOpenChange={() => setEditingCategory(null)}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Category</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit(onEditSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <FormFields />
            </div>
            <SheetFooter className="flex-col sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCategory.isPending || !watch("name")}
              >
                {updateCategory.isPending ? "Saving..." : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {editingCategory?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
