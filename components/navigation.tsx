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
      <TabsList className="grid w-full grid-cols-8">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <TabsTrigger key={item.href} value={item.href} asChild>
              <Link href={item.href} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
