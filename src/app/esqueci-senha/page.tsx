"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    setEnviado(true)
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0F3D2E] dark:bg-[#123328] flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-[#0F3D2E] dark:text-white">NutriCare</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Esqueci minha senha</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enviaremos um link para redefinir sua senha</p>
        </div>

        <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800/50">
          {enviado ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-gray-700 dark:text-gray-300">
                Verifique seu e-mail! Enviamos um link para redefinir sua senha.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] dark:text-[#C9975A] hover:underline">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:ring-2 focus:ring-[#0F3D2E] dark:focus:ring-[#C9975A] outline-none"
                  />
                </div>
              </div>

              {erro && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {erro}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={carregando}>
                {carregando ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
