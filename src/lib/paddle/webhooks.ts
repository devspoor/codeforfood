import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-loaded Supabase client for webhook operations (bypasses RLS)
let supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'

// Paddle webhook subscription data
interface PaddleSubscriptionData {
  id: string
  status: string
  customerId: string
  customData?: { userId?: string }
  items?: Array<{ price?: { id: string } }>
  currentBillingPeriod?: { endsAt?: string }
  canceledAt?: string | null
}

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

function getPlanFromPriceId(priceId: string | undefined): 'pro' | 'unlimited' | null {
  if (!priceId) return null
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO) return 'pro'
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_UNLIMITED) return 'unlimited'
  return null
}

export async function handleSubscriptionCreated(data: PaddleSubscriptionData): Promise<void> {
  const userId = data.customData?.userId
  if (!userId) {
    throw new Error('[Paddle] No userId in subscription customData, subscription_id=' + data.id)
  }

  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)
  if (!plan) {
    console.warn(`[Paddle] Unknown price ID: ${priceId}, subscription_id=${data.id}`)
  }
  const status = mapPaddleStatus(data.status)
  const isTrialing = status === 'trialing'

  const { error } = await getSupabase()
    .from('subscriptions')
    .upsert({
      user_id: userId,
      paddle_customer_id: data.customerId,
      paddle_subscription_id: data.id,
      status,
      plan,
      trial_used: true,
      trial_ends_at: isTrialing ? (data.currentBillingPeriod?.endsAt || null) : null,
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    throw new Error(`[Paddle] Failed to upsert subscription: ${error.message}`)
  }
}

export async function handleSubscriptionUpdated(data: PaddleSubscriptionData): Promise<void> {
  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)
  const status = mapPaddleStatus(data.status)

  const { data: rows, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status,
      ...(plan !== null && { plan }),
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('id')

  if (error) {
    throw new Error(`[Paddle] Failed to update subscription: ${error.message}`)
  }
  if (!rows || rows.length === 0) {
    throw new Error(`[Paddle] No subscription found for paddle_subscription_id=${data.id}`)
  }
}

export async function handleSubscriptionCanceled(data: PaddleSubscriptionData): Promise<void> {
  const { data: rows, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: data.canceledAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('id')

  if (error) {
    throw new Error(`[Paddle] Failed to cancel subscription: ${error.message}`)
  }
  if (!rows || rows.length === 0) {
    throw new Error(`[Paddle] No subscription found for paddle_subscription_id=${data.id}`)
  }
}

export async function handleSubscriptionPastDue(data: PaddleSubscriptionData): Promise<void> {
  const { data: rows, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('id')

  if (error) {
    throw new Error(`[Paddle] Failed to mark subscription past_due: ${error.message}`)
  }
  if (!rows || rows.length === 0) {
    throw new Error(`[Paddle] No subscription found for paddle_subscription_id=${data.id}`)
  }
}

export async function handleSubscriptionActivated(data: PaddleSubscriptionData): Promise<void> {
  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)

  const { data: rows, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'active',
      ...(plan !== null && { plan }),
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('id')

  if (error) {
    throw new Error(`[Paddle] Failed to activate subscription: ${error.message}`)
  }
  if (!rows || rows.length === 0) {
    throw new Error(`[Paddle] No subscription found for paddle_subscription_id=${data.id}`)
  }
}

export async function handleSubscriptionPaused(data: PaddleSubscriptionData): Promise<void> {
  const { data: rows, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('id')

  if (error) {
    throw new Error(`[Paddle] Failed to pause subscription: ${error.message}`)
  }
  if (!rows || rows.length === 0) {
    throw new Error(`[Paddle] No subscription found for paddle_subscription_id=${data.id}`)
  }
}

export async function handleSubscriptionResumed(data: PaddleSubscriptionData): Promise<void> {
  const priceId = data.items?.[0]?.price?.id
  const plan = getPlanFromPriceId(priceId)

  const { data: rows, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'active',
      ...(plan !== null && { plan }),
      current_period_ends_at: data.currentBillingPeriod?.endsAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('id')

  if (error) {
    throw new Error(`[Paddle] Failed to resume subscription: ${error.message}`)
  }
  if (!rows || rows.length === 0) {
    throw new Error(`[Paddle] No subscription found for paddle_subscription_id=${data.id}`)
  }
}
