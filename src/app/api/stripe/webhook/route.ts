import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

let _admin: SupabaseClient | null = null
function getAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    const db = getAdmin()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const plano = session.metadata?.plano

        if (userId && session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)
          const subData = subscription as unknown as { current_period_end: number }

          await db.from("profiles").update({
            subscription_status: "active",
            subscription_plan: plano,
            subscription_end: new Date(subData.current_period_end * 1000).toISOString(),
            stripe_customer_id: session.customer as string,
          }).eq("id", userId)
        }
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown as { subscription: string | null }
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.user_id
          const subData = subscription as unknown as { current_period_end: number }

          if (userId) {
            await db.from("profiles").update({
              subscription_status: "active",
              subscription_end: new Date(subData.current_period_end * 1000).toISOString(),
            }).eq("id", userId)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription: string | null }
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.user_id

          if (userId) {
            await db.from("profiles").update({
              subscription_status: "past_due",
            }).eq("id", userId)
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          await db.from("profiles").update({
            subscription_status: "inactive",
            subscription_plan: null,
            subscription_end: null,
          }).eq("id", userId)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        const subData = subscription as unknown as { current_period_end: number; status: string }

        if (userId) {
          const status = subData.status === "active" ? "active"
            : subData.status === "past_due" ? "past_due"
            : "inactive"

          await db.from("profiles").update({
            subscription_status: status,
            subscription_end: new Date(subData.current_period_end * 1000).toISOString(),
          }).eq("id", userId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
