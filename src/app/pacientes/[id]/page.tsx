"use client"
import { useState, useEffect, use, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/TopNav"
import { Button } from "@/components/ui/button"
import {
  obterPaciente, atualizarPaciente, calcularIdade, calcularIMC, classificarIMC,
  type Paciente, type Anamnese, type Anexo, type RegistroAntropometria, type RegistroCalculo,
} from "@/lib/pacientes"
import { AbaPerfil } from "./AbaPerfil"
import { AbaAnamnese } from "./AbaAnamnese"
import { AbaAnexos } from "./AbaAnexos"
import { AbaAntropometria } from "./AbaAntropometria"
import { AbaCalculo } from "./AbaCalculo"
import { AbaGraficos } from "./AbaGraficos"
import { AbaDieta } from "./AbaDieta"
import { AbaOrientacoes } from "./AbaOrientacoes"
import {
  ArrowLeft, User, ClipboardList, FlaskConical, Image as ImageIcon,
  Ruler, Calculator, TrendingUp, FileText, UtensilsCrossed,
  Calendar, Phone, Mail, AlertTriangle, Clock, Heart,
} from "lucide-react"

const ABAS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "anamnese", label: "Anamnese", icon: ClipboardList },
  { id: "exames", label: "Exames", icon: FlaskConical },
  { id: "fotos", label: "Fotos", icon: ImageIcon },
  { id: "antropometria", label: "Antropometria", icon: Ruler },
  { id: "calculo", label: "Cálculo Energético", icon: Calculator },
  { id: "dieta", label: "Dieta", icon: UtensilsCrossed },
  { id: "graficos", label: "Gráficos", icon: TrendingUp },
  { id: "orientacoes", label: "Orientações", icon: FileText },
] as const

type AbaId = (typeof ABAS)[number]["id"]

const CAMPOS_ANAMNESE = [
  "queixaPrincipal", "doencasAtuais", "doencasAnteriores", "cirurgias",
  "historicoFamiliar", "medicamentos", "suplementos", "alergias", "intolerancias",
  "habitosIntestinais", "atividadeFisica", "frequenciaAtividade", "horasSono",
  "qualidadeSono", "nivelEstresse", "tabagismo", "consumoAlcool", "consumoAgua",
  "refeicoesPorDia", "horariosRefeicoes", "preferencias", "aversoes",
  "frequenciaRefeicoesFora", "quemPreparaRefeicoes", "restricoes", "objetivos",
  "expectativas", "observacoesAdicionais", "recordatorioAlimentar",
] as (keyof Anamnese)[]

