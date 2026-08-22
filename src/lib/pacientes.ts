export interface Anamnese {
  queixaPrincipal: string
  doencasAtuais: string
  doencasAnteriores: string
  cirurgias: string
  historicoFamiliar: string
  medicamentos: string
  suplementos: string
  alergias: string
  intolerancias: string
  habitosIntestinais: string
  atividadeFisica: string
  frequenciaAtividade: string
  horasSono: string
  qualidadeSono: string
  nivelEstresse: string
  tabagismo: string
  consumoAlcool: string
  consumoAgua: string
  refeicoesPorDia: string
  horariosRefeicoes: string
  preferencias: string
  aversoes: string
  frequenciaRefeicoesFora: string
  quemPreparaRefeicoes: string
  restricoes: string
  objetivos: string
  expectativas: string
  observacoesAdicionais: string
  recordatorioAlimentar: string
}

export interface Anexo {
  id: string
  nome: string
  tipo: string
  data: string
  descricao: string
  conteudo: string // base64 data URL
}

export interface DobrasCutaneas {
  triceps?: number
  biceps?: number
  subescapular?: number
  suprailiaca?: number
  abdominal?: number
  toracica?: number
  axilarMedia?: number
  coxa?: number
  panturrilha?: number
  supraespinhal?: number
}

export interface Circunferencias {
  pescoco?: number
  ombro?: number
  torax?: number
  bracoRelaxado?: number
  bracoContraido?: number
  antebraco?: number
  cintura?: number
  abdomen?: number
  quadril?: number
  coxa?: number
  panturrilha?: number
}

export interface RegistroAntropometria {
  id: string
  data: string
  incluirGrafico: boolean
  peso: number
  altura: number
  alturaJoelho?: number
  formulaGordura: string
  dobras: DobrasCutaneas
  circunferencias: Circunferencias
  percentualGordura?: number
  observacoes: string
}

export interface AlimentoDieta {
  id: string
  nome: string
  origem: string
  medidaCaseira: string
  gramas: number
  quantidade: number
  proteinas: number
  lipidios: number
  carboidratos: number
  fibras?: number
  kcal: number
  customNome?: string
  substitutos?: { nome: string; gramas: number; medidaCaseira: string; quantidade: number; medidaCaseiraQtd?: number }[]
  sodio?: number
  calcio?: number
  ferro?: number
  magnesio?: number
  fosforo?: number
  potassio?: number
  zinco?: number
  selenio?: number
  vitaminaA?: number
  vitaminaC?: number
  vitaminaD?: number
  vitaminaE?: number
  vitaminaB1?: number
  vitaminaB2?: number
  vitaminaB3?: number
  vitaminaB6?: number
  vitaminaB12?: number
  acidoFolico?: number
}

export interface RefeicaoDieta {
  nome: string
  horario: string
  alimentos: AlimentoDieta[]
  totalKcal: number
  totalProteinas: number
  totalLipidios: number
  totalCarboidratos: number
  totalFibras: number
}

export interface DietaSalva {
  id: string
  data: string
  titulo: string
  refeicoes: RefeicaoDieta[]
  totalKcal: number
  totalProteinas: number
  totalLipidios: number
  totalCarboidratos: number
  totalFibras: number
  metaKcal?: number
  metaProteinas?: number
  metaLipidios?: number
  metaCarboidratos?: number
  observacoes?: string
  autosave?: boolean
}

export interface RegistroCalculo {
  id: string
  data: string
  formula: string
  peso: number
  altura: number
  idade: number
  sexo: "masculino" | "feminino"
  fatorAtividade: number
  fatorEstresse: number
  ajusteCalorico: number
  tmb: number
  get: number
  observacoes: string
}

export interface Paciente {
  id: string
  nome: string
  email: string
  telefone: string
  sexo: "masculino" | "feminino"
  dataNascimento: string
  cpf: string
  profissao: string
  peso: number
  altura: number
  objetivo: string
  observacoes: string
  status: "ativo" | "inativo"
  criadoEm: string
  atualizadoEm: string
  anamnese?: Anamnese
  exames?: Anexo[]
  fotos?: Anexo[]
  antropometria?: RegistroAntropometria[]
  calculos?: RegistroCalculo[]
  dietas?: DietaSalva[]
  orientacoes?: string
  historicoAnamnese?: { data: string; anamnese: Anamnese }[]
}

