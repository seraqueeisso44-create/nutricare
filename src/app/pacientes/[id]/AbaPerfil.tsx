"use client"
import { Button } from "@/components/ui/button"
import { calcularIdade, type Paciente } from "@/lib/pacientes"
import { Pencil, User, FileText } from "lucide-react"

function CampoDado({ label, valor }: { label: string; valor: string }) {
  const vazio = !valor || valor === "—"
  return (
    <div className="py-2">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm mt-0.5 ${vazio ? "text-gray-400 italic" : "text-gray-900 dark:text-white font-medium"}`}>
        {vazio ? "Não informado" : valor}
      </p>
    </div>
  )
}

export function AbaPerfil({ paciente, onEditar }: { paciente: Paciente; onEditar: () => void }) {
  const idade = calcularIdade(paciente.dataNascimento)
  const dataFmt = paciente.dataNascimento
    ? new Date(paciente.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR")
    : ""

  return (
    <div className="space-y-4">

      {/* Dados Pessoais */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Pessoais</h3>
              <p className="text-[11px] text-gray-400">Informações de cadastro</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEditar} className="text-xs">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 sm:divide-x divide-gray-50 dark:divide-gray-800">
          <div className="space-y-0 sm:pr-6">
            <CampoDado label="Nome Completo" valor={paciente.nome} />
            <CampoDado label="CPF" valor={paciente.cpf || ""} />
            <CampoDado label="Data de Nascimento" valor={dataFmt ? `${dataFmt}${idade ? ` (${idade} anos)` : ""}` : ""} />
            <CampoDado label="Sexo" valor={paciente.sexo === "masculino" ? "Masculino" : paciente.sexo === "feminino" ? "Feminino" : ""} />
          </div>
          <div className="space-y-0 sm:pl-6">
            <CampoDado label="E-mail" valor={paciente.email || ""} />
            <CampoDado label="Telefone" valor={paciente.telefone || ""} />
            <CampoDado label="Profissão" valor={paciente.profissao || ""} />
            <CampoDado label="Objetivo" valor={paciente.objetivo || ""} />
          </div>
        </div>
      </div>

      {/* Observações */}
      {paciente.observacoes && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Observações</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{paciente.observacoes}</p>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!paciente.observacoes && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhuma observação registrada.</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Edite o cadastro para adicionar observações ao prontuário.</p>
        </div>
      )}

    </div>
  )
}
