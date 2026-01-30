import { getSubscription, isSubscriptionActive, PLAN_LIMITS } from './subscriptions'
import { createClient } from '@/lib/supabase/server'

export async function checkSubscriptionAccess(userId: string): Promise<{
  hasAccess: boolean
  isReadOnly: boolean
  subscription: Awaited<ReturnType<typeof getSubscription>>
}> {
  const subscription = await getSubscription(userId)
  const hasAccess = subscription ? isSubscriptionActive(subscription.status) : false

  return {
    hasAccess,
    isReadOnly: !hasAccess,
    subscription,
  }
}

export async function canUserCreateOrganization(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId)
  if (!subscription || !isSubscriptionActive(subscription.status)) return false

  const supabase = await createClient()
  const { count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const limit = subscription.plan ? PLAN_LIMITS[subscription.plan].organizations : 0
  return (count || 0) < limit
}

export async function canUserCreateProject(userId: string, organizationId: string): Promise<boolean> {
  const subscription = await getSubscription(userId)
  if (!subscription || !isSubscriptionActive(subscription.status)) return false

  const supabase = await createClient()
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const limit = subscription.plan ? PLAN_LIMITS[subscription.plan].projectsPerOrg : 0
  return (count || 0) < limit
}
