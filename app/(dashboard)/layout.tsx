import { Suspense } from "react";
import { Navigation } from "@/components/navigation";
import { MonthPickerNav } from "@/components/month-picker-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto max-w-6xl px-4 py-4 sm:py-6">
        <header className="mb-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-between gap-3 mb-4 h-10" />
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h1 className="text-2xl font-bold">Expensify</h1>
              <MonthPickerNav />
            </div>
            <Navigation />
          </Suspense>
        </header>
        <main>
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
