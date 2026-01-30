import { createClient } from '@supabase/supabase-js'

// Use service role for webhook operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'

function mapPaddleStatus(paddleStatus: string): SubscriptionStatus {
  switch (paddleStatus) {
    case 'trialing': return 'trialing'
    case 'active': return 'active'
    case 'past_due': return 'past_due'
    case 'paused': return 'paused'
    case 'canceled': return 'canceled'
    default: return 'none'
  }
}

function getPlanFromPriceId(priceId: string): 'pro' | 'unlimited' | null {
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO) return 'pro'
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_UNLIMITED) return 'unlimited'
  return null
}

export async function handleSubscriptionCreated(data: any): Promise<void> {
  const userId = data.customData?.userId
  if (!userId) {
    console.error('[Paddle] No userId in subscription customData')
    return
  }

  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)
  const status = mapPaddleStatus(data.status)
  const isTrialing = status === 'trialing'

  await supabase
    .from('subscriptions')
    .update({
      paddle_customer_id: data.customerId,
      paddle_subscription_id: data.id,
      status,
      plan,
      trial_used: isTrialing ? true : undefined,
      trial_ends_at: data.currentBillingPeriod?.endsAt || null,
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}

export async function handleSubscriptionUpdated(data: any): Promise<void> {
  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)
  const status = mapPaddleStatus(data.status)

  await supabase
    .from('subscriptions')
    .update({
      status,
      plan,
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
}

export async function handleSubscriptionCanceled(data: any): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: data.canceledAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
}

export async function handleSubscriptionPastDue(data: any): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
}

export async function handleSubscriptionActivated(data: any): Promise<void> {
  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      plan,
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
}

export async function handleSubscriptionPaused(data: any): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
}

export async function handleSubscriptionResumed(data: any): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
}
