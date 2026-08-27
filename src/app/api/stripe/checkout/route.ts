import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, PLANOS, type PlanoKey } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { plano } = (await request.json()) as { plano: PlanoKey }

    if (!plano || !PLANOS[plano]) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profile?.isento) {
      return NextResponse.json({ error: "Usuário isento" }, { status: 400 })
    }

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    const planoConfig = PLANOS[plano]
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nutricare-jet.vercel.app"

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      line_items: [
        {
          price: planoConfig.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: { user_id: user.id, plano },
      },
      metadata: { user_id: user.id, plano },
      success_url: `${baseUrl}/assinatura?success=true`,
      cancel_url: `${baseUrl}/assinatura?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Erro ao criar sessão de pagamento" }, { status: 500 })
  }
}
