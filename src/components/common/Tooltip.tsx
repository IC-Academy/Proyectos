import React, { useState } from "react";

export function Tooltip({ texto, children }: { texto: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-navy-dark text-white text-xs px-2 py-1 shadow-lg">
          {texto}
        </span>
      )}
    </span>
  );
}
