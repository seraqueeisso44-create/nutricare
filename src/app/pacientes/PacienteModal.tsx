"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Paciente } from "@/lib/pacientes"
import { X } from "lucide-react"

type FormData = Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">

const vazio: FormData = {
  nome: "", email: "", telefone: "", sexo: "feminino", dataNascimento: "",
  cpf: "", profissao: "", peso: 0, altura: 0, objetivo: "", observacoes: "", status: "ativo",
}

interface Props {
  aberto: boolean
  paciente: Paciente | null
  onClose: () => void
  onSalvar: (dados: FormData) => void
}

export function PacienteModal({ aberto, paciente, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<FormData>(vazio)

  useEffect(() => {
    if (paciente) {
      const { id, criadoEm, atualizadoEm, ...resto } = paciente
      setForm({ ...vazio, ...resto })
    } else {
      setForm(vazio)
    }
  }, [paciente, aberto])

  if (!aberto) return null

  const set = (campo: keyof FormData, valor: any) => setForm(p => ({ ...p, [campo]: valor }))

  const inputCls = "w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white"
  const labelCls = "text-xs text-gray-500 mb-1 block"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {paciente ? "Editar Paciente" : "Novo Paciente"}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input type="text" value={form.nome} onChange={e => set("nome", e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>E-mail</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Telefone</label>
              <input type="text" value={form.telefone} onChange={e => set("telefone", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data de nascimento</label>
              <input type="date" value={form.dataNascimento} onChange={e => set("dataNascimento", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sexo</label>
              <select value={form.sexo} onChange={e => set("sexo", e.target.value)} className={inputCls}>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CPF</label>
              <input type="text" value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Profissão</label>
              <input type="text" value={form.profissao} onChange={e => set("profissao", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Peso (kg)</label>
              <input type="number" value={form.peso || ""} onChange={e => set("peso", parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Altura (cm)</label>
              <input type="number" value={form.altura || ""} onChange={e => set("altura", parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Objetivo</label>
            <input type="text" value={form.objetivo} onChange={e => set("objetivo", e.target.value)} placeholder="Ex: Perda de peso, Hipertrofia..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Observações</label>
            <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white resize-none" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={() => onSalvar(form)} disabled={!form.nome.trim()}>
            {paciente ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
