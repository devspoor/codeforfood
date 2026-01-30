'use client'

declare global {
  interface Window {
    Paddle: any
  }
}

import { useState } from 'react'
import type { Subscription } from '@/lib/paddle/subscriptions'

interface BillingClientProps {
  subscription: Subscription | null
  userEmail: string
  userId: string
}

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$4.99',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO!,
    features: ['3 организации', '5 проектов на организацию', 'Telegram бот'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$9.99',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_UNLIMITED!,
    features: ['Безлимитные организации', 'Безлимитные проекты', 'Telegram бот', 'API доступ'],
  },
]

export function BillingClient({ subscription, userEmail, userId }: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const isActive = subscription?.status === 'trialing' || subscription?.status === 'active'
  const canTrial = !subscription?.trial_used

  const openCheckout = (priceId: string, planId: string) => {
    setLoading(planId)

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userEmail },
      customData: { userId },
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: 'en',
        successUrl: window.location.href,
      },
    })

    // Reset loading after checkout closes
    setTimeout(() => setLoading(null), 1000)
  }

  const openCustomerPortal = () => {
    if (!subscription?.paddle_customer_id) return

    const portalUrl = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
      ? `https://sandbox-customer-portal.paddle.com/cpl_${subscription.paddle_customer_id}`
      : `https://customer-portal.paddle.com/cpl_${subscription.paddle_customer_id}`

    window.open(portalUrl, '_blank')
  }

  return (
    <div className="space-y-8">
      {/* Current Status */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Текущий план</h2>

        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
                {subscription?.status === 'trialing' ? 'Триал' : 'Активна'}
              </span>
              <span className="font-medium capitalize">{subscription?.plan}</span>
            </div>

            {subscription?.status === 'trialing' && subscription.trial_ends_at && (
              <p className="text-sm text-muted">
                Триал заканчивается: {new Date(subscription.trial_ends_at).toLocaleDateString('ru')}
              </p>
            )}

            {subscription?.status === 'active' && subscription.current_period_ends_at && (
              <p className="text-sm text-muted">
                Следующее списание: {new Date(subscription.current_period_ends_at).toLocaleDateString('ru')}
              </p>
            )}

            <button
              onClick={openCustomerPortal}
              className="mt-4 px-4 py-2 border border-border rounded-lg hover:border-accent/50 transition-colors text-sm"
            >
              Управление подпиской
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded">
              {subscription?.status === 'canceled' ? 'Отменена' :
               subscription?.status === 'past_due' ? 'Просрочена' : 'Нет подписки'}
            </span>
            <p className="text-sm text-muted">
              {canTrial
                ? 'Выберите план и начните 7-дневный бесплатный триал'
                : 'Выберите план для продолжения работы'}
            </p>
          </div>
        )}
      </div>

      {/* Plans */}
      {!isActive && (
        <div className="grid md:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-card border border-border rounded-xl p-6 flex flex-col"
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-2">
                {plan.price}
                <span className="text-sm text-muted font-normal">/мес</span>
              </p>

              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => openCheckout(plan.priceId, plan.id)}
                disabled={loading !== null}
                className="mt-6 w-full py-2.5 bg-accent text-background font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {loading === plan.id ? 'Загрузка...' : canTrial ? 'Начать триал' : 'Подписаться'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
