import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { EmptyState } from "./EmptyState";

export interface Columna<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortValue?: (item: T) => string | number;
  className?: string;
}

interface Props<T> {
  columnas: Columna<T>[];
  datos: T[];
  buscablePor?: (item: T) => string;
  filaKey: (item: T) => string;
  vacioTitulo?: string;
  vacioMensaje?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({ columnas, datos, buscablePor, filaKey, vacioTitulo = "Sin resultados", vacioMensaje, onRowClick }: Props<T>) {
  const [busqueda, setBusqueda] = useState("");
  const [ordenPor, setOrdenPor] = useState<string | null>(null);
  const [ordenAsc, setOrdenAsc] = useState(true);

  const filtrados = useMemo(() => {
    let out = datos;
    if (busqueda && buscablePor) {
      const q = busqueda.toLowerCase();
      out = out.filter((d) => buscablePor(d).toLowerCase().includes(q));
    }
    if (ordenPor) {
      const col = columnas.find((c) => c.key === ordenPor);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const va = col.sortValue!(a);
          const vb = col.sortValue!(b);
          if (va < vb) return ordenAsc ? -1 : 1;
          if (va > vb) return ordenAsc ? 1 : -1;
          return 0;
        });
      }
    }
    return out;
  }, [datos, busqueda, buscablePor, ordenPor, ordenAsc, columnas]);

  return (
    <div>
      {buscablePor && (
        <div className="mb-3 relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-xs text-slate-500 uppercase tracking-wide">
              {columnas.map((c) => (
                <th
                  key={c.key}
                  className={`px-3 py-2 font-semibold whitespace-nowrap ${c.sortValue ? "cursor-pointer select-none" : ""} ${c.className ?? ""}`}
                  onClick={() => {
                    if (!c.sortValue) return;
                    if (ordenPor === c.key) setOrdenAsc(!ordenAsc);
                    else {
                      setOrdenPor(c.key);
                      setOrdenAsc(true);
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {ordenPor === c.key && (ordenAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((item) => (
              <tr key={filaKey(item)} className={`hover:bg-surface/60 transition-colors ${onRowClick ? "cursor-pointer" : ""}`} onClick={() => onRowClick?.(item)}>
                {columnas.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 align-middle ${c.className ?? ""}`}>
                    {c.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <EmptyState titulo={vacioTitulo} mensaje={vacioMensaje} />}
      </div>
    </div>
  );
}
