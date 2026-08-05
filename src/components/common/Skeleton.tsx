import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/70 rounded-md ${className ?? "h-4 w-full"}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 p-4 space-y-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}
