"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      {/* Time */}
      <Skeleton className="h-4 w-12 shrink-0" />

      {/* Type Icon - smaller */}
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

      {/* Info Section */}
      <div className="flex flex-col min-w-0 flex-1 gap-1.5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3.5 w-28" />
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right space-y-1">
        <Skeleton className="h-5 w-16 ml-auto" />
        <Skeleton className="h-3 w-10 ml-auto" />
      </div>

      {/* Actions placeholder */}
      <div className="w-8" />
    </div>
  );
}
