"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calculator, Apple, Sun, Moon, Cloud } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function TopNav() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const links = [
    { href: "/pacientes", label: "Pacientes", icon: LayoutDashboard },
    { href: "/calculadora", label: "Calculadora", icon: Calculator },
  ]
  return (
    <header className="sticky top-0 z-40 border-b border-white/10"
      style={{
        background: "linear-gradient(135deg, #0F3D2E 0%, #1B4D3A 45%, #245C45 75%, #2E6B4F 100%)",
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/pacientes" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #C9975A 0%, #D4AA6E 100%)",
              boxShadow: "0 2px 12px rgba(201,151,90,0.35)",
            }}>
            <Apple className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight leading-none">NutriCare</span>
            <span className="text-[10px] font-medium text-white/50 tracking-widest uppercase leading-none mt-0.5">Nutrição & Bem-estar</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          {links.map(l => {
            const Icon = l.icon
            const active = pathname === l.href || pathname.startsWith(l.href + "/")
            return (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/20 text-white shadow-sm backdrop-blur-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            )
          })}
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Link href="/migracao"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === "/migracao"
                ? "bg-white/20 text-white shadow-sm backdrop-blur-sm"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`} title="Migrar dados para a nuvem">
            <Cloud className="w-4 h-4" />
          </Link>
          <button onClick={toggle}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            title={theme === "light" ? "Modo escuro" : "Modo claro"}>
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </nav>
      </div>
    </header>
  )
}
