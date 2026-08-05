import React from "react";

interface Props {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}

export function Field({ label, children, error, required, hint, className }: Props) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-danger mt-1">{error}</span>}
    </label>
  );
}

const baseInput =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInput} bg-white ${props.className ?? ""}`} />;
}
