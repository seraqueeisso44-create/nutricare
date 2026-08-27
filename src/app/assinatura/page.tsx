"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { PLANOS, type PlanoKey } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Check, Crown, ArrowLeft, ExternalLink, Clock, Zap, Calendar, Award } from "lucide-react"
import Link from "next/link"

const planoIcons: Record<PlanoKey, typeof Crown> = {
  monthly: Clock,
  quarterly: Zap,
  semester: Calendar,
  annual: Award,
}

const planoColors: Record<PlanoKey, string> = {
  monthly: "from-gray-500 to-gray-600",
  quarterly: "from-[#C9975A] to-[#B8864D]",
  semester: "from-[#0F3D2E] to-[#1A5C46]",
  annual: "from-[#C9975A] to-[#0F3D2E]",
}

export default function AssinaturaPage() {
  const { user, profile, loading, hasAccess, signOut } = useAuth()
  const [processando, setProcessando] = useState<PlanoKey | null>(null)
  const [erro, setErro] = useState("")

  const handleAssinar = async (plano: PlanoKey) => {
    setErro("")
    setProcessando(plano)

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || "Erro ao processar")
        setProcessando(null)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setErro("Erro de conexão")
      setProcessando(null)
    }
  }

  const handlePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setErro("Erro ao abrir portal")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0F3D2E] dark:border-[#C9975A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href={hasAccess ? "/calculadora" : "/"} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
            <ArrowLeft className="w-4 h-4" /> {hasAccess ? "Calculadora" : "Voltar"}
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{user.email}</span>
              <Button variant="outline" size="sm" onClick={signOut}>Sair</Button>
            </div>
          )}
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {hasAccess ? "Sua Assinatura" : "Escolha seu Plano"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {hasAccess
              ? "Gerencie sua assinatura atual"
              : "Acesse todas as ferramentas do NutriCare"
            }
          </p>
        </div>

        {hasAccess && profile && (
          <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {profile.isento ? "Acesso Total (Administrador)" : "Assinatura Ativa"}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.isento
                    ? "Sua conta está isenta de pagamento"
                    : `Plano ${profile.subscription_plan ? PLANOS[profile.subscription_plan as PlanoKey]?.name || profile.subscription_plan : "ativo"} — Válido até ${profile.subscription_end ? new Date(profile.subscription_end).toLocaleDateString("pt-BR") : "—"}`}
                </p>
              </div>
            </div>
            {!profile.isento && profile.subscription_status === "active" && (
              <Button variant="outline" size="sm" onClick={handlePortal} className="gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Gerenciar Assinatura
              </Button>
            )}
          </div>
        )}

        {erro && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(PLANOS) as [PlanoKey, typeof PLANOS[PlanoKey]][]).map(([key, plano]) => {
            const Icon = planoIcons[key]
            const isPopular = key === "quarterly"
            const isProcessing = processando === key

            return (
              <div
                key={key}
                className={`relative bg-white dark:bg-[#123328] rounded-2xl shadow-xl overflow-hidden border transition-all hover:scale-[1.02] ${
                  isPopular
                    ? "border-[#C9975A] dark:border-[#C9975A] ring-2 ring-[#C9975A]/20"
                    : "border-gray-100 dark:border-gray-800/50"
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#C9975A] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <div className={`bg-gradient-to-br ${planoColors[key]} p-4 text-white text-center`}>
                  <Icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <h3 className="text-lg font-bold">{plano.name}</h3>
                  <p className="text-2xl font-bold mt-1">{plano.label}</p>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plano.description}</p>

                  <ul className="space-y-2 mb-4">
                    {[
                      "Calculadora TACO completa",
                      "Prescrição dietética",
                      "Prontuário de pacientes",
                      "Exportar PDF",
                      "Banco de alimentos",
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isProcessing || (hasAccess && !profile?.isento)}
                    onClick={() => handleAssinar(key)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </span>
                    ) : hasAccess && !profile?.isento ? (
                      "Plano Atual"
                    ) : (
                      "Assinar Agora"
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {!user && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-[#0F3D2E] dark:text-[#C9975A] hover:underline">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
