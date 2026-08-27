"use client"
import { useState, useMemo } from "react"
import type { Refeicao } from "@/lib/nutricao"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, X } from "lucide-react"

interface Props {
  refeicoes: Refeicao[]
}

const DRI: { rotulo: string; key: string | null; unidade: string; dri: number }[] = [
  { rotulo: "Cálcio", key: "calcio", unidade: "mg", dri: 1000 },
  { rotulo: "Ferro", key: "ferro", unidade: "mg", dri: 8 },
  { rotulo: "Fibras", key: "fibras", unidade: "g", dri: 38 },
  { rotulo: "Fósforo", key: "fosforo", unidade: "mg", dri: 700 },
  { rotulo: "Magnésio", key: "magnesio", unidade: "mg", dri: 420 },
  { rotulo: "Niacina", key: "vitaminaB3", unidade: "mg", dri: 16 },
  { rotulo: "Sódio", key: "sodio", unidade: "mg", dri: 1500 },
  { rotulo: "Piridoxina", key: "vitaminaB6", unidade: "mg", dri: 1.3 },
  { rotulo: "Potássio", key: "potassio", unidade: "mg", dri: 3400 },
  { rotulo: "Riboflavina", key: "vitaminaB2", unidade: "mg", dri: 1.3 },
  { rotulo: "Selênio", key: "selenio", unidade: "mcg", dri: 55 },
  { rotulo: "Vitamina A (REA)", key: "vitaminaA", unidade: "mcg", dri: 900 },
  { rotulo: "Vitamina B9", key: "acidoFolico", unidade: "mcg", dri: 400 },
  { rotulo: "Vitamina B12", key: "vitaminaB12", unidade: "mcg", dri: 2.4 },
  { rotulo: "Vitamina C", key: "vitaminaC", unidade: "mg", dri: 90 },
  { rotulo: "Vitamina D", key: "vitaminaD", unidade: "mcg", dri: 15 },
  { rotulo: "Vitamina E", key: "vitaminaE", unidade: "mg", dri: 15 },
  { rotulo: "Tiamina", key: "vitaminaB1", unidade: "mg", dri: 1.2 },
  { rotulo: "Zinco", key: "zinco", unidade: "mg", dri: 11 },
  { rotulo: "Manganês", key: "manganes", unidade: "mg", dri: 2.3 },
  { rotulo: "Cobre", key: "cobre", unidade: "mg", dri: 0.9 },
]

export function TabelaMicros({ refeicoes }: Props) {
  const [aberta, setAberta] = useState(false)

  const linhas = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const ref of refeicoes) {
      for (const item of ref.alimentos) {
        const alim = item.alimento
        const fator = item.quantidade / alim.gramas
        for (const entry of DRI) {
          if (!entry.key) continue
          const val = (alim as any)[entry.key] ?? 0
          acc[entry.key] = (acc[entry.key] || 0) + val * fator
        }
      }
    }
    return DRI.map(entry => {
      const valorAtual = entry.key ? Math.round(((acc[entry.key] || 0)) * 100) / 100 : 0
      const pct = entry.dri > 0 ? Math.round((valorAtual / entry.dri) * 100) : 0
      return { ...entry, valorAtual, pct }
    })
  }, [refeicoes])

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberta(true)}>
        <ClipboardCheck className="w-4 h-4" /> Ver Micronutrientes
      </Button>

      {aberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAberta(false)}>
          <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">Micronutrientes vs DRI</h3>
              <button onClick={() => setAberta(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase text-[11px]">Nutriente</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase text-[11px]">Valor Atual</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase text-[11px]">DRI</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase text-[11px]">Adequação</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-gray-900">{linha.rotulo}</td>
                      <td className="px-3 py-2.5 text-right">{formatNum(linha.valorAtual)} <span className="text-gray-400 text-[11px]">{linha.unidade}</span></td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{formatNum(linha.dri)} <span className="text-gray-400 text-[11px]">{linha.unidade}</span></td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-semibold ${linha.pct >= 100 ? 'text-emerald-600' : linha.pct >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                          {linha.pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {refeicoes.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhum alimento adicionado ao cardápio</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatNum(n: number): string {
  if (n === 0) return "0"
  if (n < 0.1) return n.toFixed(2)
  if (n < 10) return n.toFixed(2)
  if (n < 100) return n.toFixed(1)
  return Math.round(n).toString()
}
