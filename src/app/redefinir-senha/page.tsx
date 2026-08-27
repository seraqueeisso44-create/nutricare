"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [sessionOk, setSessionOk] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionOk(!!session)
    })
  }, [supabase])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem")
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    setSucesso(true)
    setCarregando(false)
  }

  if (sessionOk === null) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0F3D2E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!sessionOk) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Link inválido ou expirado.</p>
          <Link href="/esqueci-senha" className="inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] dark:text-[#C9975A] hover:underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redefinir senha</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Digite sua nova senha</p>
        </div>

        <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800/50">
          {sucesso ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-gray-700 dark:text-gray-300">Senha redefinida com sucesso!</p>
              <Button className="w-full h-11" onClick={() => router.push("/calculadora")}>
                Ir para Calculadora
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:ring-2 focus:ring-[#0F3D2E] dark:focus:ring-[#C9975A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    minLength={6}
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
                    Salvando...
                  </span>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
