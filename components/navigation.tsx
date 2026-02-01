"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navigation = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Transacciones", href: "/transactions", icon: Receipt },
  { name: "Categorías", href: "/categories", icon: Tag },
  { name: "Tarjetas", href: "/cards", icon: CreditCard },
  { name: "Bancos", href: "/banks", icon: Landmark },
  { name: "Presupuestos", href: "/budgets", icon: PiggyBank },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Subs", href: "/subscriptions", icon: Bell },
];

export function Navigation() {
  const pathname = usePathname();

  // Map pathname to tab value
  const currentTab =
    navigation.find((item) => item.href === pathname)?.href || "/";

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="flex w-full overflow-x-auto overflow-y-hidden flex-nowrap gap-0.5 p-1 h-auto min-h-9 sm:grid sm:grid-cols-8 sm:overflow-visible [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
        {navigation.map((item) => {
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
