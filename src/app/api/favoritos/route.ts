import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

// GET /api/favoritos
export async function GET() {
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  const { data, error } = await sb.from("favoritos_substitutos").select("grupos").limit(1).single()
  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.grupos || [])
}

// PUT /api/favoritos  (body = GrupoFavoritoSub[])
export async function PUT(req: NextRequest) {
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  const grupos = await req.json()
  const { error } = await sb.from("favoritos_substitutos").upsert({
    id: 1, chave: "default", grupos, atualizado_em: new Date().toISOString(),
  }, { onConflict: "id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