export default function PacienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [aba, setAba] = useState<AbaId>("perfil")

  useEffect(() => {
    obterPaciente(id).then(p => { setPaciente(p || null); setCarregado(true) })
  }, [id])

  const salvar = async (dados: Partial<Paciente>) => {
    const atualizado = await atualizarPaciente(id, dados)
    if (atualizado) setPaciente(atualizado)
  }

  const idade = paciente ? calcularIdade(paciente.dataNascimento) : 0
  const imc = paciente ? calcularIMC(paciente.peso, paciente.altura) : 0
  const classe = classificarIMC(imc)

  const anamnesePct = useMemo(() => {
    if (!paciente?.anamnese) return 0
    const preenchidos = CAMPOS_ANAMNESE.filter(k => paciente.anamnese?.[k]?.trim()).length
    return Math.round((preenchidos / CAMPOS_ANAMNESE.length) * 100)
  }, [paciente])

  const resumo = useMemo(() => {
    if (!paciente) return null
    const a = paciente.anamnese
    return {
      objetivo: paciente.objetivo || null,
      alergias: a?.alergias?.trim() || null,
      doencas: [a?.doencasAtuais?.trim(), a?.doencasAnteriores?.trim()].filter(Boolean).join("; ") || null,
      medicamentos: a?.medicamentos?.trim() || null,
      suplementos: a?.suplementos?.trim() || null,
      restricoes: a?.restricoes?.trim() || null,
    }
  }, [paciente])

  const historico = useMemo(() => {
    if (!paciente) return []
    const itens: { data: string; tipo: string; descricao: string; icone: React.ElementType; abaId: AbaId }[] = []
    const ultimaDieta = (paciente.dietas || [])[0]
    if (ultimaDieta) itens.push({
      data: ultimaDieta.data, tipo: "Dieta",
      descricao: `${ultimaDieta.titulo} · ${ultimaDieta.totalKcal} kcal`,
      icone: UtensilsCrossed, abaId: "dieta",
    })
    const ultimoCalculo = (paciente.calculos || [])[0]
    if (ultimoCalculo) itens.push({
      data: ultimoCalculo.data, tipo: "Cálculo Energético",
      descricao: `${ultimoCalculo.formula?.split("(")[0]?.trim() || "Cálculo"} · GET ${ultimoCalculo.get} kcal`,
      icone: Calculator, abaId: "calculo",
    })
    const ultimaAntro = (paciente.antropometria || [])[0]
    if (ultimaAntro) itens.push({
      data: ultimaAntro.data, tipo: "Antropometria",
      descricao: `${ultimaAntro.peso}kg${ultimaAntro.percentualGordura != null ? ` · ${ultimaAntro.percentualGordura}%G` : ""}`,
      icone: Ruler, abaId: "antropometria",
    })
    return itens.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5)
  }, [paciente])

  const alertas = useMemo(() => {
    if (!paciente) return []
    const lista: { texto: string; tipo: "warn" | "info" }[] = []
    if (anamnesePct < 100 && anamnesePct > 0) {
      lista.push({ texto: `Anamnese incompleta (${anamnesePct}%)`, tipo: "warn" })
    } else if (anamnesePct === 0) {
      lista.push({ texto: "Anamnese não iniciada", tipo: "info" })
    }
    if (!paciente.dietas || paciente.dietas.length === 0) {
      lista.push({ texto: "Nenhuma dieta registrada", tipo: "info" })
    }
    if (!paciente.antropometria || paciente.antropometria.length === 0) {
      lista.push({ texto: "Nenhuma medição antropométrica", tipo: "info" })
    }
    if (!paciente.calculos || paciente.calculos.length === 0) {
      lista.push({ texto: "Nenhum cálculo energético", tipo: "info" })
    }
    return lista
  }, [paciente, anamnesePct])

  if (!carregado) {
    return (
      <div className="min-h-screen bg-bege dark:bg-[#0B1F17] transition-colors duration-300">
        <TopNav />
        <main className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-petroleo/10 dark:bg-petroleo/20 rounded w-32" />
            <div className="h-32 bg-petroleo/5 dark:bg-petroleo/10 rounded-2xl" />
          </div>
        </main>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-bege dark:bg-[#0B1F17] transition-colors duration-300">
        <TopNav />
        <main className="max-w-6xl mx-auto p-6 text-center py-20">
          <p className="text-sm text-gray-500 mb-4">Paciente não encontrado.</p>
          <Link href="/pacientes"><Button variant="outline"><ArrowLeft className="w-4 h-4" /> Voltar para lista</Button></Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bege dark:bg-[#0B1F17] transition-colors duration-300">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ← VOLTAR */}
        <button onClick={() => router.push("/pacientes")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>

        {/* ════════════════════════════════════════════
            CABEÇALHO DO PACIENTE
        ════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm overflow-hidden transition-colors duration-300">
          <div className="h-1.5" style={{ background: "linear-gradient(90deg, #0F3D2E, #C9975A, #245C45)" }} />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0"
                style={{ background: "linear-gradient(135deg, #0F3D2E, #245C45)" }}>
                {paciente.nome.charAt(0).toUpperCase()}
              </div>

              {/* Nome + Status + Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{paciente.nome}</h1>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    paciente.status === "ativo"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${paciente.status === "ativo" ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {paciente.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                  {idade > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> {idade} anos
                    </span>
                  )}
                  {paciente.sexo && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" /> {paciente.sexo === "masculino" ? "Masculino" : "Feminino"}
                    </span>
                  )}
                  {paciente.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {paciente.email}
                    </span>
                  )}
                  {paciente.telefone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {paciente.telefone}
                    </span>
                  )}
                </div>
              </div>

              {/* Ações + Dados */}
              <div className="flex items-center gap-3">
                {paciente.peso > 0 && (
                  <div className="hidden sm:block text-center px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{paciente.peso}<span className="text-xs font-normal text-gray-400">kg</span></p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Peso</p>
                  </div>
                )}
                {imc > 0 && (
                  <div className="hidden sm:block text-center px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{imc}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${classe.cor}`}>{classe.rotulo}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Link href={`/calculadora?paciente=${paciente.id}`}>
                    <Button size="sm" className="btn-gradient text-white shadow-sm">
                      <Calculator className="w-4 h-4" /> Calcular dieta
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            NAVEGAÇÃO DAS ABAS
        ════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm px-2 py-1.5 transition-colors duration-300">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {ABAS.map(a => {
              const Icon = a.icon
              const ativo = aba === a.id
              return (
                <button key={a.id} onClick={() => setAba(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-xl transition-all ${
                    ativo
                      ? "bg-petroleo/10 text-petroleo dark:bg-turquesa/15 dark:text-turquesa"
                      : "text-gray-500 hover:bg-petroleo/5 hover:text-petroleo dark:hover:bg-petroleo/10 dark:hover:text-gray-300"
                  }`}>
                  <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{a.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            CONTEÚDO: ÁREA PRINCIPAL + SIDEBAR
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* ── CONTEÚDO PRINCIPAL ── */}
          <div className="min-w-0">
            {aba === "perfil" && (
              <AbaPerfil paciente={paciente} onEditar={() => router.push("/pacientes")} />
            )}
            {aba === "anamnese" && (
              <AbaAnamnese paciente={paciente} onSalvar={(a: Anamnese) => {
                const historico = [...(paciente.historicoAnamnese || []), { data: new Date().toISOString(), anamnese: a }]
                salvar({ anamnese: a, historicoAnamnese: historico })
              }} />
            )}
            {aba === "exames" && (
              <AbaAnexos titulo="Exames Laboratoriais"
                descricao="Anexe resultados de exames (PDF, imagens, documentos)."
                anexos={paciente.exames || []}
                onChange={(anexos: Anexo[]) => salvar({ exames: anexos })} />
            )}
            {aba === "fotos" && (
              <AbaAnexos titulo="Fotos de Evolução"
                descricao="Registre fotos da evolução física do paciente."
                anexos={paciente.fotos || []} somenteImagens
                onChange={(anexos: Anexo[]) => salvar({ fotos: anexos })} />
            )}
            {aba === "antropometria" && (
              <AbaAntropometria paciente={paciente}
                onSalvar={(registros: RegistroAntropometria[]) => salvar({ antropometria: registros })} />
            )}
            {aba === "calculo" && (
              <AbaCalculo paciente={paciente}
                onSalvar={(registros: RegistroCalculo[]) => salvar({ calculos: registros })} />
            )}
            {aba === "dieta" && (
              <AbaDieta paciente={paciente}
                onRemover={(dietaId: string) => salvar({ dietas: (paciente.dietas || []).filter(d => d.id !== dietaId) })} />
            )}
            {aba === "graficos" && <AbaGraficos paciente={paciente} />}
            {aba === "orientacoes" && (
              <AbaOrientacoes paciente={paciente} onSalvar={(o: string) => salvar({ orientacoes: o })} />
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4">

            {/* Resumo do Paciente */}
            {resumo && (resumo.objetivo || resumo.alergias || resumo.doencas || resumo.medicamentos || resumo.suplementos || resumo.restricoes) && (
              <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-turquesa/10 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-turquesa" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resumo do Paciente</h3>
                </div>
                <div className="p-4 space-y-3">
                  {resumo.objetivo && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Objetivo</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{resumo.objetivo}</p>
                    </div>
                  )}
                  {resumo.alergias && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Alergias</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{resumo.alergias}</p>
                    </div>
                  )}
                  {resumo.doencas && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Condições Clínicas</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{resumo.doencas}</p>
                    </div>
                  )}
                  {resumo.medicamentos && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Medicamentos</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{resumo.medicamentos}</p>
                    </div>
                  )}
                  {resumo.suplementos && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Suplementos</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{resumo.suplementos}</p>
                    </div>
                  )}
                  {resumo.restricoes && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Restrições</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{resumo.restricoes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Histórico Recente */}
            {historico.length > 0 && (
              <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-petroleo/5 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-petroleo dark:text-turquesa" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Histórico Recente</h3>
                </div>
                <div className="p-3">
                  <div className="space-y-0">
                    {historico.map((item, i) => {
                      const Icon = item.icone
                      return (
                        <button key={i} onClick={() => setAba(item.abaId)}
                          className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group">
                          <div className="w-8 h-8 rounded-lg bg-petroleo/5 flex items-center justify-center shrink-0 group-hover:bg-turquesa/10 transition-colors">
                            <Icon className="w-4 h-4 text-petroleo/50 dark:text-turquesa/50 group-hover:text-turquesa transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.tipo}</p>
                            <p className="text-xs text-gray-500 truncate">{item.descricao}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Alertas */}
            {alertas.length > 0 && (
              <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Alertas</h3>
                </div>
                <div className="p-3 space-y-1.5">
                  {alertas.map((a, i) => (
                    <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                      a.tipo === "warn"
                        ? "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{a.texto}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  )
}
