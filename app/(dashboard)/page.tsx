"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useTransactionsForMonth } from "./transactions/hooks";
import { useCategories } from "./categories/hooks";
import { type Category } from "./categories/service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { data: transactions = [], isLoading: loadingTx } =
    useTransactionsForMonth(new Date());
  const { data: categories = [], isLoading: loadingCat } = useCategories();

  const loading = loadingTx || loadingCat;

  // Calculate stats
  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Get recent transactions (last 10)
  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )
    .slice(0, 10);

  // Get top spending categories
  const categorySpending = transactions
    .filter((tx) => tx.type === "expense" && tx.category)
    .reduce(
      (acc, tx) => {
        const catId = tx.category_id!;
        if (!acc[catId]) {
          acc[catId] = {
            category: tx.category!,
            total: 0,
          };
        }
        acc[catId].total += Math.abs(tx.amount);
        return acc;
      },
      {} as Record<string, { category: Category; total: number }>,
    );

  const topCategories = Object.values(categorySpending)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const currentMonth = format(new Date(), "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            )}
            <p className="text-xs text-muted-foreground capitalize">
              {currentMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
            )}
            <p className="text-xs text-muted-foreground capitalize">
              {currentMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div
                className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(balance)}
              </div>
            )}
            <p className="text-xs text-muted-foreground capitalize">
              {currentMonth}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Últimas 10 transacciones del mes
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay transacciones este mes
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-full ${tx.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpIcon className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(tx.occurred_at), "d MMM", {
                              locale: es,
                            })}
                          </span>
                          {tx.category && (
                            <Badge variant="secondary" className="text-xs">
                              {tx.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>Top 5 categorías del mes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay gastos categorizados este mes
              </p>
            ) : (
              <div className="space-y-4">
                {topCategories.map(({ category, total }) => {
                  const percentage = (total / totalExpenses) * 100;
                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(total)} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color || undefined,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
