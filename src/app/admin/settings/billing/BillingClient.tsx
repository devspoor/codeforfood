'use client'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any
  }
}

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
    features: ['3 organizations', '5 projects per org', 'Telegram bot'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$9.99',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_UNLIMITED!,
    features: ['Unlimited organizations', 'Unlimited projects', 'Telegram bot', 'API access'],
  },
]

export function BillingClient({ subscription, userEmail, userId }: BillingClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [waitingForActivation, setWaitingForActivation] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  const isActive = subscription?.status === 'trialing' || subscription?.status === 'active'
  const canTrial = !subscription?.trial_used

  // Poll for subscription activation
  useEffect(() => {
    if (!waitingForActivation) return

    const interval = setInterval(() => {
      setPollCount(prev => prev + 1)
      router.refresh()
    }, 2000) // Check every 2 seconds

    // Stop polling after 120 seconds
    const timeout = setTimeout(() => {
      setWaitingForActivation(false)
      setLoading(null)
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [waitingForActivation, router])

  // Stop waiting when subscription becomes active
  useEffect(() => {
    if (waitingForActivation && isActive) {
      setWaitingForActivation(false)
      setLoading(null)
    }
  }, [waitingForActivation, isActive])

  const openCheckout = useCallback((priceId: string, planId: string) => {
    setLoading(planId)

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userEmail },
      customData: { userId },
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: 'en',
      },
      successCallback: () => {
        setWaitingForActivation(true)
        setPollCount(0)
      },
      closeCallback: () => {
        if (!waitingForActivation) {
          setLoading(null)
        }
      },
    })
  }, [userEmail, userId, waitingForActivation])

  const openCustomerPortal = () => {
    if (!subscription?.paddle_customer_id) return

    const portalUrl = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
      ? `https://sandbox-customer-portal.paddle.com/cpl_${subscription.paddle_customer_id}`
      : `https://customer-portal.paddle.com/cpl_${subscription.paddle_customer_id}`

    window.open(portalUrl, '_blank')
  }

  // Show activation loader
  if (waitingForActivation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Activating subscription...</h2>
          <p className="text-sm text-muted">
            Please wait while we process your payment
          </p>
          {pollCount > 10 && (
            <p className="text-xs text-muted mt-4">
              Taking longer than expected. You can{' '}
              <button
                onClick={() => router.refresh()}
                className="text-accent hover:underline"
              >
                refresh
              </button>
              {' '}or check back later.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Status */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>

        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
                {subscription?.status === 'trialing' ? 'Trial' : 'Active'}
              </span>
              <span className="font-medium capitalize">{subscription?.plan}</span>
            </div>

            {subscription?.status === 'trialing' && subscription.trial_ends_at && (
              <p className="text-sm text-muted">
                Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString('en')}
              </p>
            )}

            {subscription?.status === 'active' && subscription.current_period_ends_at && (
              <p className="text-sm text-muted">
                Next billing: {new Date(subscription.current_period_ends_at).toLocaleDateString('en')}
              </p>
            )}

            <button
              onClick={openCustomerPortal}
              className="mt-4 px-4 py-2 border border-border rounded-lg hover:border-accent/50 transition-colors text-sm"
            >
              Manage Subscription
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded">
              {subscription?.status === 'canceled' ? 'Canceled' :
               subscription?.status === 'past_due' ? 'Past Due' :
               subscription?.status === 'paused' ? 'Paused' : 'No Subscription'}
            </span>
            <p className="text-sm text-muted">
              {subscription?.status === 'paused'
                ? 'Your subscription is paused. Resume it to continue.'
                : subscription?.status === 'past_due'
                ? 'Payment failed. Please update your payment method.'
                : canTrial
                ? 'Choose a plan and start your 7-day free trial'
                : 'Choose a plan to continue'}
            </p>
            {subscription?.paddle_customer_id && (subscription?.status === 'paused' || subscription?.status === 'past_due') && (
              <button
                onClick={openCustomerPortal}
                className="px-4 py-2 border border-border rounded-lg hover:border-accent/50 transition-colors text-sm"
              >
                Manage Subscription
              </button>
            )}
          </div>
        )}
      </div>

      {/* Plans */}
      {!isActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-card border border-border rounded-xl p-6 flex flex-col"
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-2">
                {plan.price}
                <span className="text-sm text-muted font-normal">/mo</span>
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
                {loading === plan.id ? 'Loading...' : canTrial ? 'Start Free Trial' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
