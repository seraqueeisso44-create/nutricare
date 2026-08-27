"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RecoveryHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes("type=recovery")) return
    if (pathname === "/redefinir-senha") return

    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => {
        window.history.replaceState({}, "", pathname)
        router.push("/redefinir-senha")
      })
    }
  }, [supabase, router, pathname])

  return null
}
