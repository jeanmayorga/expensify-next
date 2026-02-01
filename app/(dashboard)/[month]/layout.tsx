import { MonthProvider } from "@/lib/month-context";

interface MonthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ month: string }>;
}

export default async function MonthLayout({
  children,
  params,
}: MonthLayoutProps) {
  const { month } = await params;

  return <MonthProvider monthParam={month}>{children}</MonthProvider>;
}
