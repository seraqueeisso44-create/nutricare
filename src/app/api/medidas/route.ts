import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

// GET /api/medidas?alimentoId=xxx (optional)
export async function GET(req: NextRequest) {
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const alimentoId = req.nextUrl.searchParams.get("alimentoId")
  let q = sb.from("medidas_custom").select("*")
  if (alimentoId) q = q.eq("alimento_id", alimentoId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map((r: Record<string, unknown>) => ({
    id: r.id, alimentoId: r.alimento_id, rotulo: r.rotulo, gramas: r.gramas,
  })))
}

// POST /api/medidas  (body = MedidaCaseiraCustom)
export async function POST(req: NextRequest) {
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  const body = await req.json()
  const { error } = await sb.from("medidas_custom").upsert({
    id: body.id, alimento_id: body.alimentoId, rotulo: body.rotulo, gramas: body.gramas,
  }, { onConflict: "id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/medidas?id=xxx
export async function DELETE(req: NextRequest) {
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await sb.from("medidas_custom").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
