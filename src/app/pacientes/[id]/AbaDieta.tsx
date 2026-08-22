"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import type { Paciente, DietaSalva } from "@/lib/pacientes"
import { UtensilsCrossed, Pencil, Trash2, ChevronDown, Plus, Target } from "lucide-react"

export function AbaDieta({
  paciente, onRemover,
}: { paciente: Paciente; onRemover: (dietaId: string) => void }) {
  const { addToast } = useToast()
  const dietas = paciente.dietas || []
  const [aberta, setAberta] = useState<string | null>(dietas[0]?.id || null)
  const [confirmar, setConfirmar] = useState<DietaSalva | null>(null)

  const remover = () => {
    if (!confirmar) return
    onRemover(confirmar.id)
    addToast("success", "Dieta removida")
    setConfirmar(null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-turquesa" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dietas / Prescrições</h2>
              <p className="text-xs text-gray-500">Dietas validadas na calculadora ficam salvas aqui automaticamente.</p>
            </div>
          </div>
          <Link href={`/calculadora?paciente=${paciente.id}`}>
            <Button size="sm"><Plus className="w-4 h-4" /> Nova Dieta</Button>
          </Link>
        </div>
      </div>

      {dietas.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center">
          <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma dieta salva ainda.</p>
          <p className="text-xs text-gray-400 mb-4">Abra a calculadora, monte o cardápio e clique em &quot;Salvar Dieta no Perfil&quot; na etapa de validação.</p>
          <Link href={`/calculadora?paciente=${paciente.id}`}>
            <Button variant="outline" size="sm"><Plus className="w-4 h-4" /> Criar primeira dieta</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {dietas.map(d => {
            const expandida = aberta === d.id
            return (
              <div key={d.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <button onClick={() => setAberta(expandida ? null : d.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandida ? "" : "-rotate-90"}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{d.titulo}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                        <span>{new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                        <span className="text-turquesa font-medium">{d.totalKcal} kcal</span>
                        <span>P {d.totalProteinas}g · L {d.totalLipidios}g · C {d.totalCarboidratos}g</span>
                        <span>{d.refeicoes.length} refeições</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/calculadora?paciente=${paciente.id}&dieta=${d.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Editar dieta inteira">
                      <Pencil className="w-4 h-4" /> Editar
                    </Link>
                    <button onClick={() => setConfirmar(d)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandida && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-4">
                    {(d.metaKcal || d.metaProteinas) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                        <Target className="w-3.5 h-3.5 text-turquesa" />
                        <span>Meta prescrita: {d.metaKcal ?? "—"} kcal · P {d.metaProteinas ?? "—"}g · L {d.metaLipidios ?? "—"}g · C {d.metaCarboidratos ?? "—"}g</span>
                      </div>
                    )}
                    {d.refeicoes.map((r, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-petroleo dark:text-turquesa">{r.horario} · {r.nome}</p>
                          <p className="text-xs text-gray-400">{r.totalKcal} kcal</p>
                        </div>
                        {r.alimentos.length === 0 ? (
                          <p className="text-xs text-gray-400 pl-1">Sem alimentos.</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {r.alimentos.map((a, j) => (
                              <li key={j} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between gap-2 pl-1">
                                <span>
                                  {a.nome}
                                  <span className="text-gray-400"> — {a.quantidade}g{a.medidaCaseira ? ` (${a.medidaCaseira})` : ""}</span>
                                  {a.substitutos && a.substitutos.length > 0 && (
                                    <span className="text-xs text-turquesa"> · {a.substitutos.length} subst.</span>
                                  )}
                                </span>
                                <span className="text-gray-400 shrink-0">{Math.round(a.kcal * a.quantidade / a.gramas)} kcal</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <Link href={`/calculadora?paciente=${paciente.id}&dieta=${d.id}`}>
                        <Button variant="outline" size="sm"><Pencil className="w-4 h-4" /> Editar dieta inteira</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmar(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Remover dieta</h3>
            <p className="text-sm text-gray-500 mb-4">Remover <strong>{confirmar.titulo}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmar(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={remover}>Remover</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
