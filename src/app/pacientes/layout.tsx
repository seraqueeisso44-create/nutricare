import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pacientes",
  description: "Cadastre e gerencie seus pacientes — prontuário digital com anamnese, antropometria, exames, cálculos nutricionais e prescrição dietética.",
}

export default function PacientesLayout({ children }: { children: React.ReactNode }) {
  return children
}
