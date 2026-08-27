import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase.from("favoritos_substitutos").select("grupos").eq("user_id", user.id).limit(1).single()
  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.grupos || [])
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const grupos = await req.json()
  const { error } = await supabase.from("favoritos_substitutos").upsert({
    id: 1, chave: "default", grupos, user_id: user.id, atualizado_em: new Date().toISOString(),
  }, { onConflict: "id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
