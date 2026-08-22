import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _clientBrowser: SupabaseClient | null = null
let _clientServer: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const isServer = typeof window === "undefined"
  if (isServer) {
    if (!_clientServer) _clientServer = createClient(url, key)
    return _clientServer
  }
  if (!_clientBrowser) _clientBrowser = createClient(url, key)
  return _clientBrowser
}

export function isSupabaseConfigured(): boolean {
  return !!(
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
