"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
  calcularIMC, classificarIMC, calcularIdade, estimarAlturaJoelho, calcularGorduraSeteDobras,
  type Paciente, type RegistroAntropometria, type DobrasCutaneas, type Circunferencias,
} from "@/lib/pacientes"
import { CampoNumero, CampoArea, SecaoTitulo, inputCls, labelCls } from "../[id]/campos"
import { Plus, Trash2, Ruler, ChevronDown, ChevronUp, RulerIcon } from "lucide-react"

const DOBRAS: { key: keyof DobrasCutaneas; label: string }[] = [
  { key: "triceps", label: "Tríceps" }, { key: "biceps", label: "Bíceps" },
  { key: "subescapular", label: "Subescapular" }, { key: "suprailiaca", label: "Suprailíaca" },
  { key: "abdominal", label: "Abdominal" }, { key: "toracica", label: "Torácica" },
  { key: "axilarMedia", label: "Axilar Média" }, { key: "coxa", label: "Coxa" },
  { key: "panturrilha", label: "Panturrilha" }, { key: "supraespinhal", label: "Supraespinhal" },
]

const CIRC: { key: keyof Circunferencias; label: string }[] = [
  { key: "pescoco", label: "Pescoço" }, { key: "ombro", label: "Ombro" },
  { key: "torax", label: "Tórax" }, { key: "bracoRelaxado", label: "Braço Relaxado" },
  { key: "bracoContraido", label: "Braço Contraído" }, { key: "antebraco", label: "Antebraço" },
  { key: "cintura", label: "Cintura" }, { key: "abdomen", label: "Abdômen" },
  { key: "quadril", label: "Quadril" }, { key: "coxa", label: "Coxa" },
  { key: "panturrilha", label: "Panturrilha" },
]

const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }

function novoRegistro(peso: number, altura: number): RegistroAntropometria {
  return {
    id: `an_${Date.now()}`, data: hoje(), incluirGrafico: true,
    peso: peso || 0, altura: altura || 0, formulaGordura: "nenhuma",
    dobras: {}, circunferencias: {}, observacoes: "",
  }
}

function LinhaDobra({ label, valor }: { label: string; valor?: number }) {
  if (valor == null || valor === 0) return null
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded bg-gray-50 dark:bg-gray-800/50">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{valor} mm</span>
    </div>
  )
}

function LinhaCirc({ label, valor }: { label: string; valor?: number }) {
  if (valor == null || valor === 0) return null
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded bg-gray-50 dark:bg-gray-800/50">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{valor} cm</span>
    </div>
  )
}

