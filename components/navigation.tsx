"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import {
  Home,
  Receipt,
  CreditCard,
  Landmark,
  PiggyBank,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Routes under [month] segment
const monthRoutes = [
  { name: "Inicio", path: "", icon: Home },
  { name: "Transacciones", path: "transactions", icon: Receipt },
  { name: "Tarjetas", path: "cards", icon: CreditCard },
  { name: "Bancos", path: "banks", icon: Landmark },
  { name: "Presupuestos", path: "budgets", icon: PiggyBank },
];

// Routes outside [month] segment
const otherRoutes = [
  { name: "Microsoft", href: "/microsoft", icon: Cloud },
];

export function Navigation() {
  const pathname = usePathname();
  const params = useParams();
  const { accessMode } = useAuth();
  const monthParam = (params.month as string) || format(new Date(), "yyyy-MM");

  const visibleOtherRoutes = accessMode === "readonly" ? [] : otherRoutes;

  const getMonthHref = (path: string) =>
    path ? `/${monthParam}/${path}` : `/${monthParam}`;

  const isActive = (href: string, path?: string) => {
    if (pathname === href) return true;
    if (path && pathname.startsWith(href + "/")) return true;
    return false;
  };

  const allRoutes = [
    ...monthRoutes.map((r) => ({
      name: r.name,
      href: getMonthHref(r.path),
      icon: r.icon,
      path: r.path,
    })),
    ...visibleOtherRoutes.map((r) => ({
      name: r.name,
      href: r.href,
      icon: r.icon,
      path: r.href,
    })),
  ];

  return (
    <nav className="flex overflow-x-auto [&::-webkit-scrollbar]:h-0">
      {allRoutes.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.path);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
