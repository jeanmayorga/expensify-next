"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEmails, useEmail } from "./hooks";
import { type MicrosoftMeMessage } from "./service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Calendar, Loader2 } from "lucide-react";

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export default function EmailsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEmails(selectedDate);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const { data: selectedEmail, isLoading: loadingEmail } = useEmail(
    selectedEmailId || "",
  );

  // Flatten all pages into a single array of emails
  const emails = useMemo(() => {
    return data?.pages.flatMap((page) => page.messages) ?? [];
  }, [data]);

  const handleOpenEmail = (email: MicrosoftMeMessage) => {
    setSelectedEmailId(email.id);
  };

  const handleCloseEmail = () => {
    setSelectedEmailId(null);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Emails</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Error al cargar los emails. Asegúrate de estar autenticado con
              Microsoft.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Emails</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{emails.length} emails</span>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          Mostrando emails del{" "}
          {format(
            new Date(selectedDate + "T12:00:00"),
            "d 'de' MMMM 'de' yyyy",
            { locale: es },
          )}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emails del día</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-60" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No hay emails en esta fecha
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow
                    key={email.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenEmail(email)}
                  >
                    <TableCell className="font-medium">{email.from}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {email.subject || "(Sin asunto)"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {email.receivedDateTime
                        ? format(
                            new Date(email.receivedDateTime),
                            "d MMM yyyy, HH:mm",
                            { locale: es },
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEmail(email);
                        }}
                      >
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center p-4 border-t">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Cargar más"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmailId} onOpenChange={handleCloseEmail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <DialogTitle className="pr-8">
                {loadingEmail ? (
                  <Skeleton className="h-6 w-64" />
                ) : (
                  selectedEmail?.subject || "(Sin asunto)"
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          {loadingEmail ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedEmail ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="space-y-2 py-4 border-b flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">De:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmail.from}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Fecha:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedEmail.receivedDateTime
                      ? format(
                          new Date(selectedEmail.receivedDateTime),
                          "EEEE, d 'de' MMMM 'de' yyyy, HH:mm",
                          { locale: es },
                        )
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-auto py-4">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>
            </div>
          ) : (
            <p className="py-4 text-muted-foreground">
              No se pudo cargar el email
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
