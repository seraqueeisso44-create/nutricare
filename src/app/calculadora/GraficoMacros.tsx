"use client"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface Props {
  proteinas: number
  lipidios: number
  carboidratos: number
  size?: number
}

const COLORS = {
  proteinas: "#243748",
  lipidios: "#20c4b6",
  carboidratos: "#f59e0b",
}

export function GraficoMacros({ proteinas, lipidios, carboidratos, size = 200 }: Props) {
  const total = proteinas + lipidios + carboidratos
  if (total === 0) return <div className="text-center text-gray-400 text-sm py-8">Adicione alimentos para ver o gráfico</div>

  const dados = [
    { name: "Proteínas", value: Math.round(proteinas), color: COLORS.proteinas, kcal: Math.round(proteinas * 4) },
    { name: "Lipídios", value: Math.round(lipidios), color: COLORS.lipidios, kcal: Math.round(lipidios * 9) },
    { name: "Carboidratos", value: Math.round(carboidratos), color: COLORS.carboidratos, kcal: Math.round(carboidratos * 4) },
  ].filter(d => d.value > 0)

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie data={dados} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
            paddingAngle={3} dataKey="value" stroke="none">
            {dados.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${v}g`} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs">
        {dados.map(d => (
          <div key={d.name} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-500">{d.name}: <strong>{d.value}g</strong> ({d.kcal}kcal)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
