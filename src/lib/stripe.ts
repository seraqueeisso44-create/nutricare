import Stripe from "stripe"

let _instance: Stripe | null = null

export function getStripe(): Stripe {
  if (!_instance) {
    _instance = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true })
  }
  return _instance
}

export const PLANOS = {
  monthly: {
    name: "Mensal",
    priceId: "price_1U8unqHCY3eRKCWkcqB15DFY",
    price: 2500,
    interval: "month" as const,
    intervalCount: 1,
    label: "R$ 25,00/mês",
    description: "Acesso completo por 1 mês",
  },
  quarterly: {
    name: "Trimestral",
    priceId: "price_1U8unqHCY3eRKCWkcbXtmwRU",
    price: 6750,
    interval: "month" as const,
    intervalCount: 3,
    label: "R$ 67,50 a cada 3 meses",
    description: "R$ 22,50/mês — Economia de 10%",
    discount: "10%",
  },
  semester: {
    name: "Semestral",
    priceId: "price_1U8unrHCY3eRKCWku2fcFS4f",
    price: 12750,
    interval: "month" as const,
    intervalCount: 6,
    label: "R$ 127,50 a cada 6 meses",
    description: "R$ 21,25/mês — Economia de 15%",
    discount: "15%",
  },
  annual: {
    name: "Anual",
    priceId: "price_1U8unrHCY3eRKCWk2fGFD06I",
    price: 24000,
    interval: "year" as const,
    intervalCount: 1,
    label: "R$ 240,00 anual",
    description: "R$ 20,00/mês — Economia de 20%",
    discount: "20%",
  },
} as const

export type PlanoKey = keyof typeof PLANOS
