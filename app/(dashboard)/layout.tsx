import { Navigation } from "@/components/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Expensify</h1>
          <Navigation />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