export function AbaAntropometria({
  paciente, onSalvar,
}: { paciente: Paciente; onSalvar: (registros: RegistroAntropometria[]) => void }) {
  const { addToast } = useToast()
  const registros = paciente.antropometria || []
  const idade = calcularIdade(paciente.dataNascimento)
  const [form, setForm] = useState<RegistroAntropometria>(novoRegistro(paciente.peso, paciente.altura))
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})
  const [mostrarTodasDobras, setMostrarTodasDobras] = useState(false)

  const setF = (k: keyof RegistroAntropometria, v: any) => setForm(p => ({ ...p, [k]: v }))
  const setDobra = (k: keyof DobrasCutaneas, v: number) => setForm(p => ({ ...p, dobras: { ...p.dobras, [k]: v } }))
  const setCirc = (k: keyof Circunferencias, v: number) => setForm(p => ({ ...p, circunferencias: { ...p.circunferencias, [k]: v } }))

  const alturaEstimada = form.alturaJoelho ? estimarAlturaJoelho(form.alturaJoelho, idade, paciente.sexo) : 0
  const imc = calcularIMC(form.peso, form.altura || alturaEstimada)
  const classe = classificarIMC(imc)

  const seteDobras = form.formulaGordura === "Jackson & Pollock (1980) — 7 dobras"
    ? calcularGorduraSeteDobras(form.dobras, idade, paciente.sexo)
    : null

  const salvar = () => {
    if (!form.peso) { addToast("error", "Informe ao menos o peso"); return }
    const reg = { ...form, altura: form.altura || alturaEstimada }
    if (seteDobras) reg.percentualGordura = seteDobras.percentual
    else delete (reg as { percentualGordura?: number }).percentualGordura
    onSalvar([reg, ...registros])
    setForm(novoRegistro(paciente.peso, paciente.altura))
    addToast("success", "Medição registrada")
  }

  const remover = (id: string) => onSalvar(registros.filter(r => r.id !== id))

  const toggleExpand = (id: string) => setExpandido(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-turquesa" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova Medição</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Data da Medição</label>
            <input type="date" value={form.data} onChange={e => setF("data", e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2 sm:mt-6">
            <input type="checkbox" checked={form.incluirGrafico} onChange={e => setF("incluirGrafico", e.target.checked)}
              className="w-4 h-4 rounded accent-turquesa" />
            Incluir no gráfico (para futuros comparativos)
          </label>
        </div>

        <SecaoTitulo>Dados Básicos</SecaoTitulo>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CampoNumero label="Peso (kg)" valor={form.peso} onChange={v => setF("peso", v)} step={0.1} />
          <CampoNumero label="Altura (cm)" valor={form.altura} onChange={v => setF("altura", v)} step={0.1} />
          <CampoNumero label="Altura do joelho (cm)" valor={form.alturaJoelho} onChange={v => setF("alturaJoelho", v)} step={0.1} placeholder="opcional" />
        </div>
        {alturaEstimada > 0 && (
          <p className="text-xs text-gray-500">
            Altura estimada (Chumlea et al., 1985): <strong className="text-turquesa">{alturaEstimada} cm</strong> — para pacientes acamados, cadeirantes ou idosos com cifose.
          </p>
        )}
        {imc > 0 && (
          <div className="inline-flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center"><p className="text-xs text-gray-500">IMC</p><p className="text-xl font-bold text-petroleo dark:text-turquesa">{imc}</p></div>
            <p className={`text-sm font-semibold ${classe.cor}`}>{classe.rotulo}</p>
          </div>
        )}

        <SecaoTitulo>Dobras Cutâneas (mm)</SecaoTitulo>
        <div>
          <label className={labelCls}>Fórmula de cálculo</label>
          <select value={form.formulaGordura} onChange={e => setF("formulaGordura", e.target.value)} className={inputCls}>
            <option value="nenhuma">Nenhuma (apenas registrar dobras)</option>
            <option value="Jackson & Pollock (1980) — 7 dobras">Jackson & Pollock (1980) — 7 dobras</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {form.formulaGordura === "nenhuma"
              ? "Nenhuma fórmula selecionada — registre as dobras desejadas; o % de gordura não será calculado automaticamente."
              : "Requer as 7 dobras: Tríceps, Torácica, Axilar Média, Subescapular, Abdominal, Suprailíaca e Coxa."}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {DOBRAS.map(d => (
            <CampoNumero key={d.key} label={d.label} valor={form.dobras[d.key]} onChange={v => setDobra(d.key, v)} step={0.1} placeholder="mm" />
          ))}
        </div>
        {seteDobras && (
          <div className="inline-flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center"><p className="text-xs text-gray-500">Σ 7 dobras</p><p className="text-lg font-bold text-gray-700 dark:text-gray-200">{seteDobras.somatoria} mm</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">% Gordura (Jackson & Pollock)</p><p className="text-lg font-bold text-turquesa">{seteDobras.percentual}%</p></div>
          </div>
        )}

        <SecaoTitulo>Circunferências (cm)</SecaoTitulo>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CIRC.map(c => (
            <CampoNumero key={c.key} label={c.label} valor={form.circunferencias[c.key]} onChange={v => setCirc(c.key, v)} step={0.1} placeholder="cm" />
          ))}
        </div>

        <CampoArea label="Observações" valor={form.observacoes} onChange={v => setF("observacoes", v)} placeholder="Observações sobre a medição..." />

        <div className="flex justify-end">
          <Button onClick={salvar}><Plus className="w-4 h-4" /> Registrar Medição</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Medições ({registros.length})</h2>
          {registros.length > 0 && (
            <button onClick={() => setMostrarTodasDobras(!mostrarTodasDobras)}
              className="text-xs px-3 py-1.5 rounded-lg border border-turquesa/30 text-turquesa hover:bg-turquesa/5 font-medium transition-colors flex items-center gap-1">
              <RulerIcon className="w-3.5 h-3.5" />
              {mostrarTodasDobras ? "Recolher dobras" : "Expandir todas as dobras"}
            </button>
          )}
        </div>
        {registros.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">Nenhuma medição registrada.</p>
        ) : (
          <div className="space-y-3">
            {registros.map(r => {
              const rimc = calcularIMC(r.peso, r.altura)
              const exp = expandido[r.id] || mostrarTodasDobras
              const dobrasPreenchidas = DOBRAS.filter(d => r.dobras[d.key] != null && r.dobras[d.key] !== 0)
              const circPreenchidas = CIRC.filter(c => r.circunferencias[c.key] != null && r.circunferencias[c.key] !== 0)
              const temDetalhes = dobrasPreenchidas.length > 0 || circPreenchidas.length > 0
              return (
                <div key={r.id} className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">{new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                      <span className="text-gray-500">Peso: <strong>{r.peso}kg</strong></span>
                      {r.altura > 0 && <span className="text-gray-500">Alt: {r.altura}cm</span>}
                      {rimc > 0 && <span className="text-gray-500">IMC: {rimc}</span>}
                      {r.percentualGordura != null && <span className="text-gray-500">%G: <strong className="text-turquesa">{r.percentualGordura}%</strong></span>}
                      {r.incluirGrafico && <span className="text-[10px] px-2 py-0.5 rounded-full bg-turquesa/10 text-turquesa">no gráfico</span>}
                      {temDetalhes && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                          {dobrasPreenchidas.length} dobras · {circPreenchidas.length} circ.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {temDetalhes && (
                        <button onClick={() => toggleExpand(r.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                          title={exp ? "Recolher detalhes" : "Ver dobras e circunferências"}>
                          {exp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => remover(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {exp && temDetalhes && (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-800/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dobrasPreenchidas.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dobras Cutâneas (mm)</p>
                            <div className="space-y-1">
                              {dobrasPreenchidas.map(d => (
                                <LinhaDobra key={d.key} label={d.label} valor={r.dobras[d.key]} />
                              ))}
                              {r.percentualGordura != null && (
                                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-turquesa/10 mt-1">
                                  <span className="text-xs font-semibold text-turquesa">Σ Total / % Gordura</span>
                                  <span className="text-xs font-bold text-turquesa">
                                    {dobrasPreenchidas.reduce((s, d) => s + (r.dobras[d.key] || 0), 0).toFixed(1)} mm → {r.percentualGordura}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {circPreenchidas.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Circunferências (cm)</p>
                            <div className="space-y-1">
                              {circPreenchidas.map(c => (
                                <LinhaCirc key={c.key} label={c.label} valor={r.circunferencias[c.key]} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {r.observacoes && (
                        <div className="mt-3 p-2 rounded bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                          <p className="text-xs text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{r.observacoes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
