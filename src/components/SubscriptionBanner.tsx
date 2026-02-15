'use client'

import Link from 'next/link'
import type { Subscription } from '@/lib/paddle/subscriptions'

interface SubscriptionBannerProps {
  subscription: Subscription | null
}

export function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  const isActive = subscription?.status === 'trialing' || subscription?.status === 'active'

  if (isActive) return null

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <p className="text-sm text-warning">
          <span className="font-medium">Subscription inactive.</span>
          {' '}Public links disabled. Editing unavailable.
        </p>
        <Link
          href="/admin/settings/billing"
          className="w-full sm:w-auto text-center shrink-0 px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
        >
          Subscribe Now
        </Link>
      </div>
    </div>
  )
}
