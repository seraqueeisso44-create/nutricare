import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assinatura",
  description: "Escolha seu plano NutriCare e gerencie sua assinatura",
}

export default function AssinaturaLayout({ children }: { children: React.ReactNode }) {
  return children
}
