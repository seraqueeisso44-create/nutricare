"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { calcularIMC, type Paciente } from "@/lib/pacientes"
import { TrendingUp } from "lucide-react"

export function AbaGraficos({ paciente }: { paciente: Paciente }) {
  const antro = (paciente.antropometria || []).filter(r => r.incluirGrafico)
  const calc = paciente.calculos || []

  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })

  const dadosPeso = [...antro]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(r => ({ data: fmt(r.data), Peso: r.peso || null, IMC: calcularIMC(r.peso, r.altura) || null }))

  const dadosCircunferencia = [...antro]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(r => ({
      data: fmt(r.data),
      Cintura: r.circunferencias.cintura || null,
      Quadril: r.circunferencias.quadril || null,
      Abdômen: r.circunferencias.abdomen || null,
    }))

  const dadosGET = [...calc]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(r => ({ data: fmt(r.data), GET: r.get || null, TMB: r.tmb || null }))

  const vazio = dadosPeso.length === 0 && dadosGET.length < 2

  const cardCls = "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"

  if (vazio) {
    return (
      <div className={cardCls}>
        <div className="text-center py-10">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {calc.length === 1
              ? "O gráfico de evolução energética precisa de ao menos 2 cálculos."
              : "Sem dados para gráficos ainda."}
          </p>
          <p className="text-xs text-gray-400">
            {calc.length === 1
              ? `Registre mais um "Cálculo Energético" para ver a evolução do GET ao longo do tempo.`
              : 'Registre medições (com "incluir no gráfico") e cálculos energéticos.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {dadosPeso.length > 0 && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolução de Peso e IMC</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" fontSize={11} />
              <YAxis yAxisId="left" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="Peso" stroke="#243748" strokeWidth={2} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="IMC" stroke="#20c4b6" strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {dadosCircunferencia.some(d => d.Cintura || d.Quadril || d.Abdômen) && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolução de Circunferências (cm)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosCircunferencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Cintura" stroke="#f59e0b" strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="Quadril" stroke="#243748" strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="Abdômen" stroke="#ef4444" strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {dadosGET.length >= 2 && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolução do Gasto Energético (kcal)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosGET}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="TMB" stroke="#243748" strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="GET" stroke="#20c4b6" strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
