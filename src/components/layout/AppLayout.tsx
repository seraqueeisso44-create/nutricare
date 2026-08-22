"use client"
import { TopNav } from "./TopNav"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bege dark:bg-[#0B1F17] transition-colors duration-300">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
