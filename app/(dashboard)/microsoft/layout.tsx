"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Bell, FileSearch, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/microsoft", label: "Emails", icon: Mail },
  { href: "/microsoft/subscriptions", label: "Subscriptions", icon: Bell },
  { href: "/microsoft/daily-mailer-extractor", label: "Daily Extractor", icon: FileSearch },
];

export default function MicrosoftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDailyExtractor = pathname.includes("daily-mailer-extractor");
  const isSubscriptions = pathname.includes("subscriptions");

  const pageSubtitle =
    isDailyExtractor
      ? "Extrae transacciones de emails del día"
      : isSubscriptions
        ? "Webhooks y notificaciones"
        : "Emails de bancos y convert to transaction";

  return (
    <div className="space-y-4">
      {/* Header: Microsoft + Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Microsoft</h1>
            <p className="text-sm text-muted-foreground mt-0.5 leading-tight">
              {pageSubtitle}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 border-b pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/microsoft" && pathname.startsWith(tab.href));
            return (
              <Button
                key={tab.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-b-none border-b-2 border-transparent -mb-px h-9 px-3",
                  isActive
                    ? "border-primary text-primary font-medium bg-transparent"
                    : "text-muted-foreground hover:text-foreground",
                )}
                asChild
              >
                <Link href={tab.href}>
                  <Icon className="h-4 w-4 mr-1.5" />
                  {tab.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
