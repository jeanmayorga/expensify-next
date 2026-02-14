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
  LogOut,
  Wallet,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MonthPickerNav } from "@/components/month-picker-nav";
import { SidebarSearch } from "@/components/sidebar-search";

const monthRoutes = [
  { name: "Inicio", path: "", icon: Home },
  { name: "Transacciones", path: "transactions", icon: Receipt },
  { name: "Tarjetas", path: "cards", icon: CreditCard },
  { name: "Bancos", path: "banks", icon: Landmark },
  { name: "Presupuestos", path: "budgets", icon: PiggyBank },
  { name: "Suscripciones", path: "subscriptions", icon: RefreshCw },
];

const otherRoutes = [
  { name: "Microsoft", href: "/microsoft", icon: Cloud },
];

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { accessMode, budgetId, logout } = useAuth();
  const monthParam = (params.month as string) || format(new Date(), "yyyy-MM");

  const visibleOtherRoutes = accessMode === "readonly" && !budgetId ? [] : otherRoutes;

  const getMonthHref = (path: string) =>
    path ? `/${monthParam}/${path}` : `/${monthParam}`;

  const isActive = (href: string, path?: string) => {
    if (pathname === href) return true;
    if (path && pathname.startsWith(href + "/")) return true;
    return false;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link href={`/${monthParam}`} className="flex items-center gap-2.5">
          <Wallet className="h-6 w-6 shrink-0" />
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Expensify
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Month Picker */}
        <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
          <MonthPickerNav />
        </div>
        {/* Search */}
        <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
          <SidebarSearch />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {monthRoutes.map((item) => {
                const href = getMonthHref(item.path);
                const Icon = item.icon;
                const active = isActive(href, item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                      <Link href={href}>
                        <Icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleOtherRoutes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Servicios</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleOtherRoutes.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {budgetId ? (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Limitado a tu presupuesto" className="pointer-events-none opacity-70">
                <Eye />
                <span>Tu presupuesto</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : accessMode === "readonly" ? (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Solo lectura" className="pointer-events-none opacity-70">
                <Eye />
                <span>Solo lectura</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Cerrar sesión">
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
