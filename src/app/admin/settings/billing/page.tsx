import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db'
import { getSubscription } from '@/lib/paddle/subscriptions'
import { BillingClient } from './BillingClient'

export default async function BillingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const subscription = await getSubscription(user.id)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Billing</h1>
      <BillingClient
        subscription={subscription}
        userEmail={user.email || ''}
        userId={user.id}
      />
    </div>
  )
}
