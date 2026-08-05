import React from "react";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
      {children}
    </span>
  );
}
