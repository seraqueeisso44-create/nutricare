/**
 * lib/api.ts — Camada de dados unificada
 *
 * Se Supabase estiver configurado → usa API (dados na nuvem)
 * Se não → usa localStorage (offline / desenvolvimento)
 *
 * Todos os componentes devem importar daqui em vez de usar localStorage direto.
 */
import { getSupabase, isSupabaseConfigured } from "./supabase"
import type { Paciente, DietaSalva, RegistroAntropometria, RegistroCalculo, Anamnese } from "./pacientes"

// ============================================
// PACIENTES
// ============================================

const LS_KEY = "nutricare_pacientes"

function lsRead(): Paciente[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const d = JSON.parse(raw)
    return Array.isArray(d) ? d : []
  } catch { return [] }
}

function lsWrite(pacientes: Paciente[]) {
  if (typeof window === "undefined") return
  try { localStorage.setItem(LS_KEY, JSON.stringify(pacientes)) }
  catch { alert("Erro ao salvar: armazenamento cheio.") }
}

export async function apiCarregarPacientes(): Promise<Paciente[]> {
  if (!isSupabaseConfigured()) return lsRead()
  try {
    const res = await fetch("/api/pacientes")
    if (!res.ok) throw new Error()
    return await res.json()
  } catch { return lsRead() }
}

export async function apiObterPaciente(id: string): Promise<Paciente | undefined> {
  if (!isSupabaseConfigured()) return lsRead().find(p => p.id === id)
  try {
    const res = await fetch(`/api/pacientes?id=${id}`)
    if (!res.ok) return undefined
    return await res.json()
  } catch { return lsRead().find(p => p.id === id) }
}

export async function apiSalvarPaciente(paciente: Paciente): Promise<void> {
  if (!isSupabaseConfigured()) {
    const lista = lsRead()
    const idx = lista.findIndex(p => p.id === paciente.id)
    if (idx >= 0) lista[idx] = paciente; else lista.unshift(paciente)
    lsWrite(lista)
    return
  }
  await fetch("/api/pacientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(paciente) })
}

export async function apiRemoverPaciente(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    lsWrite(lsRead().filter(p => p.id !== id))
    return
  }
  await fetch(`/api/pacientes?id=${id}`, { method: "DELETE" })
}

