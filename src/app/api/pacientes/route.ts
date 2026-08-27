import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (id) {
    const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(mapFromDb(data))
  }

  const { data, error } = await supabase.from("pacientes").select("*").order("criado_em", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map(mapFromDb))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const row = mapToDb(body) as Record<string, unknown>
  row.user_id = user.id
  const { error } = await supabase.from("pacientes").upsert(row, { onConflict: "id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await supabase.from("pacientes").delete().eq("id", id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function mapFromDb(r: Record<string, unknown>) {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email || "",
    telefone: r.telefone || "",
    sexo: r.sexo,
    dataNascimento: r.data_nascimento || "",
    cpf: r.cpf || "",
    profissao: r.profissao || "",
    peso: r.peso || 0,
    altura: r.altura || 0,
    objetivo: r.objetivo || "",
    observacoes: r.observacoes || "",
    status: r.status || "ativo",
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em,
    anamnese: r.anamnese || undefined,
    exames: r.exames || [],
    fotos: r.fotos || [],
    antropometria: r.antropometria || [],
    calculos: r.calculos || [],
    dietas: r.dietas || [],
    orientacoes: r.orientacoes || "",
    historicoAnamnese: r.historico_anamnese || [],
  }
}

function mapToDb(p: Record<string, unknown>) {
  return {
    id: p.id,
    nome: p.nome,
    email: p.email || "",
    telefone: p.telefone || "",
    sexo: p.sexo,
    data_nascimento: p.dataNascimento || "",
    cpf: p.cpf || "",
    profissao: p.profissao || "",
    peso: p.peso || 0,
    altura: p.altura || 0,
    objetivo: p.objetivo || "",
    observacoes: p.observacoes || "",
    status: p.status || "ativo",
    criado_em: p.criadoEm,
    atualizado_em: p.atualizadoEm,
    anamnese: p.anamnese || null,
    exames: p.exames || [],
    fotos: p.fotos || [],
    antropometria: p.antropometria || [],
    calculos: p.calculos || [],
    dietas: p.dietas || [],
    orientacoes: p.orientacoes || "",
    historico_anamnese: p.historicoAnamnese || [],
  }
}
