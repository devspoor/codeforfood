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
        await handleSubscriptionCreated(event.data)
        break
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data)
        break
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data)
        break
      case EventName.SubscriptionPastDue:
        await handleSubscriptionPastDue(event.data)
        break
      case EventName.SubscriptionActivated:
        await handleSubscriptionActivated(event.data)
        break
      case EventName.SubscriptionPaused:
        await handleSubscriptionPaused(event.data)
        break
      case EventName.SubscriptionResumed:
        await handleSubscriptionResumed(event.data)
        break
      default:
        console.log(`[Paddle Webhook] Unhandled event: ${event.eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Paddle Webhook] Error:', error)
    // Return 200 to prevent Paddle retries for invalid signatures
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 200 })
  }
}
