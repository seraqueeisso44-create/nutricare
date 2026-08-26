"use client"
import { useState, useMemo, useEffect, Suspense, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/AppLayout"
import { obterPaciente, calcularIdade, calcularIMC, classificarIMC, salvarDieta, obterDieta, removerDieta, novaDietaId, type DietaSalva, type RefeicaoDieta, type AlimentoDieta } from "@/lib/pacientes"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import {
  calcularTMB, calcularGET, calcularMacrosMetodoA, calcularMacrosMetodoB,
  gerarTabelaValidacao, fatoresAtividade,
  type DadosAntropometricos, type MacrosPrescritas, type Cardapio,
  type Refeicao, type ResultadoGET
} from "@/lib/nutricao"
import { buscarAlimentos, carregarMedidasCustom, criarMedidaCustom, removerMedidaCustom, medidasDisponiveis, rotuloMedidaPorGramas, type MedidaDisponivel } from "@/lib/alimentos"
import type { Alimento } from "@/lib/nutricao"
import type { AlimentoCompleto } from "@/lib/alimentos"
import { TabelaMicros } from "./TabelaMicros"
import { SubstitutoModal } from "./SubstitutoModal"
import { VisualizarDieta } from "./VisualizarDieta"
import { AdicionarAlimentoModal } from "./AdicionarAlimentoModal"
import { SalvarFavoritoModal, UsarFavoritosModal, carregarFavoritosSub, salvarFavoritosSub, type GrupoFavoritoSub } from "./FavoritosSubstitutos"
import {
  User, Calculator, Apple, ClipboardCheck,
  ChevronRight, ChevronLeft, ChevronUp, Plus, Check,
  AlertTriangle, BarChart3, ArrowLeftRight, X, ChevronDown, UserCheck, Target, Users, Ruler, Trash2, Star, Bookmark,
  Flame, Beef, Droplets, Wheat, Scale, FileText,
} from "lucide-react"

type Step = "dados" | "tmb" | "macros" | "cardapio" | "validacao"

const AUTOSAVE_DIETA_ID = "__autosave__"
const AUTOSAVE_INTERVALO_MS = 25000

const formulasDisponiveis = [
  "Mifflin-St Jeor (1990)", "Harris-Benedict (1919)", "Harris-Benedict (1984)",
  "FAO/WHO (2004)", "EER/IOM (2005)", "Cunningham (1980)",
  "Katch-McArdle", "Henry & Rees (1991)", "Tinsley (2018)",
]

const steps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "dados", label: "Dados", icon: User },
  { key: "tmb", label: "Gasto Energético", icon: Calculator },
  { key: "macros", label: "Macronutrientes", icon: BarChart3 },
  { key: "cardapio", label: "Cardápio", icon: Apple },
  { key: "validacao", label: "Validação", icon: ClipboardCheck },
]

export default function CalculadoraPage() {
  return (
    <Suspense fallback={null}>
      <CalculadoraConteudo />
    </Suspense>
  )
}

