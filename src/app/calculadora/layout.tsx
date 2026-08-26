import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Calculadora Nutricional",
  description: "Calculadora de TMB, GET e prescrição dietética com fórmulas Harris-Benedict, Mifflin-St Jeor, Cunningham, Katch-McArdle e mais. Macronutrientes e plano alimentar personalizado.",
}

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return children
}
