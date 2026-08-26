import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F3D2E] to-[#0B1F17] text-white">
      <div className="text-center space-y-6 px-4">
        <div className="text-8xl font-bold text-[#C9975A]">404</div>
        <h1 className="text-2xl font-semibold">Página não encontrada</h1>
        <p className="text-white/60 max-w-md mx-auto">
          O endereço que você procura não existe ou foi movido.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/"
            className="px-6 py-3 bg-[#C9975A] text-[#0F3D2E] font-semibold rounded-lg hover:bg-[#b8894e] transition-colors"
          >
            Voltar ao início
          </Link>
          <Link
            href="/pacientes"
            className="px-6 py-3 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
          >
            Pacientes
          </Link>
        </div>
      </div>
    </div>
  )
}
