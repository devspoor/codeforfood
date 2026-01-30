import { createClient } from '@/lib/supabase/server'

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'
export type SubscriptionPlan = 'pro' | 'unlimited' | null

export interface Subscription {
  id: string
  user_id: string
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  status: SubscriptionStatus
  plan: SubscriptionPlan
  trial_used: boolean
  trial_ends_at: string | null
  current_period_ends_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export const PLAN_LIMITS = {
  pro: { organizations: 3, projectsPerOrg: 5 },
  unlimited: { organizations: Infinity, projectsPerOrg: Infinity },
} as const

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data
}

export async function getSubscriptionByPaddleId(paddleSubscriptionId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paddle_subscription_id', paddleSubscriptionId)
    .single()

  return data
}

export async function updateSubscription(
  userId: string,
  updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('subscriptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}

export async function updateSubscriptionByPaddleId(
  paddleSubscriptionId: string,
  updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('subscriptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', paddleSubscriptionId)
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'trialing' || status === 'active'
}

export function canCreateOrganization(subscription: Subscription | null, currentCount: number): boolean {
  if (!subscription || !isSubscriptionActive(subscription.status)) return false
  const limit = subscription.plan ? PLAN_LIMITS[subscription.plan].organizations : 0
  return currentCount < limit
}

export function canCreateProject(subscription: Subscription | null, currentCount: number): boolean {
  if (!subscription || !isSubscriptionActive(subscription.status)) return false
  const limit = subscription.plan ? PLAN_LIMITS[subscription.plan].projectsPerOrg : 0
  return currentCount < limit
}
