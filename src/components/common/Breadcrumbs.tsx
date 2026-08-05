import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-slate-500 mb-1">
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
          {c.to ? (
            <Link to={c.to} className="hover:text-brand-blue hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="text-navy font-medium">{c.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