function CalculadoraConteudo() {
  const { addToast } = useToast()
  const [step, setStep] = useState<Step>("dados")
  const [dados, setDados] = useState<DadosAntropometricos>({
    peso: 0, altura: 0, idade: 0, sexo: "masculino",
  })
  const [formula, setFormula] = useState("Mifflin-St Jeor (1990)")
  const [mlg, setMlg] = useState(0)
  const [fatorAtividade, setFatorAtividade] = useState(1.2)
  const [fatorEstresse, setFatorEstresse] = useState(1.0)
  const [ajusteCalorico, setAjusteCalorico] = useState(0)
  const [resultadoGET, setResultadoGET] = useState<ResultadoGET | null>(null)
  const [metodoMacros, setMetodoMacros] = useState<"A" | "B">("A")
  const [gKg, setGkg] = useState({ proteinas: 2, lipidios: 1, carboidratos: 3 })
  const [percentMacros, setPercentMacros] = useState({ proteinas: 20, lipidios: 30, carboidratos: 50 })
  const [macrosPrescritas, setMacrosPrescritas] = useState<MacrosPrescritas | null>(null)
  const [pacienteNome, setPacienteNome] = useState<string | null>(null)
  const [pacienteObjetivo, setPacienteObjetivo] = useState<string>("")
  const [pacienteId, setPacienteId] = useState<string | null>(null)
  const [pacienteRecordatorio, setPacienteRecordatorio] = useState<string>("")
  const [recordatorioAberto, setRecordatorioAberto] = useState(false)
  const [dietaEditandoId, setDietaEditandoId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const id = searchParams.get("paciente")
    if (!id) return
    ;(async () => {
    const p = await obterPaciente(id)
    if (!p) return
    setPacienteId(p.id)
    setPacienteNome(p.nome)
    setPacienteObjetivo(p.objetivo || "")
    setPacienteRecordatorio(p.anamnese?.recordatorioAlimentar || "")
    setDados({
      peso: p.peso || 0,
      altura: p.altura || 0,
      idade: calcularIdade(p.dataNascimento),
      sexo: p.sexo,
    })

    const pesoParam = searchParams.get("peso")
    if (pesoParam) {
      const fa = parseFloat(searchParams.get("fa") || "")
      const fe = parseFloat(searchParams.get("fe") || "")
      setDados({
        peso: parseFloat(pesoParam) || 0,
        altura: parseFloat(searchParams.get("altura") || "0") || 0,
        idade: parseInt(searchParams.get("idade") || "0", 10) || 0,
        sexo: (searchParams.get("sexo") as "masculino" | "feminino") || p.sexo,
        fatorInjuria: isNaN(fe) ? undefined : fe,
      })
      const formulaParam = searchParams.get("formula")
      if (formulaParam) setFormula(formulaParam)
      if (!isNaN(fa)) setFatorAtividade(fa)
      if (!isNaN(fe) && fe > 0) setFatorEstresse(fe)
      const mlgParam = parseFloat(searchParams.get("mlg") || "0")
      if (mlgParam > 0) setMlg(mlgParam)
      const ajusteParam = parseFloat(searchParams.get("ajuste") || "0")
      if (!isNaN(ajusteParam)) setAjusteCalorico(ajusteParam)
      const formulaUsada = formulaParam || formula
      const mlgUsado = mlgParam > 0 ? mlgParam : undefined
      const dadosFinais = {
        peso: parseFloat(pesoParam) || 0,
        altura: parseFloat(searchParams.get("altura") || "0") || 0,
        idade: parseInt(searchParams.get("idade") || "0", 10) || 0,
        sexo: (searchParams.get("sexo") as "masculino" | "feminino") || p.sexo,
        fatorInjuria: (!isNaN(fe) && fe > 0) ? fe : undefined,
      }
      setDados(dadosFinais)
      try {
        const r = calcularTMB(formulaUsada, dadosFinais.peso, dadosFinais.altura, dadosFinais.idade, dadosFinais.sexo, mlgUsado)
        setResultadoGET(calcularGET(r, (!isNaN(fa) && fa > 0) ? fa : fatorAtividade, dadosFinais))
      } catch {}
      setStep("tmb")
    }

    const dietaId = searchParams.get("dieta")
    if (!dietaId) return
    const dieta = await obterDieta(p.id, dietaId)
    if (!dieta) return
    if (dieta.id === AUTOSAVE_DIETA_ID) {
      setAutosaveAtivo(true)
    } else {
      setDietaEditandoId(dieta.id)
    }
    const subsCol: Record<string, { alimento: AlimentoCompleto; quantidade: number }[]> = {}
    const refs: Refeicao[] = dieta.refeicoes.map((r, refIdx) => {
      const alimentos = r.alimentos.map((a, alimIdx) => {
        const alimento: AlimentoCompleto = {
          id: a.id, nome: a.nome, origem: (a.origem as Alimento["origem"]) || "TACO",
          medidaCaseira: a.medidaCaseira, gramas: a.gramas,
          proteinas: a.proteinas, lipidios: a.lipidios, carboidratos: a.carboidratos,
          fibras: a.fibras, kcal: a.kcal,
          sodio: a.sodio, calcio: a.calcio, ferro: a.ferro, magnesio: a.magnesio,
          fosforo: a.fosforo, potassio: a.potassio, zinco: a.zinco, selenio: a.selenio,
          vitaminaA: a.vitaminaA, vitaminaC: a.vitaminaC, vitaminaD: a.vitaminaD,
          vitaminaE: a.vitaminaE, vitaminaB1: a.vitaminaB1, vitaminaB2: a.vitaminaB2,
          vitaminaB3: a.vitaminaB3, vitaminaB6: a.vitaminaB6, vitaminaB12: a.vitaminaB12,
          acidoFolico: a.acidoFolico,
        }
        if (a.substitutos && a.substitutos.length) {
          subsCol[`${refIdx}_${alimIdx}`] = a.substitutos.map(s => ({
            alimento: {
              id: `sub_${s.nome}`, nome: s.nome, origem: "TACO" as Alimento["origem"],
              medidaCaseira: s.medidaCaseira, gramas: s.gramas,
              proteinas: 0, lipidios: 0, carboidratos: 0, kcal: 0,
            },
            quantidade: s.quantidade,
            medidaCaseira: s.medidaCaseira,
            medidaCaseiraQtd: s.medidaCaseiraQtd || 1,
          }))
        }
        return { alimento, quantidade: a.quantidade, medidaCaseira: a.medidaCaseira, customNome: a.customNome }
      })
      const tot = recalcularRefeicao(alimentos)
      return { nome: r.nome, horario: r.horario, alimentos, ...tot }
    })
    setRefeicoes(refs)
    setSubstitutosColecao(subsCol)
    if (dieta.metaKcal && dieta.metaProteinas != null && dieta.metaLipidios != null && dieta.metaCarboidratos != null) {
      const ptKcal = dieta.metaProteinas * 4
      const liKcal = dieta.metaLipidios * 9
      const cbKcal = dieta.metaCarboidratos * 4
      setMacrosPrescritas({
        proteinasG: dieta.metaProteinas, lipidiosG: dieta.metaLipidios, carboidratosG: dieta.metaCarboidratos,
        proteinasKcal: ptKcal, lipidiosKcal: liKcal, carboidratosKcal: cbKcal,
        kcalTotal: dieta.metaKcal, metodos: "Dieta salva",
      })
    }
    setStep("cardapio")
    })()
  }, [searchParams])

  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([
    { nome: "Café da Manhã", horario: "07:00", alimentos: [], totalKcal: 0, totalProteinas: 0, totalLipidios: 0, totalCarboidratos: 0, totalFibras: 0, densidadeCalorica: 0 },
    { nome: "Almoço", horario: "12:00", alimentos: [], totalKcal: 0, totalProteinas: 0, totalLipidios: 0, totalCarboidratos: 0, totalFibras: 0, densidadeCalorica: 0 },
    { nome: "Jantar", horario: "19:00", alimentos: [], totalKcal: 0, totalProteinas: 0, totalLipidios: 0, totalCarboidratos: 0, totalFibras: 0, densidadeCalorica: 0 },
    { nome: "Ceia", horario: "22:00", alimentos: [], totalKcal: 0, totalProteinas: 0, totalLipidios: 0, totalCarboidratos: 0, totalFibras: 0, densidadeCalorica: 0 },
  ])
  const [cardapio, setCardapio] = useState<Cardapio | null>(null)
  const [adicionarModalRef, setAdicionarModalRef] = useState<number | null>(null)
  const [editarAlimento, setEditarAlimento] = useState<{ refIdx: number; alimIdx: number } | null>(null)
  const [editQtd, setEditQtd] = useState(0)
  const [editMedidaQtd, setEditMedidaQtd] = useState(0)
  const [editNome, setEditNome] = useState("")
  const [editBuscaAlimento, setEditBuscaAlimento] = useState("")
  const [editAlimentoNovo, setEditAlimentoNovo] = useState<AlimentoCompleto | null>(null)
  const [editMedidaSel, setEditMedidaSel] = useState<{ rotulo: string; gramas: number } | null>(null)
  const [editMedidasCustom, setEditMedidasCustom] = useState<{ id: string; rotulo: string; gramas: number }[]>([])
  const [editCriandoMedida, setEditCriandoMedida] = useState(false)
  const [editNovoNome, setEditNovoNome] = useState("")
  const [editNovoGramas, setEditNovoGramas] = useState(0)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [substitutoAberto, setSubstitutoAberto] = useState(false)
  const [substitutoInfo, setSubstitutoInfo] = useState<{ refIdx: number; alimIdx: number; principal: AlimentoCompleto; qtdPrincipal: number } | null>(null)
  const [substitutosColecao, setSubstitutosColecao] = useState<Record<string, { alimento: AlimentoCompleto; quantidade: number; medidaCaseira?: string; medidaCaseiraQtd?: number }[]>>({})
  const [substitutosExpandidos, setSubstitutosExpandidos] = useState<Record<string, boolean>>({})
  const [editarSubstituto, setEditarSubstituto] = useState<{ refIdx: number; alimIdx: number; subIdx: number } | null>(null)
  const [editSubQtd, setEditSubQtd] = useState(0)
  const [editSubNome, setEditSubNome] = useState("")
  const [editSubMedidaSel, setEditSubMedidaSel] = useState<MedidaDisponivel | null>(null)
  const [confirmarAjusteSubs, setConfirmarAjusteSubs] = useState<{ refIdx: number; alimIdx: number; novaQtd: number; nomeAlimento: string } | null>(null)
  const [favoritosSub, setFavoritosSub] = useState<GrupoFavoritoSub[]>([])
  const [salvarFavoritoAberto, setSalvarFavoritoAberto] = useState(false)
  const [favoritosSubAberto, setFavoritosSubAberto] = useState(false)
  const [favoritoAlvo, setFavoritoAlvo] = useState<{ refIdx: number; alimIdx: number } | null>(null)
  const [autosaveAtivo, setAutosaveAtivo] = useState(false)
  const [favoritosLoaded, setFavoritosLoaded] = useState(false)

  useEffect(() => {
    setFavoritosSub(carregarFavoritosSub())
    setFavoritosLoaded(true)
  }, [])

  useEffect(() => {
    if (favoritosLoaded) salvarFavoritosSub(favoritosSub)
  }, [favoritosSub, favoritosLoaded])

  const precisaMlg = formula === "Cunningham (1980)" || formula === "Katch-McArdle"

  useEffect(() => {
    if (!resultadoGET || !dados.peso || !dados.altura || !dados.idade) return
    const dadosComEstresse = { ...dados, fatorInjuria: fatorEstresse > 1 ? fatorEstresse : undefined }
    const r = calcularTMB(formula, dados.peso, dados.altura, dados.idade, dados.sexo, precisaMlg ? mlg : undefined)
    setResultadoGET(calcularGET(r, fatorAtividade, dadosComEstresse))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formula, fatorAtividade, mlg, precisaMlg, dados.peso, dados.altura, dados.idade, dados.sexo, fatorEstresse])

  useEffect(() => {
    if (editarAlimento && editMedidaSel) {
      const novaQtd = Math.round((editMedidaQtd * editMedidaSel.gramas) * 100) / 100
      if (Math.abs(novaQtd - editQtd) > 0.01) setEditQtd(novaQtd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMedidaQtd, editMedidaSel])

  useEffect(() => {
    if (editarAlimento && editMedidaSel && editMedidaSel.gramas > 0) {
      const novaMedidaQtd = Math.round((editQtd / editMedidaSel.gramas) * 100) / 100
      if (Math.abs(novaMedidaQtd - editMedidaQtd) > 0.01) setEditMedidaQtd(novaMedidaQtd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editQtd, editMedidaSel])

  const sn = (v: number | undefined | null) => v ?? 0
  const imc = calcularIMC(dados.peso, dados.altura)
  const classIMC = classificarIMC(imc)

  const handleCalcularTMB = () => {
    if (!dados.peso || !dados.altura || !dados.idade) {
      addToast("error", "Preencha peso, altura e idade"); return
    }
    if (precisaMlg && !mlg) {
      addToast("error", "Informe a Massa Livre de Gordura (MLG) para esta fórmula"); return
    }
    const dadosComEstresse = { ...dados, fatorInjuria: fatorEstresse > 1 ? fatorEstresse : undefined }
    const r = calcularTMB(formula, dados.peso, dados.altura, dados.idade, dados.sexo, precisaMlg ? mlg : undefined)
    setResultadoGET(calcularGET(r, fatorAtividade, dadosComEstresse))
    setStep("tmb")
  }

  const getFinal = resultadoGET ? resultadoGET.get + ajusteCalorico : 0

  const handleCalcularGET = () => setStep("macros")

  const handleCalcularMacros = () => {
    if (!resultadoGET) return
    let resultado: MacrosPrescritas
    if (metodoMacros === "A") {
      resultado = calcularMacrosMetodoA(dados.peso, gKg.proteinas, gKg.lipidios, gKg.carboidratos)
    } else {
      resultado = calcularMacrosMetodoB(getFinal, percentMacros.proteinas, percentMacros.lipidios, percentMacros.carboidratos)
    }
    setMacrosPrescritas(resultado)
    setStep("cardapio")
  }

  

  const recalcularRefeicao = (alimentos: { alimento: Alimento; quantidade: number; customNome?: string }[]) => {
    const totalKcal = Math.round(alimentos.reduce((s, i) => s + sn(i.alimento.kcal) * i.quantidade / i.alimento.gramas, 0))
    const totalProteinas = Math.round(alimentos.reduce((s, i) => s + sn(i.alimento.proteinas) * i.quantidade / i.alimento.gramas, 0) * 10) / 10
    const totalLipidios = Math.round(alimentos.reduce((s, i) => s + sn(i.alimento.lipidios) * i.quantidade / i.alimento.gramas, 0) * 10) / 10
    const totalCarboidratos = Math.round(alimentos.reduce((s, i) => s + sn(i.alimento.carboidratos) * i.quantidade / i.alimento.gramas, 0) * 10) / 10
    const totalFibras = Math.round(alimentos.reduce((s, i) => s + sn(i.alimento.fibras) * i.quantidade / i.alimento.gramas, 0) * 10) / 10
    const totalGramas = totalProteinas + totalLipidios + totalCarboidratos
    return { totalKcal, totalProteinas, totalLipidios, totalCarboidratos, totalFibras, densidadeCalorica: totalGramas > 0 ? Math.round(totalKcal / totalGramas * 100) / 100 : 0 }
  }

  const handleAdicionarAlimento = (alimento: AlimentoCompleto, refIdx: number, gramas: number, medidaCaseira?: string) => {
    setRefeicoes(prev => {
      const updated = [...prev]
      const ref = { ...updated[refIdx] }
      const alimentos = [...ref.alimentos, { alimento, quantidade: gramas, medidaCaseira }]
      const tot = recalcularRefeicao(alimentos)
      updated[refIdx] = { ...ref, alimentos, ...tot }
      return updated
    })
    addToast("success", `${alimento.nome} adicionado`)
  }

  const handleRemoverAlimento = (refIdx: number, alimIdx: number) => {
    setRefeicoes(prev => {
      const updated = [...prev]
      const ref = { ...updated[refIdx] }
      const alimentos = ref.alimentos.filter((_, i) => i !== alimIdx)
      const tot = recalcularRefeicao(alimentos)
      updated[refIdx] = { ...ref, alimentos, ...tot }
      return updated
    })
    const reindexarAposRemocao = (obj: Record<string, any>) => {
      const novo: Record<string, any> = { ...obj }
      Object.keys(novo).forEach(k => {
        const m = k.match(new RegExp(`^${refIdx}_(\\d+)$`))
        if (!m) return
        const idx = parseInt(m[1], 10)
        if (idx === alimIdx) {
          delete novo[k]
        } else if (idx > alimIdx) {
          novo[`${refIdx}_${idx - 1}`] = novo[k]
          delete novo[k]
        }
      })
      return novo
    }
    setSubstitutosColecao(prev => reindexarAposRemocao(prev))
    setSubstitutosExpandidos(prev => reindexarAposRemocao(prev))
    addToast("info", "Alimento e seus substitutos removidos")
  }

  const adicionarRefeicao = () => {
    const num = refeicoes.length + 1
    setRefeicoes(prev => [...prev, { nome: `Refeição ${num}`, horario: "12:00", alimentos: [], totalKcal: 0, totalProteinas: 0, totalLipidios: 0, totalCarboidratos: 0, totalFibras: 0, densidadeCalorica: 0 }])
  }

  const reindexarSubsMealLevel = (op: "remover" | "duplicar" | "mover", idx: number, toIdx?: number) => {
    const reindexMap = (obj: Record<string, any>) => {
      const novo: Record<string, any> = {}
      Object.keys(obj).forEach(k => {
        const m = k.match(/^(\d+)_(.+)$/)
        if (!m) { novo[k] = obj[k]; return }
        const refK = parseInt(m[1], 10)
        const alimK = m[2]
        let newRef = refK
        if (op === "remover") {
          if (refK === idx) return
          if (refK > idx) newRef = refK - 1
        } else if (op === "duplicar") {
          if (refK > idx) newRef = refK + 1
        } else if (op === "mover" && toIdx !== undefined) {
          if (refK === idx) newRef = toIdx
          else if (idx < toIdx && refK > idx && refK <= toIdx) newRef = refK - 1
          else if (idx > toIdx && refK >= toIdx && refK < idx) newRef = refK + 1
        }
        novo[`${newRef}_${alimK}`] = obj[k]
      })
      return novo
    }
    setSubstitutosColecao(prev => reindexMap(prev))
    setSubstitutosExpandidos(prev => reindexMap(prev))
  }

  const removerRefeicao = (idx: number) => {
    if (refeicoes.length <= 1) { addToast("error", "Mínimo 1 refeição"); return }
    setRefeicoes(prev => prev.filter((_, i) => i !== idx))
    reindexarSubsMealLevel("remover", idx)
  }

  const duplicarRefeicao = (idx: number) => {
    const ref = refeicoes[idx]
    const dup = { ...ref, nome: `${ref.nome} (cópia)` }
    setRefeicoes(prev => { const upd = [...prev]; upd.splice(idx + 1, 0, dup); return upd })
    reindexarSubsMealLevel("duplicar", idx)
  }

  const handleMoverRefeicao = (from: number, to: number) => {
    if (to < 0 || to >= refeicoes.length) return
    setRefeicoes(prev => { const upd = [...prev]; const [m] = upd.splice(from, 1); upd.splice(to, 0, m); return upd })
    reindexarSubsMealLevel("mover", from, to)
  }

  const handleTrocarSubstituto = (refIdx: number, alimIdx: number, subIdx: number) => {
    const key = `${refIdx}_${alimIdx}`
    const mainItem = refeicoes[refIdx]?.alimentos[alimIdx]
    const subsArr = substitutosColecao[key] || []
    const subItem = subsArr[subIdx]
    if (!mainItem || !subItem) return
    setRefeicoes(prev => {
      const updated = [...prev]
      const ref = { ...updated[refIdx] }
      const alimentos = [...ref.alimentos]
      alimentos[alimIdx] = { alimento: subItem.alimento, quantidade: subItem.quantidade, medidaCaseira: subItem.medidaCaseira || subItem.alimento.medidaCaseira || "", customNome: subItem.alimento.nome }
      const tot = recalcularRefeicao(alimentos)
      updated[refIdx] = { ...ref, alimentos, ...tot }
      return updated
    })
    setSubstitutosColecao(prev => {
      const arr = [...(prev[key] || [])]
      arr[subIdx] = { alimento: mainItem.alimento, quantidade: mainItem.quantidade, medidaCaseira: (mainItem as any).medidaCaseira || "" }
      return { ...prev, [key]: arr }
    })
    addToast("success", `"${subItem.alimento.nome}" virou principal, "${mainItem.alimento.nome}" virou substituto`)
  }

  const handleEditarSubstituto = (refIdx: number, alimIdx: number, subIdx: number, novaQtd: number, novoNome?: string, medidaCaseira?: string) => {
    const key = `${refIdx}_${alimIdx}`
    setSubstitutosColecao(prev => {
      const arr = [...(prev[key] || [])]
      const item = arr[subIdx]
      if (!item) return prev
      arr[subIdx] = {
        ...item,
        quantidade: novaQtd,
        ...(medidaCaseira !== undefined ? { medidaCaseira } : {}),
        ...(novoNome && novoNome.trim() ? { alimento: { ...item.alimento, nome: novoNome.trim() } } : {}),
      }
      return { ...prev, [key]: arr }
    })
    setEditarSubstituto(null)
    addToast("success", "Substituto atualizado")
  }

  const handleRemoverSubstituto = (refIdx: number, alimIdx: number, subIdx: number) => {
    const key = `${refIdx}_${alimIdx}`
    setSubstitutosColecao(prev => {
      const arr = (prev[key] || []).filter((_, i) => i !== subIdx)
      const next = { ...prev }
      if (arr.length === 0) delete next[key]
      else next[key] = arr
      return next
    })
    addToast("success", "Substituto removido")
  }

  const handleSalvarFavorito = (nome: string) => {
    if (!favoritoAlvo) return
    const key = `${favoritoAlvo.refIdx}_${favoritoAlvo.alimIdx}`
    const itens = (substitutosColecao[key] || []).map(i => ({
      alimento: i.alimento,
      quantidade: i.quantidade,
      medidaCaseira: i.medidaCaseira || i.alimento.medidaCaseira || "",
      medidaCaseiraQtd: i.medidaCaseiraQtd || 1,
    }))
    if (itens.length === 0) return
    setFavoritosSub(prev => {
      const existente = prev.find(f => f.nome.toLowerCase() === nome.toLowerCase())
      const novoGrupo: GrupoFavoritoSub = {
        id: existente?.id || `fav_${Date.now()}`,
        nome,
        itens: JSON.parse(JSON.stringify(itens)),
        criadoEm: existente?.criadoEm || Date.now(),
      }
      const restantes = prev.filter(f => f.id !== novoGrupo.id)
      return [...restantes, novoGrupo]
    })
    setSalvarFavoritoAberto(false)
    setFavoritoAlvo(null)
    addToast("success", `Grupo "${nome}" salvo como favorito`)
  }

  const handleUsarFavorito = (grupo: GrupoFavoritoSub) => {
    if (!favoritoAlvo) return
    const key = `${favoritoAlvo.refIdx}_${favoritoAlvo.alimIdx}`
    const itens = grupo.itens.map(i => ({
      alimento: i.alimento,
      quantidade: i.quantidade,
      medidaCaseira: i.medidaCaseira || i.alimento.medidaCaseira || "",
      medidaCaseiraQtd: i.medidaCaseiraQtd || 1,
    }))
    setSubstitutosColecao(prev => ({ ...prev, [key]: JSON.parse(JSON.stringify(itens)) }))
    setSubstitutosExpandidos(prev => ({ ...prev, [key]: true }))
    setFavoritosSubAberto(false)
    setFavoritoAlvo(null)
    addToast("success", `${grupo.itens.length} substitutos de "${grupo.nome}" aplicados`)
  }

  const handleRemoverFavorito = (id: string) => {
    setFavoritosSub(prev => prev.filter(f => f.id !== id))
    addToast("info", "Favorito excluído")
  }

  const handleMoverAlimento = (refIdx: number, from: number, to: number) => {
    const refAtual = refeicoes[refIdx]
    if (!refAtual) return
    if (to < 0 || to >= refAtual.alimentos.length || from === to) return
    const alimentosNovo = [...refAtual.alimentos]
    const [movido] = alimentosNovo.splice(from, 1)
    alimentosNovo.splice(to, 0, movido)
    const tot = recalcularRefeicao(alimentosNovo)
    setRefeicoes(prev => {
      const updated = [...prev]
      updated[refIdx] = { ...updated[refIdx], alimentos: alimentosNovo, ...tot }
      return updated
    })
    const reindexar = (obj: Record<string, any>) => {
      const mapping: Record<string, string> = {}
      Object.keys(obj).forEach(k => {
        const m = k.match(new RegExp(`^${refIdx}_(\\d+)$`))
        if (!m) return
        const oldIdx = parseInt(m[1], 10)
        const noMeio = from < to ? (oldIdx > from && oldIdx <= to) : (oldIdx >= to && oldIdx < from)
        if (oldIdx === from || noMeio) {
          const item = refAtual.alimentos[oldIdx]
          const newIdx = alimentosNovo.findIndex(a => a === item)
          if (newIdx === -1) mapping[k] = ""
          else if (newIdx !== oldIdx) mapping[k] = `${refIdx}_${newIdx}`
        }
      })
      const novo: Record<string, any> = {}
      Object.keys(obj).forEach(k => {
        if (mapping[k] === "") return
        novo[mapping[k] || k] = obj[k]
      })
      return novo
    }
    setSubstitutosColecao(prev => reindexar(prev))
    setSubstitutosExpandidos(prev => reindexar(prev))
    addToast("info", "Alimento movido na refeição")
  }

  const handleAjustarSubstitutos = (refIdx: number, alimIdx: number, novaQtd: number) => {
    const key = `${refIdx}_${alimIdx}`
    setSubstitutosColecao(prev => {
      const arr = (prev[key] || []).map(s => ({ ...s, quantidade: novaQtd }))
      return { ...prev, [key]: arr }
    })
    addToast("success", "Substitutos ajustados para a nova quantidade")
  }

  const handleGerarCardapio = () => {
    const card: Cardapio = {
      refeicoes,
      totalProteinas: Math.round(refeicoes.reduce((s, r) => s + r.totalProteinas, 0) * 10) / 10,
      totalLipidios: Math.round(refeicoes.reduce((s, r) => s + r.totalLipidios, 0) * 10) / 10,
      totalCarboidratos: Math.round(refeicoes.reduce((s, r) => s + r.totalCarboidratos, 0) * 10) / 10,
      totalFibras: Math.round(refeicoes.reduce((s, r) => s + r.totalFibras, 0) * 10) / 10,
      totalKcal: Math.round(refeicoes.reduce((s, r) => s + r.totalKcal, 0)),
    }
    setCardapio(card); setStep("validacao")
  }

  const validacao = useMemo(() => {
    if (!macrosPrescritas || !cardapio) return []
    return gerarTabelaValidacao(macrosPrescritas, cardapio)
  }, [macrosPrescritas, cardapio])

  const montarRefeicoesDieta = (): RefeicaoDieta[] => {
    return refeicoes.map((r, refIdx) => ({
      nome: r.nome,
      horario: r.horario,
      totalKcal: r.totalKcal,
      totalProteinas: r.totalProteinas,
      totalLipidios: r.totalLipidios,
      totalCarboidratos: r.totalCarboidratos,
      totalFibras: r.totalFibras,
      alimentos: r.alimentos.map((item, alimIdx): AlimentoDieta => {
        const subs = substitutosColecao[`${refIdx}_${alimIdx}`] || []
        const a = item.alimento as any
        return {
          id: item.alimento.id,
          nome: item.customNome || item.alimento.nome,
          origem: item.alimento.origem,
          medidaCaseira: item.medidaCaseira || item.alimento.medidaCaseira || "",
          gramas: item.alimento.gramas,
          quantidade: item.quantidade,
          proteinas: item.alimento.proteinas,
          lipidios: item.alimento.lipidios,
          carboidratos: item.alimento.carboidratos,
          fibras: item.alimento.fibras,
          kcal: item.alimento.kcal,
          customNome: item.customNome,
          substitutos: subs.map(s => ({
            nome: s.alimento.nome,
            gramas: s.alimento.gramas,
            medidaCaseira: s.medidaCaseira || s.alimento.medidaCaseira || "",
            quantidade: s.quantidade,
            medidaCaseiraQtd: s.medidaCaseiraQtd || 1,
          })),
          sodio: a.sodio, calcio: a.calcio, ferro: a.ferro, magnesio: a.magnesio,
          fosforo: a.fosforo, potassio: a.potassio, zinco: a.zinco, selenio: a.selenio,
          vitaminaA: a.vitaminaA, vitaminaC: a.vitaminaC, vitaminaD: a.vitaminaD,
          vitaminaE: a.vitaminaE, vitaminaB1: a.vitaminaB1, vitaminaB2: a.vitaminaB2,
          vitaminaB3: a.vitaminaB3, vitaminaB6: a.vitaminaB6, vitaminaB12: a.vitaminaB12,
          acidoFolico: a.acidoFolico,
        }
      }),
    }))
  }

  const autosaveFnRef = useRef<() => void | Promise<void>>(() => {})
  autosaveFnRef.current = async () => {
    if (!pacienteId) return
    if (step !== "cardapio" && step !== "validacao") return
    const refeicoesDieta = montarRefeicoesDieta()
    if (!refeicoesDieta.some(r => r.alimentos.length > 0)) return
    if (dietaEditandoId && !autosaveAtivo) {
      await removerDieta(pacienteId, AUTOSAVE_DIETA_ID)
      setAutosaveAtivo(true)
    }
    const dietaId = dietaEditandoId || AUTOSAVE_DIETA_ID
    const dietaExistente = dietaEditandoId ? await obterDieta(pacienteId, dietaId) : null
    const atualizado = await salvarDieta(pacienteId, {
      id: dietaId,
      data: new Date().toISOString().slice(0, 10),
      titulo: dietaEditandoId
        ? dietaExistente?.titulo || "Dieta atualizada"
        : "Rascunho (salvo automaticamente)",
      refeicoes: refeicoesDieta,
      totalKcal: Math.round(refeicoes.reduce((s, r) => s + r.totalKcal, 0)),
      totalProteinas: Math.round(refeicoes.reduce((s, r) => s + r.totalProteinas, 0) * 10) / 10,
      totalLipidios: Math.round(refeicoes.reduce((s, r) => s + r.totalLipidios, 0) * 10) / 10,
      totalCarboidratos: Math.round(refeicoes.reduce((s, r) => s + r.totalCarboidratos, 0) * 10) / 10,
      totalFibras: Math.round(refeicoes.reduce((s, r) => s + r.totalFibras, 0) * 10) / 10,
      metaKcal: macrosPrescritas?.kcalTotal,
      metaProteinas: macrosPrescritas?.proteinasG,
      metaLipidios: macrosPrescritas?.lipidiosG,
      metaCarboidratos: macrosPrescritas?.carboidratosG,
      autosave: !dietaEditandoId,
    })
    if (atualizado) setAutosaveAtivo(true)
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      autosaveFnRef.current()
    }, AUTOSAVE_INTERVALO_MS)
    return () => window.clearInterval(interval)
  }, [])

  const handleSalvarPrescricao = async () => {
    if (!pacienteId) {
      addToast("info", "Nenhum paciente vinculado. Abra a calculadora a partir de um paciente para salvar a dieta no perfil.")
      return
    }
    const refeicoesDieta = montarRefeicoesDieta()
    const agora = new Date()
    const dieta: DietaSalva = {
      id: dietaEditandoId || novaDietaId(),
      data: agora.toISOString().slice(0, 10),
      titulo: dietaEditandoId ? "Dieta atualizada" : `Dieta ${agora.toLocaleDateString("pt-BR")}`,
      refeicoes: refeicoesDieta,
      totalKcal: Math.round(refeicoes.reduce((s, r) => s + r.totalKcal, 0)),
      totalProteinas: Math.round(refeicoes.reduce((s, r) => s + r.totalProteinas, 0) * 10) / 10,
      totalLipidios: Math.round(refeicoes.reduce((s, r) => s + r.totalLipidios, 0) * 10) / 10,
      totalCarboidratos: Math.round(refeicoes.reduce((s, r) => s + r.totalCarboidratos, 0) * 10) / 10,
      totalFibras: Math.round(refeicoes.reduce((s, r) => s + r.totalFibras, 0) * 10) / 10,
      metaKcal: macrosPrescritas?.kcalTotal,
      metaProteinas: macrosPrescritas?.proteinasG,
      metaLipidios: macrosPrescritas?.lipidiosG,
      metaCarboidratos: macrosPrescritas?.carboidratosG,
    }

    const atualizado = await salvarDieta(pacienteId, dieta)
    if (atualizado) {
      if (!dietaEditandoId && autosaveAtivo) {
        await removerDieta(pacienteId, AUTOSAVE_DIETA_ID)
        setAutosaveAtivo(false)
      }
      setDietaEditandoId(dieta.id)
      addToast("success", dietaEditandoId
        ? `Dieta atualizada no perfil de ${pacienteNome}`
        : `Dieta salva no perfil de ${pacienteNome}`)
    } else {
      addToast("error", "Não foi possível salvar a dieta")
    }
  }

  const totalProteinas = refeicoes.reduce((s, r) => s + r.totalProteinas, 0)
  const totalLipidios = refeicoes.reduce((s, r) => s + r.totalLipidios, 0)
  const totalCarboidratos = refeicoes.reduce((s, r) => s + r.totalCarboidratos, 0)

  const macrosEstimados = useMemo(() => {
    if (!resultadoGET) return null
    const get = resultadoGET.get
    return {
      proteinasG: Math.round(gKg.proteinas * dados.peso),
      lipidiosG: Math.round(gKg.lipidios * dados.peso),
      carboidratosG: Math.round(gKg.carboidratos * dados.peso),
      proteinasKcal: Math.round(gKg.proteinas * dados.peso * 4),
      lipidiosKcal: Math.round(gKg.lipidios * dados.peso * 9),
      carboidratosKcal: Math.round(gKg.carboidratos * dados.peso * 4),
      kcalTotal: Math.round((gKg.proteinas * dados.peso * 4) + (gKg.lipidios * dados.peso * 9) + (gKg.carboidratos * dados.peso * 4)),
    }
  }, [metodoMacros, gKg, percentMacros, dados.peso, resultadoGET])

  const editResultadosBusca = useMemo(() => {
    return editBuscaAlimento.length >= 2 ? buscarAlimentos(editBuscaAlimento) : []
  }, [editBuscaAlimento])

  const editMedidas = useMemo(() => {
    const alim = editAlimentoNovo
    if (!alim) return []
    const b = alim.gramas
    const k = alim.kcal ?? 0
    const densidade = k > 0 ? Math.min(1.5, Math.max(0.3, k / 200)) : 0.8
    const est = (ml: number) => Math.round(ml * densidade)
    const m = alim.medidaCaseira
    const medidas: { rotulo: string; gramas: number }[] = []

    if (m && m.includes(";")) {
      for (const p of m.split(";")) {
        const match = p.match(/(.+?)\s*=\s*([\d.]+)\s*g\s*/)
        if (match) medidas.push({ rotulo: match[1].trim().replace(/\s+/g, " "), gramas: parseFloat(match[2]) })
      }
    } else if (m && m !== `${b}g`) {
      const partes = m.match(/^([\d\/,.]+)?\s*(.+)/)
      if (partes) {
        const unidade = (partes[2] || m).trim()
        medidas.push({ rotulo: `1 ${unidade}`, gramas: b })
        medidas.push({ rotulo: `1/2 ${unidade}`, gramas: Math.round(b / 2) })
        medidas.push({ rotulo: `2 ${unidade}`, gramas: b * 2 })
      }
    }

    medidas.push({ rotulo: `${b}g (padrão)`, gramas: b })
    medidas.push({ rotulo: `Colher de café`, gramas: Math.max(1, est(2)) })
    medidas.push({ rotulo: `Colher de chá`, gramas: Math.max(1, est(5)) })
    medidas.push({ rotulo: `Colher de sopa`, gramas: Math.max(1, est(15)) })
    medidas.push({ rotulo: `Colher de servir`, gramas: Math.max(1, est(30)) })
    medidas.push({ rotulo: `Xícara de chá (200mL)`, gramas: Math.max(1, est(200)) })
    medidas.push({ rotulo: `Copo americano (200mL)`, gramas: Math.max(1, est(200)) })
    medidas.push({ rotulo: `Unidade média`, gramas: b })
    medidas.push({ rotulo: `Fatia média`, gramas: Math.round(b * 0.6) })

    const vistos = new Set<number>()
    return medidas.filter(m => { if (vistos.has(m.gramas)) return false; vistos.add(m.gramas); return true })
  }, [editAlimentoNovo])

  return (
    <AppLayout>
      <ErrorBoundary>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #C9975A, #D4AA6E)" }}>
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calculadora de Cardápios</h1>
              {pacienteNome
                ? <p className="text-xs text-turquesa font-medium">Paciente: {pacienteNome}</p>
                : <p className="text-xs text-gray-500">TACO · TMB · Macros · Validação</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={pacienteId ? `/pacientes/${pacienteId}` : "/pacientes"}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl btn-gradient text-white transition-all text-sm font-medium"
              title="Ir para Pacientes">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{pacienteId ? "Voltar ao Paciente" : "Pacientes"}</span>
            </Link>
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-1.5 shadow-sm transition-colors duration-300">
          {steps.map((s, i) => {
            const Icon = s.icon
            const active = step === s.key
            const done = steps.findIndex(st => st.key === step) > i
            return (
              <button key={s.key} onClick={() => setStep(s.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${active ? 'bg-petroleo text-white shadow-sm' : done ? 'text-turquesa' : 'text-gray-400 dark:text-gray-500'}`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* STEP 1 - DADOS */}
        {step === "dados" && (
          <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><User className="w-5 h-5 text-turquesa" /> Dados do Paciente</h2>
            {pacienteNome && (
              <div className="flex items-start gap-2 p-3 bg-turquesa/10 border border-turquesa/30 rounded-lg text-sm">
                <UserCheck className="w-5 h-5 text-turquesa flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-petroleo dark:text-turquesa">Dados importados de: {pacienteNome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Peso, altura, idade e sexo foram preenchidos automaticamente.
                    {pacienteObjetivo && <> Objetivo: <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> {pacienteObjetivo}</span></>}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-xs text-gray-500 mb-1 block">Peso (kg)</label>
                <input type="number" value={dados.peso || ""} onChange={e => setDados(p => ({ ...p, peso: parseFloat(e.target.value) || 0 }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Altura (cm)</label>
                <input type="number" value={dados.altura || ""} onChange={e => setDados(p => ({ ...p, altura: parseFloat(e.target.value) || 0 }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Idade</label>
                <input type="number" value={dados.idade || ""} onChange={e => setDados(p => ({ ...p, idade: parseFloat(e.target.value) || 0 }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Sexo</label>
                <select value={dados.sexo} onChange={e => setDados(p => ({ ...p, sexo: e.target.value as "masculino" | "feminino" }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white">
                  <option value="masculino">Masculino</option><option value="feminino">Feminino</option>
                </select></div>
            </div>
            {dados.peso > 0 && dados.altura > 0 && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500">IMC</p>
                  <p className="text-2xl font-bold text-petroleo dark:text-turquesa">{imc}</p>
                </div>
                <div className="text-sm">
                  <p className={`font-semibold ${classIMC.cor}`}>{classIMC.rotulo}</p>
                  <p className="text-gray-400 text-xs">{dados.peso}kg / {dados.altura}cm</p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleCalcularTMB}>Calcular TMB <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* STEP 2 - TMB / GET */}
        {step === "tmb" && resultadoGET && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4 transition-colors duration-300">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Calculator className="w-5 h-5 text-turquesa" /> Gasto Energético</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fórmula</label>
                  <select value={formula} onChange={e => setFormula(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white">
                    {formulasDisponiveis.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                {precisaMlg && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">MLG — Massa Livre de Gordura (kg)</label>
                    <input type="number" value={mlg || ""} onChange={e => setMlg(parseFloat(e.target.value) || 0)} step={0.1}
                      placeholder="obrigatório para esta fórmula"
                      className="w-full h-10 px-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 text-sm dark:text-white focus:ring-2 focus:ring-amber-400" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fator Atividade</label>
                  <select value={fatorAtividade} onChange={e => setFatorAtividade(parseFloat(e.target.value))} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white">
                    {fatoresAtividade.map(f => <option key={f.valor} value={f.valor}>{f.rotulo} ({f.valor})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fator de Estresse / Injúria</label>
                  <input type="number" value={fatorEstresse} step={0.1} min={1}
                    onChange={e => { const v = parseFloat(e.target.value); setFatorEstresse(isNaN(v) ? 1 : Math.max(1, v)) }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                  <p className="text-[10px] text-gray-400 mt-0.5">1.0 = sem estresse | 1.2 = trauma | 1.3 = sepse | 1.5 = queimados grave</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ajuste Calórico (kcal)</label>
                  <input type="number" value={ajusteCalorico || ""} step={1}
                    onChange={e => setAjusteCalorico(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Negativo = déficit | Positivo = superávit (1 kg ≈ 7700 kcal)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "TMB", value: `${resultadoGET.tmb.tmb} kcal`, color: "text-petroleo dark:text-turquesa" },
                  { label: "Fator", value: `${resultadoGET.fatorAtividade}${fatorEstresse > 1 ? ` × ${fatorEstresse} (estresse)` : ""}`, color: "text-gray-600 dark:text-gray-300" },
                  { label: "GET Total", value: `${getFinal} kcal`, color: "text-turquesa font-bold" },
                  { label: "GET/kg", value: `${Math.round(getFinal / dados.peso * 10) / 10} kcal/kg`, color: "text-gray-500 dark:text-gray-400" },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center"><p className="text-xs text-gray-500 mb-1">{item.label}</p><p className={`text-lg ${item.color}`}>{item.value}</p></div>
                ))}
              </div>
              {ajusteCalorico !== 0 && (
                <div className={`flex items-center gap-2 p-2.5 rounded-lg ${ajusteCalorico > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className={`text-sm font-semibold ${ajusteCalorico > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {ajusteCalorico > 0 ? '+' : ''}{ajusteCalorico} kcal/dia
                    {ajusteCalorico > 0 ? ' (superávit)' : ' (déficit)'}
                    {' · '}
                    {ajusteCalorico > 0 ? '+' : ''}{(ajusteCalorico / 7700).toFixed(2)} kg/semana
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400">Fórmula aplicada: <strong>{resultadoGET.tmb.formula}</strong> · TMB: {resultadoGET.tmb.tmb} kcal × FA {resultadoGET.fatorAtividade}{fatorEstresse > 1 ? ` × Estresse ${fatorEstresse}` : ""}{ajusteCalorico !== 0 ? ` ${ajusteCalorico > 0 ? '+' : ''}${ajusteCalorico} kcal` : ""}</p>
              {resultadoGET.ajustes.length > 0 && (
                <div className="text-xs text-gray-500"><strong>Ajustes:</strong> {resultadoGET.ajustes.map(a => `${a.nome} (${a.valor}%)`).join(", ")}</div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("dados")}><ChevronLeft className="w-4 h-4" /> Voltar</Button>
                <Button onClick={handleCalcularGET}>Macronutrientes <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - MACROS */}
        {step === "macros" && (
          <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-turquesa" /> Macros</h2>
            <div className="flex gap-2 mb-2">
              {(["A", "B"] as const).map(m => (
                <button key={m} onClick={() => setMetodoMacros(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium ${metodoMacros === m ? 'bg-petroleo text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                  Método {m === "A" ? "g/kg" : "% GET"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(metodoMacros === "A"
                ? [
                  { label: "Proteínas (g/kg)", key: "proteinas" as const, val: gKg.proteinas },
                  { label: "Lipídios (g/kg)", key: "lipidios" as const, val: gKg.lipidios },
                  { label: "Carboidratos (g/kg)", key: "carboidratos" as const, val: gKg.carboidratos },
                ]
                : [
                  { label: "Proteínas (%)", key: "proteinas" as const, val: percentMacros.proteinas },
                  { label: "Lipídios (%)", key: "lipidios" as const, val: percentMacros.lipidios },
                  { label: "Carboidratos (%)", key: "carboidratos" as const, val: percentMacros.carboidratos },
                ]
              ).map(item => (
                <div key={item.key}><label className="text-xs text-gray-500 mb-1 block">{item.label}</label>
                  <input type="number" value={item.val} onChange={e => {
                    const v = parseFloat(e.target.value) || 0
                    metodoMacros === "A"
                      ? setGkg(p => ({ ...p, [item.key]: v }))
                      : setPercentMacros(p => ({ ...p, [item.key]: v }))
                  }} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white" /></div>
              ))}
            </div>

            {/* Prescrito/Recomendado */}
            {(macrosPrescritas || macrosEstimados) && (
              <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center"><p className="text-xs text-gray-500 mb-1">Proteínas</p><p className="text-lg font-bold text-petroleo dark:text-turquesa">{(macrosPrescritas || macrosEstimados)?.proteinasG ?? 0}g</p><p className="text-xs text-gray-400">{(macrosPrescritas || macrosEstimados)?.proteinasKcal ?? 0} kcal</p></div>
                <div className="text-center"><p className="text-xs text-gray-500 mb-1">Lipídios</p><p className="text-lg font-bold text-turquesa">{(macrosPrescritas || macrosEstimados)?.lipidiosG ?? 0}g</p><p className="text-xs text-gray-400">{(macrosPrescritas || macrosEstimados)?.lipidiosKcal ?? 0} kcal</p></div>
                <div className="text-center"><p className="text-xs text-gray-500 mb-1">Carboidratos</p><p className="text-lg font-bold text-gray-900 dark:text-white">{(macrosPrescritas || macrosEstimados)?.carboidratosG ?? 0}g</p><p className="text-xs text-gray-400">{(macrosPrescritas || macrosEstimados)?.carboidratosKcal ?? 0} kcal</p></div>
                <div className="text-center"><p className="text-xs text-gray-500 mb-1">Total</p><p className="text-lg font-bold text-gray-900 dark:text-white">{(macrosPrescritas || macrosEstimados)?.kcalTotal ?? 0} kcal</p></div>
              </div>
            )}
            {macrosPrescritas && (
              <p className="text-xs text-gray-400">{macrosPrescritas.metodos}</p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("tmb")}><ChevronLeft className="w-4 h-4" /> Voltar</Button>
              <Button onClick={handleCalcularMacros}>{macrosPrescritas ? "Recalcular" : "Calcular Macros"} {!macrosPrescritas && <ChevronRight className="w-4 h-4" />}</Button>
            </div>
          </div>
        )}

        {/* STEP 4 - CARDÁPIO */}
        {step === "cardapio" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Apple className="w-5 h-5 text-turquesa" /> Cardápio</h2>
                <div className="flex items-center gap-2">
                  {pacienteRecordatorio && (
                    <Button variant="outline" size="sm" onClick={() => setRecordatorioAberto(true)}
                      className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      <FileText className="w-4 h-4" /> Recordatório
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={adicionarRefeicao}>
                    <Plus className="w-4 h-4" /> Refeição
                  </Button>
                </div>
              </div>

              {/* REFEIÇÕES */}
              <div className="space-y-3">
                {refeicoes.map((ref, refIdx) => (
                  <div key={refIdx}
                    draggable
                    onDragStart={() => setDragIdx(refIdx)}
                    onDragOver={e => { e.preventDefault(); if (dragIdx !== null && dragIdx !== refIdx) handleMoverRefeicao(dragIdx, refIdx); setDragIdx(refIdx) }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`border border-gray-100 dark:border-gray-800 rounded-xl p-4 transition-all ${dragIdx === refIdx ? 'opacity-50 ring-2 ring-turquesa' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing text-lg" title="Arrastar para reordenar">⋮⋮</span>
                        <input type="text" value={ref.nome} onChange={e => {
                          setRefeicoes(prev => {
                            const upd = [...prev]; upd[refIdx] = { ...upd[refIdx], nome: e.target.value }; return upd
                          })
                        }}
                          className="font-semibold text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-white w-32" />
                        <input type="time" value={ref.horario} onChange={e => {
                          setRefeicoes(prev => {
                            const upd = [...prev]; upd[refIdx] = { ...upd[refIdx], horario: e.target.value }; return upd
                          })
                        }}
                          className="text-xs text-gray-400 bg-transparent border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{ref.totalKcal}kcal | P:{ref.totalProteinas}g L:{ref.totalLipidios}g C:{ref.totalCarboidratos}g</span>
                        <button onClick={() => duplicarRefeicao(refIdx)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-turquesa transition-colors" title="Duplicar refeição">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => removerRefeicao(refIdx)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors" title="Remover refeição">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {ref.alimentos.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">Nenhum alimento adicionado</p>
                    ) : (
                      <div className="space-y-1 mb-3">
                        {ref.alimentos.map((item, alimIdx) => {
                          const key = `${refIdx}_${alimIdx}`
                          const subs = substitutosColecao[key] || []
                          const temSubs = subs.length > 0
                          const expandido = !!substitutosExpandidos[key]
                          return (
                            <div key={alimIdx}>
                              <div
                                onClick={temSubs ? () => setSubstitutosExpandidos(prev => ({ ...prev, [key]: !prev[key] })) : undefined}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${temSubs ? 'bg-turquesa/10 dark:bg-turquesa/20 border border-turquesa/40 cursor-pointer hover:bg-turquesa/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {temSubs && (
                                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-turquesa transition-transform ${expandido ? '' : '-rotate-90'}`} />
                                  )}
                                   <span className={`font-medium truncate ${temSubs ? 'text-petroleo dark:text-turquesa' : 'text-gray-800 dark:text-gray-200'}`}>{(item as any).customNome || item.alimento.nome}</span>
                                   {(item as any).medidaCaseira && (
                                     <span className="text-gray-400 shrink-0">{(item as any).medidaCaseira}</span>
                                   )}
                                   <span className="text-gray-400 shrink-0">{item.quantidade}g</span>
                                  <span className="text-gray-400 shrink-0">{Math.round(sn(item.alimento.kcal) * item.quantidade / item.alimento.gramas)}kcal</span>
                                  <span className="text-gray-400 shrink-0">
                                    P:{Math.round(sn(item.alimento.proteinas) * item.quantidade / item.alimento.gramas * 10) / 10}
                                    L:{Math.round(sn(item.alimento.lipidios) * item.quantidade / item.alimento.gramas * 10) / 10}
                                    C:{Math.round(sn(item.alimento.carboidratos) * item.quantidade / item.alimento.gramas * 10) / 10}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                   <button onClick={(e) => { e.stopPropagation(); handleMoverAlimento(refIdx, alimIdx, alimIdx - 1) }}
                                     disabled={alimIdx === 0}
                                     className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-petroleo dark:hover:text-turquesa transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" title="Mover para cima">
                                     <ChevronUp className="w-3.5 h-3.5" />
                                   </button>
                                   <button onClick={(e) => { e.stopPropagation(); handleMoverAlimento(refIdx, alimIdx, alimIdx + 1) }}
                                     disabled={alimIdx === ref.alimentos.length - 1}
                                     className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-petroleo dark:hover:text-turquesa transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" title="Mover para baixo">
                                     <ChevronDown className="w-3.5 h-3.5" />
                                   </button>
                                   <button onClick={(e) => {
                                     e.stopPropagation()
                                      setEditarAlimento({ refIdx, alimIdx })
                                      setEditQtd(item.quantidade)
                                      setEditMedidaQtd(0)
                                      setEditNome((item as any).customNome || item.alimento.nome)
                                      setEditAlimentoNovo(null)
                                      setEditBuscaAlimento("")
                                      setEditMedidaSel(null)
                                     setEditMedidasCustom(carregarMedidasCustom(item.alimento.id))
                                     setEditCriandoMedida(false)
                                     setEditNovoNome("")
                                     setEditNovoGramas(0)
                                   }}
                                     className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-amber-500 transition-colors" title="Editar quantidade/medida">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setSubstitutoInfo({ refIdx, alimIdx, principal: item.alimento, qtdPrincipal: item.quantidade }); setSubstitutoAberto(true) }}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-turquesa transition-colors" title="Adicionar substituto">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleRemoverAlimento(refIdx, alimIdx) }}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {temSubs && expandido && (
                                <div className="ml-4 mt-1 space-y-1">
                                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-petroleo/10 dark:bg-petroleo/20 rounded-lg border border-petroleo/20 dark:border-petroleo/30">
                                    <span className="font-semibold text-petroleo dark:text-turquesa">{(item as any).customNome || item.alimento.nome}</span>
                                    <span className="text-petroleo/60 dark:text-turquesa/60">{item.quantidade}g</span>
                                    <span className="text-petroleo/60 dark:text-turquesa/60">
                                      kcal:{Math.round(sn(item.alimento.kcal) * item.quantidade / item.alimento.gramas)}
                                      P:{Math.round(sn(item.alimento.proteinas) * item.quantidade / item.alimento.gramas * 10) / 10}
                                      L:{Math.round(sn(item.alimento.lipidios) * item.quantidade / item.alimento.gramas * 10) / 10}
                                      C:{Math.round(sn(item.alimento.carboidratos) * item.quantidade / item.alimento.gramas * 10) / 10}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={(e) => { e.stopPropagation(); setFavoritoAlvo({ refIdx, alimIdx }); setSalvarFavoritoAberto(true) }}
                                      disabled={subs.length === 0}
                                      className="text-[11px] px-2.5 py-1.5 rounded-lg border border-turquesa/40 text-turquesa hover:bg-turquesa/5 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1">
                                      <Star className="w-3 h-3" /> Salvar substitutos atuais como favorito
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setFavoritoAlvo({ refIdx, alimIdx }); setFavoritosSubAberto(true) }}
                                      className="text-[11px] px-2.5 py-1.5 rounded-lg border border-amber-400/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium transition-all inline-flex items-center gap-1">
                                      <Bookmark className="w-3 h-3" /> Usar substitutos favoritos
                                    </button>
                                  </div>
                                  {subs.map((sub, subIdx) => {
                                    const g = sub.quantidade
                                    const subC = (k: string) => {
                                      const v = (sub.alimento as any)[k] ?? 0
                                      return v * g / (sub.alimento.gramas || 100)
                                    }
                                    const mainC = (k: string) => {
                                      const v = (item.alimento as any)[k] ?? 0
                                      return v * g / (item.alimento.gramas || 100)
                                    }
                                    const base = { P: mainC("proteinas"), L: mainC("lipidios"), C: mainC("carboidratos") }
                                    const diffs = [
                                      { k: "P" as const, val: subC("proteinas") - base.P },
                                      { k: "L" as const, val: subC("lipidios") - base.L },
                                      { k: "C" as const, val: subC("carboidratos") - base.C },
                                    ]
                                    const diffOk = (d: number, b: number) => Math.abs(d) <= Math.max(2, Math.abs(b) * 0.15)
                                    return (
                                      <div key={subIdx} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5 text-xs border border-amber-100 dark:border-amber-800">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <ArrowLeftRight className="w-3 h-3 text-amber-500 shrink-0" />
                                            <span className="text-amber-800 dark:text-amber-300 truncate">{sub.alimento.nome}</span>
                                            {sub.medidaCaseira && (
                                              <span className="inline-flex items-center gap-0.5 shrink-0 bg-amber-100 dark:bg-amber-800/40 rounded-md px-1.5 py-0.5">
                                                <button onClick={(e) => { e.stopPropagation(); const novaQtd = Math.max(1, (sub.medidaCaseiraQtd || 1) - 1); setSubstitutosColecao(prev => { const col = { ...prev }; const key2 = `${refIdx}_${alimIdx}`; col[key2] = [...(col[key2] || [])]; col[key2][subIdx] = { ...col[key2][subIdx], medidaCaseiraQtd: novaQtd }; return col }) }}
                                                  className="w-4 h-4 rounded flex items-center justify-center text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-700/50 font-bold text-[10px] leading-none transition-colors">−</button>
                                                <span className="text-amber-700 dark:text-amber-300 font-bold min-w-[14px] text-center">{sub.medidaCaseiraQtd || 1}x</span>
                                                <button onClick={(e) => { e.stopPropagation(); const novaQtd = (sub.medidaCaseiraQtd || 1) + 1; setSubstitutosColecao(prev => { const col = { ...prev }; const key2 = `${refIdx}_${alimIdx}`; col[key2] = [...(col[key2] || [])]; col[key2][subIdx] = { ...col[key2][subIdx], medidaCaseiraQtd: novaQtd }; return col }) }}
                                                  className="w-4 h-4 rounded flex items-center justify-center text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-700/50 font-bold text-[10px] leading-none transition-colors">+</button>
                                                <span className="text-amber-500 dark:text-amber-400 text-[11px]">{sub.medidaCaseira}</span>
                                              </span>
                                            )}
                                            <span className="text-amber-600 dark:text-amber-400">{g}g</span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => { setEditarSubstituto({ refIdx, alimIdx, subIdx }); setEditSubQtd(sub.quantidade); setEditSubNome(sub.alimento.nome); setEditSubMedidaSel(null) }}
                                              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 text-amber-500 hover:text-amber-700 ml-1" title="Editar substituto">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleRemoverSubstituto(refIdx, alimIdx, subIdx)}
                                              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 text-amber-500 hover:text-red-600 ml-1" title="Remover substituto">
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleTrocarSubstituto(refIdx, alimIdx, subIdx)}
                                              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 font-medium ml-1" title="Trocar">
                                              Trocar
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                          <span className="text-amber-600 dark:text-amber-400">
                                            P:{Math.round(subC("proteinas") * 10) / 10} L:{Math.round(subC("lipidios") * 10) / 10} C:{Math.round(subC("carboidratos") * 10) / 10}
                                          </span>
                                          <span className="text-amber-400">|</span>
                                          <span className="text-amber-500 dark:text-amber-300 font-medium">vs {((item as any).customNome || item.alimento.nome)}:</span>
                                          {diffs.map(d => (
                                            <span key={d.k} className={`font-bold ${diffOk(d.val, base[d.k]) ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-500"}`}>
                                              {d.k} {d.val >= 0 ? "+" : ""}{Math.round(d.val * 10) / 10}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <button onClick={() => setAdicionarModalRef(refIdx)}
                      className="w-full text-center py-1.5 rounded-lg text-xs font-medium text-turquesa hover:bg-turquesa/5 border border-dashed border-gray-200 dark:border-gray-700 transition-all">
                      + Adicionar Alimento
                    </button>
                  </div>
                ))}
              </div>

              {/* FOOD BROWSER MODAL */}
              <AdicionarAlimentoModal
                aberto={adicionarModalRef !== null}
                onClose={() => setAdicionarModalRef(null)}
                onAdicionar={(alimento, gramas, medidaCaseira) => {
                  if (adicionarModalRef === null) return
                  handleAdicionarAlimento(alimento, adicionarModalRef, gramas, medidaCaseira)
                  setAdicionarModalRef(null)
                }}
                nomeRefeicao={adicionarModalRef !== null ? refeicoes[adicionarModalRef]?.nome : ""}
              />

              {/* EDITAR QUANTIDADE MODAL */}
              {editarAlimento && (() => {
                const item = refeicoes[editarAlimento.refIdx]?.alimentos[editarAlimento.alimIdx]
                if (!item) return null
                const alimFinal = editAlimentoNovo || item.alimento
                const medidasComCustom = [
                  ...editMedidasCustom.map(m => ({ rotulo: m.rotulo, gramas: m.gramas, custom: true, customId: m.id })),
                  ...editMedidas,
                ]
                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setEditarAlimento(null); setEditAlimentoNovo(null); setEditBuscaAlimento(""); setEditMedidaSel(null); setEditMedidasCustom([]); setEditCriandoMedida(false); }}>
              <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4 max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar item</h3>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Trocar alimento (opcional)</label>
                        <div className="relative">
                          <input type="text" value={editBuscaAlimento}
                            onChange={e => { setEditBuscaAlimento(e.target.value); setEditAlimentoNovo(null); setEditMedidaSel(null); setEditMedidasCustom([]); setEditCriandoMedida(false); if (e.target.value.length >= 2) { setEditAlimentoNovo(null) } }}
                            placeholder="Buscar alimento para trocar..."
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                          {editBuscaAlimento.length >= 2 && !editAlimentoNovo && (
                            <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {editResultadosBusca.slice(0, 10).map(a => (
                                <button key={a.id} onClick={() => {
                                  setEditAlimentoNovo(a); setEditBuscaAlimento(""); setEditMedidaSel(null); setEditMedidasCustom(carregarMedidasCustom(a.id)); setEditCriandoMedida(false)
                                }} className="w-full text-left px-3 py-2 text-sm hover:bg-turquesa/10 dark:hover:bg-turquesa/10">
                                  <span className="font-medium text-gray-900 dark:text-white">{a.nome}</span>
                                  <span className="text-xs text-gray-400 ml-2">{a.kcal} kcal/100g</span>
                                </button>
                              ))}
                              {editResultadosBusca.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">Nenhum resultado</p>}
                            </div>
                          )}
                        </div>
                        {editAlimentoNovo && (
                          <div className="flex items-center gap-2 mt-1.5 px-2 py-1.5 bg-turquesa/10 border border-turquesa/30 rounded-lg text-xs">
                            <span className="text-turquesa font-medium">Trocou para:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{editAlimentoNovo.nome}</span>
                            <button onClick={() => { setEditAlimentoNovo(null); setEditMedidaSel(null); setEditMedidasCustom([]); setEditCriandoMedida(false) }}
                              className="ml-auto p-0.5 rounded hover:bg-turquesa/20 text-gray-500"><X className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nome (opcional)</label>
                        <input type="text" value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-500">Medida caseira:</label>
                          <button onClick={() => setEditCriandoMedida(!editCriandoMedida)}
                            className="flex items-center gap-1 text-xs font-medium text-turquesa hover:text-turquesa/80 px-2 py-0.5 rounded hover:bg-turquesa/10">
                            <Ruler className="w-3 h-3" /> Criar medida
                          </button>
                        </div>
                        {editCriandoMedida && (
                          <div className="flex items-end gap-2 p-2 mb-2 bg-turquesa/5 border border-turquesa/20 rounded-lg">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 mb-0.5 block">Nome</label>
                              <input type="text" value={editNovoNome} onChange={e => setEditNovoNome(e.target.value)}
                                placeholder="Ex: Concha grande, Pires..."
                                className="w-full h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs dark:text-white" />
                            </div>
                            <div className="w-20">
                              <label className="text-[10px] text-gray-500 mb-0.5 block">Gramas</label>
                              <input type="number" value={editNovoGramas || ""} onChange={e => setEditNovoGramas(parseFloat(e.target.value) || 0)}
                                placeholder="g" min={0} step={1}
                                className="w-full h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-center dark:text-white" />
                            </div>
                            <Button size="sm" className="h-8 text-xs" onClick={async () => {
                              if (!editAlimentoNovo || !editNovoNome.trim() || !editNovoGramas) return
                              await criarMedidaCustom(editAlimentoNovo.id, editNovoNome.trim(), editNovoGramas)
                              setEditMedidasCustom(carregarMedidasCustom(editAlimentoNovo.id))
                              setEditMedidaSel({ rotulo: editNovoNome.trim(), gramas: editNovoGramas })
                              setEditNovoNome(""); setEditNovoGramas(0); setEditCriandoMedida(false)
                            }} disabled={!editAlimentoNovo || !editNovoNome.trim() || !editNovoGramas}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg p-1">
                          {medidasComCustom.map((med, i) => (
                            <div key={`edit_med_${i}`} className="flex items-center gap-1 group">
                              <button onClick={() => { setEditMedidaSel(med); if (med.gramas > 0) setEditMedidaQtd(Math.round((editQtd / med.gramas) * 100) / 100) }} title={`${med.gramas}g`}
                                className={`flex-1 text-left px-2 py-1 rounded text-xs transition-all ${editMedidaSel?.rotulo === med.rotulo && editMedidaSel?.gramas === med.gramas
                                  ? 'bg-turquesa/10 text-turquesa font-medium border border-turquesa/30'
                                  : (med as any).custom
                                    ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium border border-amber-200/50 dark:border-amber-700/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                                {med.rotulo}
                              </button>
                              {(med as any).custom && (
                                <button onClick={async () => {
                                  await removerMedidaCustom((med as any).customId)
                                  setEditMedidasCustom(editAlimentoNovo ? carregarMedidasCustom(editAlimentoNovo.id) : [])
                                  setEditMedidaSel(null)
                                }} className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {editMedidaSel ? (
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">Medida caseira ({editMedidaSel.rotulo})</label>
                            <input type="number" value={editMedidaQtd || ""} min={0.1} step={0.1}
                              onChange={e => setEditMedidaQtd(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                              className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                          </div>
                          <div className="text-center px-1 pb-2 text-gray-400 text-xs font-bold">=</div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">Gramas</label>
                            <input type="number" value={editQtd} min={0.1} step={0.1}
                              onChange={e => setEditQtd(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                              className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Quantidade (g)</label>
                          <input type="number" value={editQtd} min={0.1} step={0.1}
                            onChange={e => setEditQtd(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500">
                          {Math.round(sn(alimFinal.kcal) * editQtd / alimFinal.gramas)} kcal
                          {" · P:"}{Math.round(sn(alimFinal.proteinas) * editQtd / alimFinal.gramas * 10) / 10}g
                          {" L:"}{Math.round(sn(alimFinal.lipidios) * editQtd / alimFinal.gramas * 10) / 10}g
                          {" C:"}{Math.round(sn(alimFinal.carboidratos) * editQtd / alimFinal.gramas * 10) / 10}g
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setEditarAlimento(null); setEditAlimentoNovo(null); setEditBuscaAlimento(""); setEditMedidaSel(null); setEditMedidasCustom([]); setEditCriandoMedida(false) }}>Cancelar</Button>
                        <Button className="flex-1" onClick={() => {
                          const alimRef = editAlimentoNovo || item.alimento
                          const novaQtd = editQtd
                          const antQtd = item.quantidade
                          let medidaTexto = ""
                          if (editMedidaSel) {
                            const qtdMedida = Math.round(novaQtd / editMedidaSel.gramas * 10) / 10
                            medidaTexto = qtdMedida === 1 ? editMedidaSel.rotulo : `${qtdMedida}x ${editMedidaSel.rotulo}`
                          } else if (editAlimentoNovo) {
                            medidaTexto = `${novaQtd}g`
                          } else {
                            medidaTexto = `${novaQtd}g`
                          }
                          setRefeicoes(prev => {
                            const updated = [...prev]
                            const ref = { ...updated[editarAlimento.refIdx] }
                            const alimentos = [...ref.alimentos]
                            const patch: any = { quantidade: novaQtd, customNome: editNome || undefined }
                            if (editAlimentoNovo || editMedidaSel) patch.medidaCaseira = medidaTexto
                            if (editAlimentoNovo) patch.alimento = editAlimentoNovo
                            alimentos[editarAlimento.alimIdx] = { ...alimentos[editarAlimento.alimIdx], ...patch }
                            const tot = recalcularRefeicao(alimentos)
                            updated[editarAlimento.refIdx] = { ...ref, alimentos, ...tot }
                            return updated
                          })
                          const key = `${editarAlimento.refIdx}_${editarAlimento.alimIdx}`
                          const temSubs = (substitutosColecao[key] || []).length > 0
                          if (temSubs && novaQtd !== antQtd && !editAlimentoNovo) {
                            setConfirmarAjusteSubs({ refIdx: editarAlimento.refIdx, alimIdx: editarAlimento.alimIdx, novaQtd, nomeAlimento: (item as any).customNome || item.alimento.nome })
                          } else if (editAlimentoNovo) {
                            addToast("success", `Alimento trocado para ${editAlimentoNovo.nome}`)
                          } else {
                            addToast("success", "Quantidade atualizada")
                          }
                          setEditarAlimento(null); setEditAlimentoNovo(null); setEditBuscaAlimento(""); setEditMedidaSel(null); setEditMedidasCustom([]); setEditCriandoMedida(false)
                        }}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── RESUMO NUTRICIONAL — Mini-cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Kcal", value: refeicoes.reduce((s, r) => s + r.totalKcal, 0).toFixed(0), icon: Flame, unit: "kcal", accent: "from-petroleo to-verde" },
                  { label: "Proteínas", value: totalProteinas.toFixed(1), icon: Beef, unit: "g", accent: "from-[#C0392B] to-[#E74C3C]" },
                  { label: "Lipídios", value: totalLipidios.toFixed(1), icon: Droplets, unit: "g", accent: "from-amber-600 to-amber-500" },
                  { label: "Carboidratos", value: totalCarboidratos.toFixed(1), icon: Wheat, unit: "g", accent: "from-blue-600 to-blue-500" },
                  { label: "Dens. calórica", value: refeicoes.length > 0 ? (refeicoes.reduce((s, r) => s + r.totalKcal, 0) / Math.max(1, refeicoes.reduce((s, r) => s + r.totalProteinas + r.totalLipidios + r.totalCarboidratos, 0))).toFixed(2) : "0", icon: Scale, unit: "kcal/g", accent: "from-turquesa to-dourado" },
                ].map(c => {
                  const Icon = c.icon
                  return (
                    <div key={c.label}
                      className="relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-[#123328] border border-gray-100 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all duration-200 group">
                      <div className={`absolute -right-3 -top-3 w-14 h-14 rounded-full bg-gradient-to-br ${c.accent} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.accent} flex items-center justify-center mb-2.5 shadow-sm`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{c.label}</p>
                      <p className="text-xl font-bold text-verde-escuro-txt dark:text-branco-suave mt-0.5 leading-tight">
                        {c.value}<span className="text-xs font-normal text-gray-400 ml-0.5">{c.unit}</span>
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* ── COMPARAÇÃO: Cardápio × Prescrito ── */}
              {macrosPrescritas && (() => {
                const macros = [
                  { label: "Proteínas", icon: Beef, atual: totalProteinas, prescrito: macrosPrescritas.proteinasG, barColor: "#C0392B" },
                  { label: "Lipídios", icon: Droplets, atual: totalLipidios, prescrito: macrosPrescritas.lipidiosG, barColor: "#D4AA6E" },
                  { label: "Carboidratos", icon: Wheat, atual: totalCarboidratos, prescrito: macrosPrescritas.carboidratosG, barColor: "#3B82F6" },
                ]
                return (
                  <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-5 shadow-sm transition-colors duration-300">
                    <p className="text-xs font-bold text-verde-escuro-txt dark:text-branco-suave uppercase tracking-wider mb-4">Comparação: Cardápio × Prescrito</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {macros.map(m => {
                        const Icon = m.icon
                        const diff = m.atual - m.prescrito
                        const pct = m.prescrito > 0 ? Math.round(diff / m.prescrito * 100) : 0
                        const absPct = Math.abs(pct)
                        const progresso = m.prescrito > 0 ? Math.min(100, Math.round((m.atual / m.prescrito) * 100)) : 0
                        const isCritico = absPct > 50
                        const isModerado = absPct > 10
                        const statusColor = isCritico
                          ? "text-[#C0392B]"
                          : isModerado
                            ? "text-[#C9975A]"
                            : "text-[#245C45]"
                        const barBg = isCritico
                          ? "bg-[#C0392B]"
                          : isModerado
                            ? "bg-[#C9975A]"
                            : "bg-[#245C45]"
                        const barGradient = isCritico
                          ? "linear-gradient(90deg, #C0392B, #E74C3C)"
                          : isModerado
                            ? "linear-gradient(90deg, #C9975A, #D4AA6E)"
                            : "linear-gradient(90deg, #0F3D2E, #245C45, #2E6B4F)"
                        return (
                          <div key={m.label}
                            className={`rounded-xl p-4 border transition-all duration-200 ${
                              isCritico
                                ? "bg-[#C0392B]/5 dark:bg-[#C0392B]/10 border-[#C0392B]/20"
                                : isModerado
                                  ? "bg-[#C9975A]/5 dark:bg-[#C9975A]/10 border-[#C9975A]/20"
                                  : "bg-[#245C45]/5 dark:bg-[#245C45]/10 border-[#245C45]/20"
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.barColor + "18" }}>
                                  <Icon className="w-3.5 h-3.5" style={{ color: m.barColor }} />
                                </div>
                                <span className="text-sm font-semibold text-verde-escuro-txt dark:text-branco-suave">{m.label}</span>
                              </div>
                              {isCritico && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#C0392B] bg-[#C0392B]/10 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" /> Crítico
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline gap-2 mb-1.5">
                              <span className="text-lg font-bold text-verde-escuro-txt dark:text-branco-suave">{m.atual.toFixed(1)}g</span>
                              <span className="text-xs text-gray-400">de</span>
                              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{m.prescrito}g</span>
                            </div>

                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                              <div className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${progresso}%`,
                                  background: barGradient,
                                  boxShadow: `0 1px 4px ${m.barColor}33`,
                                }} />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${statusColor}`}>
                                {diff > 0 ? "+" : ""}{diff.toFixed(1)}g
                              </span>
                              <span className={`text-xs font-bold ${statusColor}`}>
                                {pct > 0 ? "+" : ""}{pct}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between text-xs text-gray-400">
                      <span>Kcal no cardápio: <strong className="text-verde-escuro-txt dark:text-branco-suave">{refeicoes.reduce((s, r) => s + r.totalKcal, 0)}</strong></span>
                      <span>·</span>
                      <span>Prescrito: <strong className="text-verde-escuro-txt dark:text-branco-suave">{Math.round(macrosPrescritas.proteinasG * 4 + macrosPrescritas.lipidiosG * 9 + macrosPrescritas.carboidratosG * 4)} kcal</strong></span>
                    </div>
                  </div>
                )
              })()}

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setStep("macros")}><ChevronLeft className="w-4 h-4" /> Voltar</Button>
                {refeicoes.some(r => r.alimentos.length > 0) && (
                  <Button variant="turquoise" onClick={handleGerarCardapio} className="btn-gold text-white">
                    Validar Cardápio <ClipboardCheck className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {autosaveAtivo && (
                <div className="mt-2 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Salvamento automático a cada 25s ativo
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5 - VALIDAÇÃO - Dashboard Análise de Nutrientes */}
        {step === "validacao" && cardapio && macrosPrescritas && (() => {
          const ptKcal = Math.round(cardapio.totalProteinas * 4)
          const liKcal = Math.round(cardapio.totalLipidios * 9)
          const cbKcal = Math.round(cardapio.totalCarboidratos * 4)
          const totalMacroKcal = ptKcal + liKcal + cbKcal
          const ptPct = totalMacroKcal > 0 ? Math.round(ptKcal / totalMacroKcal * 100) : 0
          const liPct = totalMacroKcal > 0 ? Math.round(liKcal / totalMacroKcal * 100) : 0
          const cbPct = totalMacroKcal > 0 ? Math.round(cbKcal / totalMacroKcal * 100) : 0
          const cbLivres = Math.max(0, Math.round(cardapio.totalCarboidratos - cardapio.totalFibras))
          const totalG = cardapio.totalProteinas + cardapio.totalLipidios + cardapio.totalCarboidratos
          const kcalNaoProteica = cardapio.totalKcal - ptKcal
          const densidadeCalorica = totalG > 0 ? (cardapio.totalKcal / totalG).toFixed(1) : "0.0"

          function d(p: number, c: number) { const v = c - p; return v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1) }
          function pc(p: number, c: number) { return p > 0 ? ((c - p) / p) * 100 : 0 }

          const linhasTabela = [
            { param: "Proteínas totais", prescrito: `${macrosPrescritas.proteinasG}g`, teorico: `${cardapio.totalProteinas}g`, dif: `${d(macrosPrescritas.proteinasG, cardapio.totalProteinas)}g`, ok: Math.abs(pc(macrosPrescritas.proteinasG, cardapio.totalProteinas)) <= 10 },
            { param: "Lipídios totais", prescrito: `${macrosPrescritas.lipidiosG}g`, teorico: `${cardapio.totalLipidios}g`, dif: `${d(macrosPrescritas.lipidiosG, cardapio.totalLipidios)}g`, ok: Math.abs(pc(macrosPrescritas.lipidiosG, cardapio.totalLipidios)) <= 10 },
            { param: "Carboidratos totais", prescrito: `${macrosPrescritas.carboidratosG}g`, teorico: `${cardapio.totalCarboidratos}g`, dif: `${d(macrosPrescritas.carboidratosG, cardapio.totalCarboidratos)}g`, ok: Math.abs(pc(macrosPrescritas.carboidratosG, cardapio.totalCarboidratos)) <= 10 },
            { param: "Fibras totais", prescrito: `${macrosPrescritas.fibrasG || 0}g`, teorico: `${cardapio.totalFibras}g`, dif: `${d(macrosPrescritas.fibrasG || 0, cardapio.totalFibras)}g`, ok: true },
            { param: "Carboidratos livres", prescrito: "-", teorico: `${cbLivres}g`, dif: "-", ok: true, info: true },
            { param: "Calorias totais", prescrito: `${macrosPrescritas.kcalTotal} Kcal`, teorico: `${cardapio.totalKcal} Kcal`, dif: `${d(macrosPrescritas.kcalTotal, cardapio.totalKcal)} Kcal`, ok: Math.abs(pc(macrosPrescritas.kcalTotal, cardapio.totalKcal)) <= 10 },
            { param: "Kcal não proteica / gN", prescrito: "-", teorico: `${kcalNaoProteica} Kcal`, dif: "-", ok: true },
            { param: "Densidade calórica", prescrito: "-", teorico: `${densidadeCalorica} Kcal/g`, dif: "-", ok: true },
          ]

          return (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
                <div className="px-6 py-4">
                  <h2 className="text-base font-bold text-white">Análise de nutrientes do cardápio</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Coluna esquerda — Tabela */}
                  <div className="px-6 pb-5">
                    <div className="rounded-lg overflow-hidden border border-slate-600/50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-700/60">
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wide">Parâmetro</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wide">Prescrito</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wide">Teórico</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wide">Diferença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linhasTabela.map((l, i) => (
                            <tr key={i} className={`border-t border-slate-600/30 ${i % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/20'}`}>
                              <td className="px-3 py-2 text-slate-200 font-medium whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  {l.param}
                                  {l.info && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-600/60 text-slate-400 text-[10px] font-bold cursor-help" title="Carboidratos - Fibras">?</span>
                                  )}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-400">{l.prescrito}</td>
                              <td className="px-3 py-2 text-slate-200">{l.teorico}</td>
                              <td className="px-3 py-2">
                                <span className={`font-medium ${l.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{l.dif}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Coluna direita — Gráfico */}
                  <div className="px-6 pb-5 flex flex-col items-center justify-center">
                    <div className="relative" style={{ width: 220, height: 220 }}>
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {(() => {
                          const r = 75, cx = 100, cy = 100, stroke = 30
                          const circ = 2 * Math.PI * r
                          const ptLen = totalMacroKcal > 0 ? (ptKcal / totalMacroKcal) * circ : 0
                          const liLen = totalMacroKcal > 0 ? (liKcal / totalMacroKcal) * circ : 0
                          const cbLen = totalMacroKcal > 0 ? (cbKcal / totalMacroKcal) * circ : 0
                          return (
                            <>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
                              {ptLen > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={stroke}
                                strokeDasharray={`${ptLen} ${circ - ptLen}`} strokeDashoffset={circ * 0.25} strokeLinecap="butt" />}
                              {liLen > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eab308" strokeWidth={stroke}
                                strokeDasharray={`${liLen} ${circ - liLen}`} strokeDashoffset={circ * 0.25 - ptLen} strokeLinecap="butt" />}
                              {cbLen > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth={stroke}
                                strokeDasharray={`${cbLen} ${circ - cbLen}`} strokeDashoffset={circ * 0.25 - ptLen - liLen} strokeLinecap="butt" />}
                            </>
                          )
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{cardapio.totalKcal}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kcal</p>
                        </div>
                      </div>
                    </div>

                    {/* Legend cards 2x2 */}
                    <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-xs">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <div className="w-1 h-8 rounded-full bg-red-500 shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-400 leading-tight">Proteínas</p>
                          <p className="text-xs font-bold text-white">{ptKcal} Kcal</p>
                          <p className="text-[10px] text-slate-500">{ptPct}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <div className="w-1 h-8 rounded-full bg-blue-500 shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-400 leading-tight">Carboidratos</p>
                          <p className="text-xs font-bold text-white">{cbKcal} Kcal</p>
                          <p className="text-[10px] text-slate-500">{cbPct}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <div className="w-1 h-8 rounded-full bg-yellow-500 shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-400 leading-tight">Lipídios</p>
                          <p className="text-xs font-bold text-white">{liKcal} Kcal</p>
                          <p className="text-[10px] text-slate-500">{liPct}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <div className="w-1 h-8 rounded-full bg-teal-400 shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-400 leading-tight">Total de Kcal</p>
                          <p className="text-xs font-bold text-white">{cardapio.totalKcal} Kcal</p>
                          <p className="text-[10px] text-slate-500">100%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação e micros */}
              <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-4 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TabelaMicros refeicoes={refeicoes} />
                    <VisualizarDieta cardapio={cardapio} substitutosColecao={substitutosColecao} />
                  </div>
                  <div className="flex items-center gap-3">
                    {autosaveAtivo && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Salvamento automático a cada 25s ativo
                      </span>
                    )}
                    <Button variant="outline" onClick={() => setStep("cardapio")}><ChevronLeft className="w-4 h-4" /> Ajustar Cardápio</Button>
                    <Button variant="turquoise" onClick={handleSalvarPrescricao}>
                      <Check className="w-4 h-4" /> {pacienteId ? (dietaEditandoId ? "Atualizar Dieta no Perfil" : "Salvar Dieta no Perfil") : "Salvar Prescrição"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* CONFIRMAR AJUSTE AUTOMATICO DE SUBSTITUTOS */}
        {confirmarAjusteSubs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmarAjusteSubs(null)}>
            <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ajustar substitutos?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Você alterou <strong>{confirmarAjusteSubs.nomeAlimento}</strong> para <strong>{confirmarAjusteSubs.novaQtd}g</strong>.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Deseja que os substitutos também sejam ajustados para <strong>{confirmarAjusteSubs.novaQtd}g</strong>?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  addToast("info", "Substitutos mantidos sem alteração")
                  setConfirmarAjusteSubs(null)
                }}>Não, manter</Button>
                <Button className="flex-1" onClick={() => {
                  handleAjustarSubstitutos(confirmarAjusteSubs.refIdx, confirmarAjusteSubs.alimIdx, confirmarAjusteSubs.novaQtd)
                  setConfirmarAjusteSubs(null)
                }}>Sim, ajustar</Button>
              </div>
            </div>
          </div>
        )}

        {/* EDITAR SUBSTITUTO */}
        {editarSubstituto && (() => {
          const key = `${editarSubstituto.refIdx}_${editarSubstituto.alimIdx}`
          const sub = (substitutosColecao[key] || [])[editarSubstituto.subIdx]
          if (!sub) return null
          const subMedidas = medidasDisponiveis(sub.alimento)
          const medidaSel = editSubMedidaSel
          const medidaPreview = medidaSel ? rotuloMedidaPorGramas(editSubQtd, medidaSel) : null
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditarSubstituto(null)}>
              <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Editar substituto</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{sub.alimento.nome}</p>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nome (opcional)</label>
                  <input type="text" value={editSubNome} onChange={e => setEditSubNome(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Medida caseira:</label>
                  <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg p-1">
                    {subMedidas.map((med, i) => (
                      <button key={`sub_med_${i}`} onClick={() => { setEditSubMedidaSel(med); setEditSubQtd(med.gramas) }}
                        title={`${med.gramas}g`}
                        className={`flex-1 text-left px-2 py-1 rounded text-xs transition-all ${editSubMedidaSel?.rotulo === med.rotulo && editSubMedidaSel?.gramas === med.gramas
                          ? 'bg-turquesa/10 text-turquesa font-medium border border-turquesa/30'
                          : med.custom
                            ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium border border-amber-200/50 dark:border-amber-700/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                        {med.rotulo}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {medidaSel ? (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Medida ({medidaSel.rotulo})</label>
                        <input type="number" value={Math.round((editSubQtd / medidaSel.gramas) * 100) / 100 || ""} min={0.1} step={0.1}
                          onChange={e => { const v = Math.max(0.1, parseFloat(e.target.value) || 0.1); setEditSubQtd(Math.round(v * medidaSel.gramas * 100) / 100) }}
                          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                      </div>
                      <div className="text-center px-1 pb-2 text-gray-400 text-xs font-bold">=</div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Gramas</label>
                        <input type="number" value={editSubQtd} min={0.1} step={0.1}
                          onChange={e => setEditSubQtd(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="text-xs text-gray-500 mb-1 block">Quantidade (g)</label>
                      <input type="number" value={editSubQtd} min={0.1} step={0.1}
                        onChange={e => setEditSubQtd(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white" />
                    </>
                  )}
                  {medidaSel && medidaPreview && (
                    <p className="text-xs text-turquesa mt-1">Medida: <strong>{medidaPreview}</strong></p>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  {Math.round(sn(sub.alimento.kcal) * editSubQtd / sub.alimento.gramas)} kcal
                  {" · P:"}{Math.round(sn(sub.alimento.proteinas) * editSubQtd / sub.alimento.gramas * 10) / 10}g
                  {" L:"}{Math.round(sn(sub.alimento.lipidios) * editSubQtd / sub.alimento.gramas * 10) / 10}g
                  {" C:"}{Math.round(sn(sub.alimento.carboidratos) * editSubQtd / sub.alimento.gramas * 10) / 10}g
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditarSubstituto(null)}>Cancelar</Button>
                  <Button className="flex-1" onClick={() => handleEditarSubstituto(
                    editarSubstituto.refIdx, editarSubstituto.alimIdx, editarSubstituto.subIdx, editSubQtd,
                    editSubNome,
                    medidaSel ? rotuloMedidaPorGramas(editSubQtd, medidaSel) : undefined,
                  )}>Salvar</Button>
                </div>
              </div>
            </div>
          )
        })()}

        <SubstitutoModal
          aberto={substitutoAberto}
          alimentoPrincipal={substitutoInfo?.principal ?? null}
          qtdPrincipal={substitutoInfo?.qtdPrincipal ?? 0}
          onClose={() => { setSubstitutoAberto(false); setSubstitutoInfo(null) }}
          onSelecionar={(alimento, qtd, medidaCaseira) => {
            if (!substitutoInfo) return
            const { refIdx, alimIdx } = substitutoInfo
            const key = `${refIdx}_${alimIdx}`
            setSubstitutosColecao(prev => ({
              ...prev, [key]: [...(prev[key] || []), { alimento, quantidade: qtd, medidaCaseira, medidaCaseiraQtd: 1 }]
            }))
            setSubstitutosExpandidos(prev => ({ ...prev, [key]: true }))
            addToast("success", `${alimento.nome} adicionado como substituto`)
            setSubstitutoAberto(false)
            setSubstitutoInfo(null)
          }}
        />
        <SalvarFavoritoModal
          aberto={salvarFavoritoAberto}
          onClose={() => { setSalvarFavoritoAberto(false); setFavoritoAlvo(null) }}
          onSalvar={handleSalvarFavorito}
        />
        <UsarFavoritosModal
          aberto={favoritosSubAberto}
          onClose={() => { setFavoritosSubAberto(false); setFavoritoAlvo(null) }}
          grupos={favoritosSub}
          onUsar={handleUsarFavorito}
          onRemover={handleRemoverFavorito}
        />
        {recordatorioAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setRecordatorioAberto(false)}>
            <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 dark:border-gray-800"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Recordatório Alimentar
                </h3>
                <button onClick={() => setRecordatorioAberto(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">{pacienteNome}</p>
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 min-h-[100px] max-h-[400px] overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {pacienteRecordatorio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </ErrorBoundary>
    </AppLayout>
  )
}
