import { NextRequest, NextResponse } from 'next/server'
import { paddle } from '@/lib/paddle/client'
import { EventName } from '@paddle/paddle-node-sdk'
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionCanceled,
  handleSubscriptionPastDue,
  handleSubscriptionActivated,
  handleSubscriptionPaused,
  handleSubscriptionResumed,
} from '@/lib/paddle/webhooks'

// Paddle notification data structure (simplified)
interface PaddleNotificationData {
  id: string
  status: string
  customerId: string
  customData?: { userId?: string }
  items?: Array<{ price?: { id: string } }>
  currentBillingPeriod?: { endsAt?: string }
  canceledAt?: string | null
}

// Map Paddle webhook data to our format
function mapSubscriptionData(data: unknown): PaddleNotificationData {
  const sub = data as PaddleNotificationData
  return {
    id: sub.id,
    status: sub.status,
    customerId: sub.customerId,
    customData: sub.customData,
    items: sub.items,
    currentBillingPeriod: sub.currentBillingPeriod,
    canceledAt: sub.canceledAt,
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('paddle-signature') || ''
  const rawBody = await request.text()
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || ''

  if (!signature || !rawBody) {
    return NextResponse.json({ error: 'Missing signature or body' }, { status: 400 })
  }

  try {
    const event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature)

    console.log(`[Paddle Webhook] ${event.eventType}:`, event.data.id)

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(mapSubscriptionData(event.data))
        break
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(mapSubscriptionData(event.data))
        break
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(mapSubscriptionData(event.data))
        break
      case EventName.SubscriptionPastDue:
        await handleSubscriptionPastDue(mapSubscriptionData(event.data))
        break
      case EventName.SubscriptionActivated:
        await handleSubscriptionActivated(mapSubscriptionData(event.data))
        break
      case EventName.SubscriptionPaused:
        await handleSubscriptionPaused(mapSubscriptionData(event.data))
        break
      case EventName.SubscriptionResumed:
        await handleSubscriptionResumed(mapSubscriptionData(event.data))
        break
      default:
        console.log(`[Paddle Webhook] Unhandled event: ${event.eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Paddle Webhook] Error:', error)

    // Signature verification failures: return 400 so Paddle doesn't retry with bad signature
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('signature') || errorMessage.includes('unmarshal')) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    // Processing errors: return 500 so Paddle retries the webhook
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
