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
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-warning">
          <span className="font-medium">Подписка неактивна.</span>
          {' '}Публичные ссылки отключены. Редактирование недоступно.
        </p>
        <Link
          href="/admin/settings/billing"
          className="shrink-0 px-4 py-1.5 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
        >
          Оплатить подписку
        </Link>
      </div>
    </div>
  )
}
