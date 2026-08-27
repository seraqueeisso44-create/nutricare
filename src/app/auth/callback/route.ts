import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_REDIRECTS = ["/assinatura", "/calculadora", "/pacientes", "/redefinir-senha", "/login", "/"]

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const type = searchParams.get("type")

  const safeNext = next && ALLOWED_REDIRECTS.includes(next) ? next : "/calculadora"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = type === "recovery"
        ? `${origin}/redefinir-senha`
        : `${origin}${safeNext}`
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
