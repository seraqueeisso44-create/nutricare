"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { calcularIdade, type Paciente, type RegistroCalculo } from "@/lib/pacientes"
import { calcularTMB } from "@/lib/nutricao"
import { CampoNumero, CampoArea, inputCls, labelCls, SecaoTitulo } from "../[id]/campos"
import { Calculator, Send, Trash2 } from "lucide-react"

const FORMULAS = [
  "Mifflin-St Jeor (1990)", "Harris-Benedict (1919)", "Harris-Benedict (1984)",
  "FAO/WHO (2004)", "EER/IOM (2005)", "Cunningham (1980)",
  "Katch-McArdle", "Henry & Rees (1991)", "Tinsley (2018)",
]

const NIVEIS = [
  { valor: 1.2, rotulo: "Sedentário (pouco ou nenhum exercício) — x1.2" },
  { valor: 1.375, rotulo: "Leve (exercício leve 1-3x/semana) — x1.375" },
  { valor: 1.55, rotulo: "Moderado (exercício moderado 3-5x/semana) — x1.55" },
  { valor: 1.725, rotulo: "Intenso (exercício intenso 6-7x/semana) — x1.725" },
  { valor: 1.9, rotulo: "Muito Intenso (atletas, treino 2x/dia) — x1.9" },
  { valor: 1.0, rotulo: "Não se aplica (sem fator de atividade) — x1" },
]

const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }

export function AbaCalculo({
  paciente, onSalvar,
}: { paciente: Paciente; onSalvar: (registros: RegistroCalculo[]) => void }) {
  const { addToast } = useToast()
  const router = useRouter()
  const registros = paciente.calculos || []
  const idadePaciente = calcularIdade(paciente.dataNascimento)

  const [data, setData] = useState(hoje())
  const [formula, setFormula] = useState(FORMULAS[0])
  const [peso, setPeso] = useState(paciente.peso || 0)
  const [altura, setAltura] = useState(paciente.altura || 0)
  const [idade, setIdade] = useState(idadePaciente || 0)
  const [sexo, setSexo] = useState<"masculino" | "feminino">(paciente.sexo)
  const [fatorAtividade, setFatorAtividade] = useState(1.2)
  const [fatorEstresse, setFatorEstresse] = useState(1.0)
  const [ajusteCalorico, setAjusteCalorico] = useState(0)
  const [mlg, setMlg] = useState(0)
  const [observacoes, setObservacoes] = useState("")

  const precisaMlg = formula === "Cunningham (1980)" || formula === "Katch-McArdle"

  const resultado = useMemo(() => {
    if (!peso) return null
    try {
      const mlgVal = precisaMlg ? mlg : undefined
      const tmb = calcularTMB(formula, peso, altura, idade, sexo, mlgVal).tmb
      const get = Math.round(tmb * fatorAtividade * fatorEstresse + ajusteCalorico)
      return { tmb, get }
    } catch {
      return null
    }
  }, [formula, peso, altura, idade, sexo, fatorAtividade, fatorEstresse, ajusteCalorico, mlg, precisaMlg])

  const salvar = () => {
    if (!resultado) { addToast("error", "Verifique os dados (peso obrigatório; MLG para Cunningham/Katch)"); return }
    const reg: RegistroCalculo = {
      id: `ca_${Date.now()}`, data, formula, peso, altura, idade, sexo,
      fatorAtividade, fatorEstresse, ajusteCalorico, tmb: resultado.tmb, get: resultado.get, observacoes,
    }
    onSalvar([reg, ...registros])
    setObservacoes("")
    addToast("success", "Cálculo salvo — abrindo na calculadora")
    router.push(linkCalculadora(reg))
  }

  const remover = (id: string) => onSalvar(registros.filter(r => r.id !== id))

  const linkCalculadora = (r: RegistroCalculo) =>
    `/calculadora?paciente=${paciente.id}&peso=${r.peso}&altura=${r.altura || 0}&idade=${r.idade}&sexo=${r.sexo}` +
    `&formula=${encodeURIComponent(r.formula)}&fa=${r.fatorAtividade}&fe=${r.fatorEstresse}&ajuste=${r.ajusteCalorico}`

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-turquesa" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cálculo Energético</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Data do Cálculo</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fórmula</label>
            <select value={formula} onChange={e => setFormula(e.target.value)} className={inputCls}>
              {FORMULAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {precisaMlg && (
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
            <CampoNumero label="Massa Livre de Gordura — MLG (kg)" valor={mlg} onChange={setMlg} step={0.1}
              placeholder="obrigatório para esta fórmula" />
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {formula === "Katch-McArdle"
                ? "Katch-McArdle: TMB = 370 + 21,6 × MLG"
                : "Cunningham: TMB = 370 + 21,6 × MLG (publicação original: 500 + 22 × LBM)"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CampoNumero label="Peso (kg)" valor={peso} onChange={setPeso} step={0.1} />
          <CampoNumero label="Altura (cm)" valor={altura} onChange={setAltura} step={0.1} />
          <CampoNumero label="Idade (anos)" valor={idade} onChange={setIdade} />
          <div>
            <label className={labelCls}>Sexo</label>
            <select value={sexo} onChange={e => setSexo(e.target.value as "masculino" | "feminino")} className={inputCls}>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Nível de Atividade Física</label>
          <select value={fatorAtividade} onChange={e => setFatorAtividade(parseFloat(e.target.value))} className={inputCls}>
            {NIVEIS.map(n => <option key={n.valor} value={n.valor}>{n.rotulo}</option>)}
          </select>
        </div>

        <SecaoTitulo>Ajustes</SecaoTitulo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fator de Estresse/Injúria (ajuste refinado)</label>
            <input type="number" value={fatorEstresse} step={0.05} min={0.5} max={2.5}
              onChange={e => setFatorEstresse(parseFloat(e.target.value) || 1)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ajuste Calórico (kcal)</label>
            <input type="number" value={ajusteCalorico} step={50}
              onChange={e => setAjusteCalorico(parseFloat(e.target.value) || 0)} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Valores negativos = déficit; positivos = superávit. (1 kg ≈ 7700 kcal)</p>
          </div>
        </div>

        <CampoArea label="Observações" valor={observacoes} onChange={setObservacoes} placeholder="Anotações sobre o cálculo..." />

        {resultado && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center"><p className="text-xs text-gray-500">TMB</p><p className="text-xl font-bold text-petroleo dark:text-turquesa">{resultado.tmb}</p><p className="text-xs text-gray-400">kcal</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Fator total</p><p className="text-xl font-bold text-gray-700 dark:text-gray-200">{(fatorAtividade * fatorEstresse).toFixed(2)}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">GET</p><p className="text-xl font-bold text-turquesa">{resultado.get}</p><p className="text-xs text-gray-400">kcal/dia</p></div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={salvar}><Send className="w-4 h-4" /> Salvar e lançar na calculadora</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de Cálculos ({registros.length})</h2>
        {registros.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">Nenhum cálculo salvo.</p>
        ) : (
          <div className="space-y-2">
            {registros.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    <span className="text-turquesa font-semibold">GET {r.get} kcal</span>
                  </div>
                  <p className="text-xs text-gray-400">{r.formula} · TMB {r.tmb} · FA {r.fatorAtividade} · FE {r.fatorEstresse} · Ajuste {r.ajusteCalorico}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={linkCalculadora(r)} title="Abrir na calculadora"
                    className="p-1.5 rounded-lg hover:bg-turquesa/10 text-gray-400 hover:text-turquesa">
                    <Calculator className="w-4 h-4" />
                  </Link>
                  <button onClick={() => remover(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
