"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useBank, useUpdateBank, useDeleteBank } from "../../hooks";
import { type Bank } from "../../service";
import { useCards } from "../../../cards/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Building2, CreditCard } from "lucide-react";

interface BankFormData {
  name: string;
  image: string;
  color: string;
  emails: string;
  extraction_prompt: string;
  blacklisted_subjects: string;
}

const defaultFormValues: BankFormData = {
  name: "",
  image: "",
  color: "#2563eb",
  emails: "",
  extraction_prompt: "",
  blacklisted_subjects: "",
};

function bankToForm(bank: Bank): BankFormData {
  return {
    name: bank.name,
    image: bank.image || "",
    color: bank.color || "#2563eb",
    emails: bank.emails?.join("\n") || "",
    extraction_prompt: bank.extraction_prompt || "",
    blacklisted_subjects: bank.blacklisted_subjects?.join("\n") || "",
  };
}

function formToPayload(form: BankFormData) {
  return {
    name: form.name,
    image: form.image || null,
    color: form.color || null,
    emails: form.emails
      ? form.emails
          .split("\n")
          .map((e) => e.trim())
          .filter(Boolean)
      : null,
    extraction_prompt: form.extraction_prompt || null,
    blacklisted_subjects: form.blacklisted_subjects
      ? form.blacklisted_subjects
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
  };
}

export default function EditBankPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = params.id as string;

  const { data: bank, isLoading } = useBank(bankId);
  const { data: allCards = [] } = useCards();
  const updateBank = useUpdateBank();
  const deleteBank = useDeleteBank();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<BankFormData>({ defaultValues: defaultFormValues });
  const { register, watch, setValue, reset, handleSubmit } = form;
  const color = watch("color") || "#2563eb";
  const imageUrl = watch("image");

  const bankCards = allCards.filter((card) => card.bank_id === bankId);

  useEffect(() => {
    if (bank) {
      reset(bankToForm(bank));
    }
  }, [bank, reset]);

  const onEditSubmit = async (data: BankFormData) => {
    if (!bank) return;
    await updateBank.mutateAsync({
      id: bank.id,
      data: formToPayload(data),
    });
    router.push(`/banks/${bank.id}`);
  };

  const handleDelete = async () => {
    if (!bank) return;
    await deleteBank.mutateAsync(bank.id);
    setShowDeleteConfirm(false);
    router.push("/banks");
  };

  const handleCancel = () => {
    router.push(`/banks/${bankId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Banco no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/banks/${bankId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            {bank.image ? (
              <Image
                src={bank.image}
                alt={bank.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain rounded-xl"
              />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar banco</h1>
            <p className="text-sm text-muted-foreground">{bank.name}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre *</label>
              <Input {...register("name")} placeholder="Banco del Pacífico" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL del logo</label>
              <Input
                {...register("image")}
                placeholder="https://example.com/logo.png"
              />
              {imageUrl && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
                  <Image
                    src={imageUrl}
                    alt="Vista previa"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-xs text-muted-foreground">
                    Vista previa
                  </span>
                </div>
              )}
            </div>

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
                  placeholder="#2563eb"
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Emails de notificación
              </label>
              <Textarea
                {...register("emails")}
                placeholder={"alerts@bank.com\nnotifications@bank.com"}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Un email por línea
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Prompt de extracción
              </label>
              <Textarea
                {...register("extraction_prompt")}
                placeholder="Extrae los detalles de la transacción de este email..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asuntos bloqueados</label>
              <Textarea
                {...register("blacklisted_subjects")}
                placeholder={"Alerta de seguridad\nContraseña cambiada"}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Un asunto por línea. Los emails con estos asuntos se ignorarán.
              </p>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Tarjetas asociadas</h3>
                <span className="text-xs text-muted-foreground">
                  ({bankCards.length})
                </span>
              </div>
              {bankCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay tarjetas asociadas a este banco
                </p>
              ) : (
                <div className="space-y-2">
                  {bankCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <div
                        className="w-8 h-5 rounded"
                        style={{ backgroundColor: card.color || "#1e293b" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {card.name}
                        </p>
                        {card.last4 && (
                          <p className="text-xs text-muted-foreground">
                            •••• {card.last4}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateBank.isPending || !watch("name")}
              >
                {updateBank.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar banco</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Estás seguro de que quieres eliminar{" "}
            <span className="font-medium text-foreground">{bank.name}</span>?
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
              disabled={deleteBank.isPending}
            >
              {deleteBank.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