const STORAGE_KEY = "nutricare_pacientes"

function isBrowser() {
  return typeof window !== "undefined"
}

function isCloud() {
  try { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) }
  catch { return false }
}

// ============================================
// Storage helpers — sync fallback (localStorage) + async cloud (Supabase)
// ============================================

function lsRead(): Paciente[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const dados = JSON.parse(raw)
    return Array.isArray(dados) ? dados : []
  } catch { return [] }
}

function lsWrite(pacientes: Paciente[]) {
  if (!isBrowser()) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes)) }
  catch { alert("Erro ao salvar: armazenamento cheio. Tente remover anexos grandes.") }
}

async function cloudFetch<T>(url: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, opts)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export function anamneseVazia(): Anamnese {
  return {
    queixaPrincipal: "", doencasAtuais: "", doencasAnteriores: "", cirurgias: "",
    historicoFamiliar: "", medicamentos: "", suplementos: "", alergias: "",
    intolerancias: "", habitosIntestinais: "", atividadeFisica: "", frequenciaAtividade: "",
    horasSono: "", qualidadeSono: "", nivelEstresse: "", tabagismo: "", consumoAlcool: "",
    consumoAgua: "", refeicoesPorDia: "", horariosRefeicoes: "", preferencias: "",
    aversoes: "", frequenciaRefeicoesFora: "", quemPreparaRefeicoes: "", restricoes: "",
    objetivos: "", expectativas: "", observacoesAdicionais: "", recordatorioAlimentar: "",
  }
}

export async function carregarPacientes(): Promise<Paciente[]> {
  if (isCloud()) {
    const data = await cloudFetch<Paciente[]>("/api/pacientes")
    if (data) return data
  }
  return lsRead()
}

async function salvarTodos(pacientes: Paciente[]) {
  if (isCloud()) {
    for (const p of pacientes) {
      await cloudFetch("/api/pacientes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
      })
    }
    return
  }
  lsWrite(pacientes)
}

export async function obterPaciente(id: string): Promise<Paciente | undefined> {
  if (isCloud()) {
    const data = await cloudFetch<Paciente>(`/api/pacientes?id=${id}`)
    if (data) return data
  }
  return lsRead().find(p => p.id === id)
}

export async function criarPaciente(
  dados: Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">
): Promise<Paciente> {
  const agora = new Date().toISOString()
  const novo: Paciente = {
    ...dados,
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  if (isCloud()) {
    await cloudFetch("/api/pacientes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novo),
    })
    return novo
  }
  const lista = lsRead()
  lsWrite([novo, ...lista])
  return novo
}

export async function atualizarPaciente(
  id: string,
  dados: Partial<Omit<Paciente, "id" | "criadoEm">>
): Promise<Paciente | undefined> {
  if (isCloud()) {
    const existente = await cloudFetch<Paciente>(`/api/pacientes?id=${id}`)
    if (!existente) return undefined
    const atualizado: Paciente = {
      ...existente, ...dados, id: existente.id, criadoEm: existente.criadoEm,
      atualizadoEm: new Date().toISOString(),
    }
    await cloudFetch("/api/pacientes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(atualizado),
    })
    return atualizado
  }
  const lista = lsRead()
  const idx = lista.findIndex(p => p.id === id)
  if (idx === -1) return undefined
  const atualizado: Paciente = {
    ...lista[idx], ...dados, id: lista[idx].id, criadoEm: lista[idx].criadoEm,
    atualizadoEm: new Date().toISOString(),
  }
  lista[idx] = atualizado
  lsWrite(lista)
  return atualizado
}

export async function removerPaciente(id: string) {
  if (isCloud()) {
    await cloudFetch(`/api/pacientes?id=${id}`, { method: "DELETE" })
    return
  }
  lsWrite(lsRead().filter(p => p.id !== id))
}

