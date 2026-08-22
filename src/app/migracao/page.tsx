"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Button } from "@/components/ui/button"
import { isSupabaseConfigured } from "@/lib/supabase"
import { apiMigrarDados, apiCarregarPacientes } from "@/lib/api"
import { Cloud, Check, AlertTriangle, ArrowRight, Database } from "lucide-react"

export default function MigracaoPage() {
  const [migrando, setMigrando] = useState(false)
  const [resultado, setResultado] = useState<{ pacientes: number; medidas: number; favoritos: number } | null>(null)
  const [erro, setErro] = useState("")
  const [verificando, setVerificando] = useState(false)
  const [cloudCount, setCloudCount] = useState<number | null>(null)

  const cloudOk = isSupabaseConfigured()

  const verificar = async () => {
    setVerificando(true)
    try {
      const p = await apiCarregarPacientes()
      setCloudCount(p.length)
    } catch { setCloudCount(0) }
    setVerificando(false)
  }

  const migrar = async () => {
    setMigrando(true)
    setErro("")
    try {
      const r = await apiMigrarDados()
      setResultado(r)
    } catch (e: any) {
      setErro(e.message || "Erro desconhecido")
    }
    setMigrando(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] transition-colors duration-300">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-turquesa" /> Migrar dados para a nuvem
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta página transfere seus dados do navegador (localStorage) para o banco Supabase na nuvem.
            Depois da migração, seus dados ficam acessíveis de qualquer dispositivo.
          </p>
        </div>

        <div className={`rounded-2xl border p-6 shadow-sm ${cloudOk
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
          }`}>
          <div className="flex items-start gap-3">
            {cloudOk
              ? <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />}
            <div>
              <h3 className={`font-semibold ${cloudOk ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}>
                {cloudOk ? "Supabase configurado" : "Supabase não configurado"}
              </h3>
              <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                {cloudOk
                  ? "As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas."
                  : "Crie um projeto no Supabase, execute o schema SQL, e configure as variáveis de ambiente no .env.local (ou no painel do Vercel)."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Verificar dados na nuvem</h2>
          <Button onClick={verificar} disabled={!cloudOk || verificando} className="btn-gradient">
            {verificando ? "Verificando..." : "Verificar pacientes na nuvem"}
          </Button>
          {cloudCount !== null && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cloudCount} paciente(s) encontrado(s) na nuvem.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Migrar dados</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Envia todos os pacientes, medidas customizadas e favoritos do navegador para o Supabase.
            Os dados locais não são removidos — ficam como backup.
          </p>
          <Button onClick={migrar} disabled={!cloudOk || migrando} className="btn-gold">
            {migrando ? "Migrando..." : "Migrar tudo para a nuvem"}
            {!migrando && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
          {resultado && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Migração concluída: {resultado.pacientes} paciente(s), {resultado.medidas} medida(s) customizada(s), {resultado.favoritos} favorito(s).
              </p>
            </div>
          )}
          {erro && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Erro: {erro}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Próximos passos</h2>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal pl-4">
            <li>Faça deploy no Vercel (veja a documentação)</li>
            <li>Configure as variáveis de ambiente no Vercel</li>
            <li>Abra o app pelo celular e migre os dados</li>
            <li>Instale como PWA (Adicionar à tela de início)</li>
            <li>Pronto — o app funciona 24h sem o PC ligado!</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
