import { Paddle, Environment } from '@paddle/paddle-node-sdk'

let paddleInstance: Paddle | null = null

export function getPaddle(): Paddle {
  if (!paddleInstance) {
    const apiKey = process.env.PADDLE_API_KEY
    if (!apiKey) {
      throw new Error('PADDLE_API_KEY is not set')
    }
    paddleInstance = new Paddle(apiKey, {
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
        ? Environment.sandbox
        : Environment.production,
    })
  }
  return paddleInstance
}

// Backwards compatibility export (lazy getter)
export const paddle = {
  get webhooks() {
    return getPaddle().webhooks
  },
}
