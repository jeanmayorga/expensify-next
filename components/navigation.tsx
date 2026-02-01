"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Receipt,
  Tag,
  CreditCard,
  Landmark,
  PiggyBank,
  Mail,
  Bell,
} from "lucide-react";

// Routes under [month] segment
const monthRoutes = [
  { name: "Inicio", path: "", icon: Home },
  { name: "Transacciones", path: "transactions", icon: Receipt },
  { name: "Categorías", path: "categories", icon: Tag },
  { name: "Tarjetas", path: "cards", icon: CreditCard },
  { name: "Bancos", path: "banks", icon: Landmark },
  { name: "Presupuestos", path: "budgets", icon: PiggyBank },
];

// Routes outside [month] segment
const otherRoutes = [
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Subs", href: "/subscriptions", icon: Bell },
];

export function Navigation() {
  const pathname = usePathname();
  const params = useParams();
  const monthParam = (params.month as string) || format(new Date(), "yyyy-MM");

  // Build href for month-based routes
  const getMonthHref = (path: string) =>
    path ? `/${monthParam}/${path}` : `/${monthParam}`;

  // Determine current tab value based on pathname
  const getCurrentTab = () => {
    // Check month routes first
    for (const route of monthRoutes) {
      const href = getMonthHref(route.path);
      if (
        pathname === href ||
        (route.path && pathname.startsWith(href + "/"))
      ) {
        return href;
      }
    }
    // Check other routes
    for (const route of otherRoutes) {
      if (pathname === route.href || pathname.startsWith(route.href + "/")) {
        return route.href;
      }
    }
    return getMonthHref("");
  };

  const currentTab = getCurrentTab();

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="flex w-full overflow-x-auto overflow-y-hidden flex-nowrap gap-0.5 p-1 h-auto min-h-9 sm:grid sm:grid-cols-8 sm:overflow-visible [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
        {monthRoutes.map((item) => {
          const href = getMonthHref(item.path);
          const Icon = item.icon;
          return (
            <TabsTrigger
              key={item.path}
              value={href}
              asChild
              className="shrink-0 flex-1 min-w-0 sm:min-w-0"
            >
              <Link
                href={href}
                className="flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline truncate text-xs">
                  {item.name}
                </span>
              </Link>
            </TabsTrigger>
          );
        })}
        {otherRoutes.map((item) => {
          const Icon = item.icon;
          return (
            <TabsTrigger
              key={item.href}
              value={item.href}
              asChild
              className="shrink-0 flex-1 min-w-0 sm:min-w-0"
            >
              <Link
                href={item.href}
                className="flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline truncate text-xs">
                  {item.name}
                </span>
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
