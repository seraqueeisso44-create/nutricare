"use client"
import type { ReactNode } from "react"

export const inputCls = "w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white"
export const labelCls = "text-xs font-medium text-gray-500 mb-1 block"

export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

export function CampoTexto({
  label, valor, onChange, placeholder,
}: { label: string; valor: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Campo label={label}>
      <input type="text" value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Campo>
  )
}

export function CampoNumero({
  label, valor, onChange, placeholder, step,
}: { label: string; valor: number | undefined; onChange: (v: number) => void; placeholder?: string; step?: number }) {
  return (
    <Campo label={label}>
      <input type="number" value={valor === undefined || valor === 0 ? "" : valor} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} placeholder={placeholder} className={inputCls} />
    </Campo>
  )
}

export function CampoArea({
  label, valor, onChange, placeholder, rows = 3,
}: { label: string; valor: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <Campo label={label}>
      <textarea value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white resize-none" />
    </Campo>
  )
}

export function SecaoTitulo({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-petroleo dark:text-turquesa uppercase tracking-wide mt-2">{children}</h3>
}
