import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Criar Conta",
  description: "Crie sua conta NutriCare e comece a gerenciar dietas",
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
