"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Check } from "lucide-react"

export default function RegisterPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem")
      return
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    })

    if (error) {
      setErro(error.message === "User already registered"
        ? "Este e-mail já está cadastrado"
        : error.message)
      setCarregando(false)
      return
    }

    setSucesso(true)
    setCarregando(false)
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800/50">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Conta criada!</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Verifique seu e-mail para confirmar o cadastro. Depois de confirmar, você será redirecionado para escolher seu plano.
            </p>
            <Link href="/login">
              <Button className="w-full">Ir para o Login</Button>
            </Link>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar conta</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Comece a gerenciar suas dietas agora</p>
        </div>

        <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800/50">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:ring-2 focus:ring-[#0F3D2E] dark:focus:ring-[#C9975A] outline-none"
                />
              </div>
            </div>

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

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
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
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a senha"
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
                  Criando conta...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Criar conta
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-[#0F3D2E] dark:text-[#C9975A] hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
