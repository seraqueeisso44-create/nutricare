"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const COOKIE_KEY = "nutricare_cookie_consent"

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) setShow(true)
  }, [])

  const aceitar = () => {
    localStorage.setItem(COOKIE_KEY, "accepted")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-5 space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Este aplicativo utiliza cookies e armazenamento local essenciais para o funcionamento (autenticação, preferências, dados locais).
          Não utilizamos cookies de rastreamento ou analytics de terceiros.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ao continuar, você concorda com nossa{" "}
          <Link href="/politica-privacidade" className="underline text-[#C9975A] hover:text-[#b8894e]">
            Política de Privacidade
          </Link>.
        </p>
        <div className="flex justify-end gap-3">
          <Link
            href="/politica-privacidade"
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Saiba mais
          </Link>
          <button
            onClick={aceitar}
            className="px-4 py-2 text-sm bg-[#C9975A] text-[#0F3D2E] font-semibold rounded-lg hover:bg-[#b8894e] transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