export function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0
  const nasc = new Date(dataNascimento)
  if (isNaN(nasc.getTime())) return 0
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export function calcularIMC(peso: number, alturaCm: number): number {
  if (!peso || !alturaCm) return 0
  const h = alturaCm / 100
  return Math.round((peso / (h * h)) * 10) / 10
}

export function classificarIMC(imc: number): { rotulo: string; cor: string } {
  if (imc <= 0) return { rotulo: "—", cor: "text-gray-400" }
  if (imc < 18.5) return { rotulo: "Abaixo do peso", cor: "text-amber-600" }
  if (imc < 25) return { rotulo: "Peso normal", cor: "text-emerald-600" }
  if (imc < 30) return { rotulo: "Sobrepeso", cor: "text-orange-500" }
  if (imc < 35) return { rotulo: "Obesidade I", cor: "text-red-500" }
  if (imc < 40) return { rotulo: "Obesidade II", cor: "text-red-600" }
  return { rotulo: "Obesidade III", cor: "text-red-700" }
}

// Água ideal ≈ peso × 35 ml
export function calcularAguaIdeal(peso: number): number {
  if (!peso) return 0
  return Math.round(peso * 35) // ml
}

export async function salvarDieta(pacienteId: string, dieta: DietaSalva): Promise<Paciente | undefined> {
  const p = await obterPaciente(pacienteId)
  if (!p) return undefined
  const existentes = p.dietas || []
  const idx = existentes.findIndex(d => d.id === dieta.id)
  let dietas: DietaSalva[]
  if (idx >= 0) {
    dietas = [...existentes]
    dietas[idx] = dieta
  } else {
    dietas = [dieta, ...existentes]
  }
  return atualizarPaciente(pacienteId, { dietas })
}

export async function removerDieta(pacienteId: string, dietaId: string): Promise<Paciente | undefined> {
  const p = await obterPaciente(pacienteId)
  if (!p) return undefined
  return atualizarPaciente(pacienteId, { dietas: (p.dietas || []).filter(d => d.id !== dietaId) })
}

export async function obterDieta(pacienteId: string, dietaId: string): Promise<DietaSalva | undefined> {
  const p = await obterPaciente(pacienteId)
  return p?.dietas?.find(d => d.id === dietaId)
}

export function novaDietaId(): string {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// Estimativa de altura pela altura do joelho (Chumlea et al., 1985)
export function estimarAlturaJoelho(
  alturaJoelhoCm: number,
  idade: number,
  sexo: "masculino" | "feminino"
): number {
  if (!alturaJoelhoCm || !idade) return 0
  const altura = sexo === "masculino"
    ? 64.19 - 0.04 * idade + 2.02 * alturaJoelhoCm
    : 84.88 - 0.24 * idade + 1.83 * alturaJoelhoCm
  return Math.round(altura * 10) / 10
}

// Fórmula das 7 dobras (Jackson & Pollock, 1980)
const DOBRAS_7 = ["triceps", "toracica", "axilarMedia", "subescapular", "abdominal", "suprailiaca", "coxa"] as const

export function calcularGorduraSeteDobras(
  dobras: DobrasCutaneas,
  idade: number,
  sexo: "masculino" | "feminino"
): { percentual: number; somatoria: number } | null {
  const valores: number[] = []
  for (const k of DOBRAS_7) {
    const v = dobras[k as keyof DobrasCutaneas]
    if (!v || v <= 0) return null
    valores.push(v)
  }
  const soma = valores.reduce((s, v) => s + v, 0)
  const densidade = sexo === "masculino"
    ? 1.112 - 0.00043499 * soma + 0.00000055 * soma * soma - 0.00028826 * idade
    : 1.097 - 0.00046971 * soma + 0.00000056 * soma * soma - 0.00012828 * idade
  const percentual = (495 / densidade) - 450
  return { percentual: Math.round(percentual * 10) / 10, somatoria: Math.round(soma * 10) / 10 }
}
