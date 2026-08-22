"use client"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { anamneseVazia, calcularAguaIdeal, type Anamnese, type Paciente } from "@/lib/pacientes"
import { CampoTexto, CampoArea, SecaoTitulo } from "../[id]/campos"
import { CheckCircle2, Droplet, Save, History, ChevronDown, ChevronUp, Clock } from "lucide-react"

const CAMPOS_ANAMNESE: (keyof Anamnese)[] = [
  "queixaPrincipal", "doencasAtuais", "doencasAnteriores", "cirurgias",
  "historicoFamiliar", "medicamentos", "suplementos", "alergias", "intolerancias",
  "habitosIntestinais", "atividadeFisica", "frequenciaAtividade", "horasSono",
  "qualidadeSono", "nivelEstresse", "tabagismo", "consumoAlcool", "consumoAgua",
  "refeicoesPorDia", "horariosRefeicoes", "preferencias", "aversoes",
  "frequenciaRefeicoesFora", "quemPreparaRefeicoes", "restricoes", "objetivos",
  "expectativas", "observacoesAdicionais", "recordatorioAlimentar",
]

function formatarData(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function AbaAnamnese({
  paciente, onSalvar,
}: { paciente: Paciente; onSalvar: (a: Anamnese) => void }) {
  const [form, setForm] = useState<Anamnese>({ ...anamneseVazia(), ...(paciente.anamnese || {}) })
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const set = (k: keyof Anamnese, v: string) => setForm(p => ({ ...p, [k]: v }))

  const preenchidos = useMemo(() => CAMPOS_ANAMNESE.filter(k => form[k]?.trim()).length, [form])
  const totalCampos = CAMPOS_ANAMNESE.length
  const completa = preenchidos === totalCampos
  const pct = Math.round((preenchidos / totalCampos) * 100)

  const aguaIdealMl = calcularAguaIdeal(paciente.peso)
  const aguaIdealL = (aguaIdealMl / 1000).toFixed(1)

  const historico = paciente.historicoAnamnese || []

  const handleCarregarHistorico = (idx: number) => {
    const entry = historico[idx]
    if (entry) setForm({ ...anamneseVazia(), ...entry.anamnese })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Anamnese</h2>
        <Button size="sm" onClick={() => onSalvar(form)}><Save className="w-4 h-4" /> Salvar Anamnese</Button>
      </div>

      <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-500">
            {completa ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Anamnese completa — pronta para salvar!
              </span>
            ) : (
              <>Preenchimento: {preenchidos}/{totalCampos} campos</>
            )}
          </p>
          <span className="text-xs font-bold text-turquesa">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${completa ? "bg-emerald-500" : "bg-turquesa"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {historico.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
          <button onClick={() => setHistoricoAberto(!historicoAberto)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <History className="w-4 h-4" /> Histórico de Anamneses
              <span className="text-xs font-normal text-amber-600/70 dark:text-amber-400/60">({historico.length} {historico.length === 1 ? "versão" : "versões"})</span>
            </span>
            {historicoAberto ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
          </button>
          {historicoAberto && (
            <div className="border-t border-amber-200 dark:border-amber-800/50 divide-y divide-amber-100 dark:divide-amber-800/30 max-h-64 overflow-y-auto">
              {historico.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-amber-100/30 dark:hover:bg-amber-900/15 transition-colors">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-900 dark:text-amber-200 font-medium">{formatarData(entry.data)}</span>
                    <span className="text-xs text-amber-600/60 dark:text-amber-400/50">
                      {CAMPOS_ANAMNESE.filter(k => entry.anamnese[k]?.trim()).length}/{totalCampos} campos
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-700 dark:text-amber-300"
                      onClick={() => setPreviewIdx(previewIdx === idx ? null : idx)}>
                      {previewIdx === idx ? "Fechar" : "Visualizar"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-700 dark:text-emerald-300"
                      onClick={() => handleCarregarHistorico(idx)}>
                      Restaurar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {previewIdx !== null && historico[previewIdx] && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Versão de {formatarData(historico[previewIdx].data)}
            </p>
            <button onClick={() => setPreviewIdx(null)} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200">Fechar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {CAMPOS_ANAMNESE.filter(k => historico[previewIdx].anamnese[k]?.trim()).map(k => (
              <div key={k} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 capitalize">{k.replace(/([A-Z])/g, " $1")}</p>
                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{historico[previewIdx].anamnese[k]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <SecaoTitulo>Histórico Clínico</SecaoTitulo>
      <CampoArea label="Queixa Principal" valor={form.queixaPrincipal} onChange={v => set("queixaPrincipal", v)} placeholder="Qual o motivo principal da consulta?" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoArea label="Doenças Atuais" valor={form.doencasAtuais} onChange={v => set("doencasAtuais", v)} placeholder="Diabetes, hipertensão, etc." />
        <CampoArea label="Doenças Anteriores" valor={form.doencasAnteriores} onChange={v => set("doencasAnteriores", v)} placeholder="Histórico de doenças" />
        <CampoArea label="Cirurgias" valor={form.cirurgias} onChange={v => set("cirurgias", v)} placeholder="Cirurgias realizadas" />
        <CampoArea label="Histórico Familiar" valor={form.historicoFamiliar} onChange={v => set("historicoFamiliar", v)} placeholder="Doenças na família" />
        <CampoArea label="Medicamentos em Uso" valor={form.medicamentos} onChange={v => set("medicamentos", v)} placeholder="Lista de medicamentos" />
        <CampoArea label="Suplementos" valor={form.suplementos} onChange={v => set("suplementos", v)} placeholder="Vitaminas, proteínas, etc." />
        <CampoArea label="Alergias" valor={form.alergias} onChange={v => set("alergias", v)} placeholder="Alergias alimentares ou outras" />
        <CampoArea label="Intolerâncias Alimentares" valor={form.intolerancias} onChange={v => set("intolerancias", v)} placeholder="Lactose, glúten, etc." />
      </div>
      <CampoArea label="Hábitos Intestinais" valor={form.habitosIntestinais} onChange={v => set("habitosIntestinais", v)} />

      <SecaoTitulo>Estilo de Vida</SecaoTitulo>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoTexto label="Atividade Física" valor={form.atividadeFisica} onChange={v => set("atividadeFisica", v)} placeholder="Tipo de exercício" />
        <CampoTexto label="Frequência" valor={form.frequenciaAtividade} onChange={v => set("frequenciaAtividade", v)} placeholder="Ex: 3x por semana" />
        <CampoTexto label="Horas de Sono" valor={form.horasSono} onChange={v => set("horasSono", v)} placeholder="Ex: 7-8 horas" />
        <CampoTexto label="Qualidade do Sono" valor={form.qualidadeSono} onChange={v => set("qualidadeSono", v)} placeholder="Bom, regular, ruim" />
        <CampoTexto label="Nível de Estresse" valor={form.nivelEstresse} onChange={v => set("nivelEstresse", v)} placeholder="Baixo, moderado, alto" />
        <CampoTexto label="Tabagismo" valor={form.tabagismo} onChange={v => set("tabagismo", v)} />
        <CampoTexto label="Consumo de Álcool" valor={form.consumoAlcool} onChange={v => set("consumoAlcool", v)} />
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Consumo de Água</label>
          <input type="text" value={form.consumoAgua} onChange={e => set("consumoAgua", e.target.value)} placeholder="Ex: 2 litros por dia"
            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white" />
          {aguaIdealMl > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-turquesa">
              <Droplet className="w-3 h-3" /> Ingestão ideal estimada: <strong>{aguaIdealL} L/dia</strong> ({aguaIdealMl} ml · peso × 35 ml)
            </p>
          )}
        </div>
      </div>

      <SecaoTitulo>Hábitos Alimentares</SecaoTitulo>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoTexto label="Refeições por Dia" valor={form.refeicoesPorDia} onChange={v => set("refeicoesPorDia", v)} placeholder="Número de refeições" />
        <CampoTexto label="Horários das Refeições" valor={form.horariosRefeicoes} onChange={v => set("horariosRefeicoes", v)} placeholder="Ex: 7h, 12h, 15h, 19h" />
        <CampoArea label="Preferências Alimentares" valor={form.preferencias} onChange={v => set("preferencias", v)} placeholder="Alimentos que gosta" />
        <CampoArea label="Aversões Alimentares" valor={form.aversoes} onChange={v => set("aversoes", v)} placeholder="Alimentos que não gosta" />
        <CampoTexto label="Frequência de Refeições Fora" valor={form.frequenciaRefeicoesFora} onChange={v => set("frequenciaRefeicoesFora", v)} placeholder="Ex: 2x por semana" />
        <CampoTexto label="Quem Prepara as Refeições" valor={form.quemPreparaRefeicoes} onChange={v => set("quemPreparaRefeicoes", v)} placeholder="Próprio paciente, familiar, etc." />
      </div>
      <CampoArea label="Restrições Alimentares" valor={form.restricoes} onChange={v => set("restricoes", v)} placeholder="Vegetariano, vegano, sem glúten, etc." />

      <SecaoTitulo>Objetivos e Expectativas</SecaoTitulo>
      <CampoArea label="Objetivos" valor={form.objetivos} onChange={v => set("objetivos", v)} placeholder="Quais são os objetivos do paciente?" />
      <CampoArea label="Expectativas" valor={form.expectativas} onChange={v => set("expectativas", v)} placeholder="O que o paciente espera do acompanhamento?" />
      <CampoArea label="Observações Adicionais" valor={form.observacoesAdicionais} onChange={v => set("observacoesAdicionais", v)} placeholder="Outras informações relevantes" />

      <SecaoTitulo>Recordatório Alimentar</SecaoTitulo>
      <CampoArea label="Recordatório Alimentar" valor={form.recordatorioAlimentar} onChange={v => set("recordatorioAlimentar", v)}
        placeholder="Descreva detalhadamente tudo o que o paciente comeu e bebeu nas últimas 24 horas, incluindo horários, quantidades e preparo dos alimentos." />

      <div className="flex justify-end pt-2">
        <Button onClick={() => onSalvar(form)}>
          {completa ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {completa ? "Salvar Anamnese Completa" : "Salvar Anamnese"}
        </Button>
      </div>
    </div>
  )
}
