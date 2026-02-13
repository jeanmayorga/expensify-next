"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MicrosoftMeMessage } from "../../emails/service";

export interface EmailListProps {
  emails: MicrosoftMeMessage[];
  selectedEmailId: string | null;
  onSelectEmail: (email: MicrosoftMeMessage) => void;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  whitelistedEmails: string[];
  bankByEmail: Map<string, { color?: string | null }>;
  isSubjectBlacklisted: (subject: string | undefined) => boolean;
  emptyMessage?: string;
}

export function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  whitelistedEmails,
  bankByEmail,
  isSubjectBlacklisted,
  emptyMessage = "No hay emails en esta fecha",
}: EmailListProps) {
  return (
    <>
      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-3 py-2 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y">
          {emails.map((email) => {
            const isWhitelisted = whitelistedEmails.includes(email.from);
            const isBlacklisted = isSubjectBlacklisted(email.subject);
            const shouldHighlight = isWhitelisted && !isBlacklisted;
            const bank = bankByEmail.get(email.from);
            const bankColor = bank?.color ?? null;
            const highlightStyle =
              shouldHighlight && bankColor
                ? {
                    borderLeftColor: bankColor,
                    backgroundColor: `${bankColor}15`,
                  }
                : undefined;
            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-transparent",
                  selectedEmailId === email.id && "bg-muted",
                  shouldHighlight &&
                    !bankColor &&
                    "border-l-green-500 bg-green-50 dark:bg-green-950/20",
                )}
                style={highlightStyle}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-semibold text-sm">
                    {email.fromName || email.from}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {email.receivedDateTime
                      ? format(
                          new Date(email.receivedDateTime),
                          "HH:mm",
                          { locale: es },
                        )
                      : "—"}
                  </div>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {email.fromName ? email.from : "\u00A0"}
                </div>
                <div className="truncate text-sm">
                  {email.subject || "(Sin asunto)"}
                </div>
              </div>
            );
          })}

          {hasNextPage && (
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
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
        </div>
      )}
    </>
  );
}