// Helpers de alto nível que compõem as operações básicas
export async function apiCriarPaciente(dados: Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">): Promise<Paciente> {
  const agora = new Date().toISOString()
  const novo: Paciente = {
    ...dados,
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  await apiSalvarPaciente(novo)
  return novo
}

export async function apiAtualizarPaciente(id: string, dados: Partial<Omit<Paciente, "id" | "criadoEm">>): Promise<Paciente | undefined> {
  const p = await apiObterPaciente(id)
  if (!p) return undefined
  const atualizado = { ...p, ...dados, id: p.id, criadoEm: p.criadoEm, atualizadoEm: new Date().toISOString() }
  await apiSalvarPaciente(atualizado)
  return atualizado
}

// ============================================
// DIETAS
// ============================================

export async function apiSalvarDieta(pacienteId: string, dieta: DietaSalva): Promise<Paciente | undefined> {
  const p = await apiObterPaciente(pacienteId)
  if (!p) return undefined
  const existentes = p.dietas || []
  const idx = existentes.findIndex(d => d.id === dieta.id)
  let dietas: DietaSalva[]
  if (idx >= 0) { dietas = [...existentes]; dietas[idx] = dieta }
  else { dietas = [dieta, ...existentes] }
  return apiAtualizarPaciente(pacienteId, { dietas })
}

export async function apiRemoverDieta(pacienteId: string, dietaId: string): Promise<Paciente | undefined> {
  const p = await apiObterPaciente(pacienteId)
  if (!p) return undefined
  return apiAtualizarPaciente(pacienteId, { dietas: (p.dietas || []).filter(d => d.id !== dietaId) })
}

export async function apiObterDieta(pacienteId: string, dietaId: string): Promise<DietaSalva | undefined> {
  const p = await apiObterPaciente(pacienteId)
  return p?.dietas?.find(d => d.id === dietaId)
}

// ============================================
// MEDIDAS CUSTOM
// ============================================

const MEDIDAS_LS = "nutricare_medidas_custom"

interface MedidaCaseiraCustom { id: string; alimentoId: string; rotulo: string; gramas: number }

function lsMedidasRead(): MedidaCaseiraCustom[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(MEDIDAS_LS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function lsMedidasWrite(items: MedidaCaseiraCustom[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(MEDIDAS_LS, JSON.stringify(items))
}

export async function apiCarregarMedidasCustom(alimentoId: string): Promise<MedidaCaseiraCustom[]> {
  if (!isSupabaseConfigured()) return lsMedidasRead().filter(m => m.alimentoId === alimentoId)
  try {
    const res = await fetch(`/api/medidas?alimentoId=${alimentoId}`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch { return lsMedidasRead().filter(m => m.alimentoId === alimentoId) }
}

export async function apiCarregarTodasMedidasCustom(): Promise<MedidaCaseiraCustom[]> {
  if (!isSupabaseConfigured()) return lsMedidasRead()
  try {
    const res = await fetch("/api/medidas")
    if (!res.ok) throw new Error()
    return await res.json()
  } catch { return lsMedidasRead() }
}

export async function apiCriarMedidaCustom(alimentoId: string, rotulo: string, gramas: number): Promise<MedidaCaseiraCustom> {
  const nova: MedidaCaseiraCustom = { id: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, alimentoId, rotulo, gramas }
  if (!isSupabaseConfigured()) {
    lsMedidasWrite([...lsMedidasRead(), nova])
    return nova
  }
  await fetch("/api/medidas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nova) })
  return nova
}

export async function apiRemoverMedidaCustom(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    lsMedidasWrite(lsMedidasRead().filter(m => m.id !== id))
    return
  }
  await fetch(`/api/medidas?id=${id}`, { method: "DELETE" })
}

// ============================================
// FAVORITOS SUBSTITUTOS
// ============================================

const FAVORITOS_LS = "nutricare_favoritos_substitutos"

export async function apiCarregarFavoritosSub(): Promise<unknown[]> {
  if (!isSupabaseConfigured()) {
    try { const raw = localStorage.getItem(FAVORITOS_LS); return raw ? JSON.parse(raw) : [] } catch { return [] }
  }
  try {
    const res = await fetch("/api/favoritos")
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    try { const raw = localStorage.getItem(FAVORITOS_LS); return raw ? JSON.parse(raw) : [] } catch { return [] }
  }
}

export async function apiSalvarFavoritosSub(grupos: unknown[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    localStorage.setItem(FAVORITOS_LS, JSON.stringify(grupos))
    return
  }
  await fetch("/api/favoritos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(grupos) })
}

// ============================================
// MIGRAÇÃO: localStorage → Supabase
// ============================================

export async function apiMigrarDados(): Promise<{ pacientes: number; medidas: number; favoritos: number }> {
  const resultado = { pacientes: 0, medidas: 0, favoritos: 0 }
  if (!isSupabaseConfigured()) return resultado

  // Migrar pacientes
  const lsPacientes = lsRead()
  for (const p of lsPacientes) {
    await apiSalvarPaciente(p)
    resultado.pacientes++
  }

  // Migrar medidas custom
  const lsMedidas = lsMedidasRead()
  for (const m of lsMedidas) {
    await fetch("/api/medidas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) })
    resultado.medidas++
  }

  // Migrar favoritos
  try {
    const raw = localStorage.getItem(FAVORITOS_LS)
    if (raw) {
      const favs = JSON.parse(raw)
      await apiSalvarFavoritosSub(favs)
      resultado.favoritos = 1
    }
  } catch {}

  return resultado
}
