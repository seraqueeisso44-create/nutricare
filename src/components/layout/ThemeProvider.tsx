"use client"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark"
interface ThemeCtx { theme: Theme; toggle: () => void }

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} })

export function useTheme() { return useContext(Ctx) }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("nutricare_theme") as Theme | null
    const initial = saved || "light"
    setTheme(initial)
    document.documentElement.classList.toggle("dark", initial === "dark")
    setMounted(true)
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light"
      localStorage.setItem("nutricare_theme", next)
      document.documentElement.classList.toggle("dark", next === "dark")
      return next
    })
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}
