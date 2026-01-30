"use client";

import { useState } from "react";
import Image from "next/image";
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from "./hooks";
import { useBanks } from "../banks/hooks";
import { type CardWithBank } from "./service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard, Wifi, Trash2 } from "lucide-react";

const CARD_COLORS = [
  { name: "Slate", value: "#1e293b" },
  { name: "Zinc", value: "#3f3f46" },
  { name: "Navy", value: "#00175a" },
  { name: "Gold", value: "#b8860b" },
  { name: "Silver", value: "#708090" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Pink", value: "#db2777" },
];

interface CreditCardProps {
  card: CardWithBank;
  onClick: () => void;
}

function CreditCardVisual({ card, onClick }: CreditCardProps) {
  const cardColor = card.color || "#1e293b";

  return (
    <button
      onClick={onClick}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      <div
        className="relative w-full aspect-[1.586/1] rounded-2xl p-5 text-white overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 50%, ${cardColor}aa 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: "white" }}
        />
        <div
          className="absolute -right-4 top-16 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: "white" }}
        />

        {/* Top row: Bank logo and Wifi */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            {card.bank?.image ? (
              <div className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm p-1 flex items-center justify-center">
                <Image
                  src={card.bank.image}
                  alt={card.bank.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            )}
            {card.bank && (
              <span className="text-xs font-medium opacity-80">{card.bank.name}</span>
            )}
          </div>
          <Wifi className="h-5 w-5 opacity-60 rotate-90" />
        </div>

        {/* Chip */}
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 mb-4 flex items-center justify-center">
          <div className="w-6 h-4 border border-yellow-600/30 rounded-sm" />
        </div>

        {/* Card number */}
        <div className="font-mono text-lg tracking-widest mb-4 opacity-90">
          •••• •••• •••• {card.last4 || "••••"}
        </div>

        {/* Card name */}
        <p className="text-sm font-medium tracking-wide uppercase truncate">
          {card.name}
        </p>
      </div>
    </button>
  );
}

function CardSkeleton() {
  return <Skeleton className="w-full aspect-[1.586/1] rounded-2xl" />;
}

export default function CardsPage() {
  const { data: cards = [], isLoading: loadingCards } = useCards();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const isLoading = loadingCards || loadingBanks;

  const [editingCard, setEditingCard] = useState<CardWithBank | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", last4: "", bank_id: "", color: "#1e293b" });

  const resetForm = () => setForm({ name: "", last4: "", bank_id: "", color: "#1e293b" });

  const handleCreate = async () => {
    await createCard.mutateAsync({
      name: form.name,
      last4: form.last4 || null,
      bank_id: form.bank_id || null,
      color: form.color || null,
    });
    setIsCreating(false);
    resetForm();
  };

  const handleEdit = (card: CardWithBank) => {
    setEditingCard(card);
    setForm({
      name: card.name,
      last4: card.last4 || "",
      bank_id: card.bank_id || "",
      color: card.color || "#1e293b",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    await updateCard.mutateAsync({
      id: editingCard.id,
      data: {
        name: form.name,
        last4: form.last4 || null,
        bank_id: form.bank_id || null,
        color: form.color || null,
      },
    });
    setEditingCard(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!editingCard) return;
    await deleteCard.mutateAsync(editingCard.id);
    setShowDeleteConfirm(false);
    setEditingCard(null);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarjetas</h1>
          <p className="text-sm text-muted-foreground">
            Toca una tarjeta para editarla
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <CreditCard className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No tienes tarjetas aún</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar tarjeta
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              onClick={() => handleEdit(card)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Tarjeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Visa Personal"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Últimos 4 dígitos</label>
              <Input
                value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Banco</label>
              <Select
                value={form.bank_id || "__none__"}
                onValueChange={(v) => setForm({ ...form, bank_id: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-all ${
                      form.color === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setForm({ ...form, color: color.value })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createCard.isPending || !form.name}>
              {createCard.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCard && !showDeleteConfirm} onOpenChange={() => setEditingCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tarjeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Últimos 4 dígitos</label>
              <Input
                value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value })}
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Banco</label>
              <Select
                value={form.bank_id || "__none__"}
                onValueChange={(v) => setForm({ ...form, bank_id: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-all ${
                      form.color === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setForm({ ...form, color: color.value })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateCard.isPending || !form.name}>
              {updateCard.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Tarjeta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Estás seguro de eliminar <span className="font-medium text-foreground">{editingCard?.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCard.isPending}>
              {deleteCard.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
