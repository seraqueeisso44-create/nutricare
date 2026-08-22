"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import type { Paciente } from "@/lib/pacientes"
import { ClipboardList, Save } from "lucide-react"

export function AbaOrientacoes({
  paciente, onSalvar,
}: { paciente: Paciente; onSalvar: (orientacoes: string) => void }) {
  const { addToast } = useToast()
  const [texto, setTexto] = useState(paciente.orientacoes || "")

  useEffect(() => { setTexto(paciente.orientacoes || "") }, [paciente.id])

  const salvar = () => {
    onSalvar(texto)
    addToast("success", "Orientações salvas")
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-turquesa" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Orientações Nutricionais</h2>
      </div>
      <p className="text-xs text-gray-400">
        Recomendações gerais, condutas, metas e observações para o paciente. Estas orientações ficam salvas no prontuário.
      </p>
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        rows={16}
        placeholder="Ex.: Aumentar ingestão de água para 2,5 L/dia; evitar ultraprocessados; incluir 2 porções de frutas..."
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white leading-relaxed"
      />
      <div className="flex justify-end">
        <Button onClick={salvar}><Save className="w-4 h-4" /> Salvar Orientações</Button>
      </div>
    </div>
  )
}
