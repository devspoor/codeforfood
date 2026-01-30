import { Paddle, Environment } from '@paddle/paddle-node-sdk'

const apiKey = process.env.PADDLE_API_KEY

if (!apiKey) {
  throw new Error('PADDLE_API_KEY is not set')
}

export const paddle = new Paddle(apiKey, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
    ? Environment.sandbox
    : Environment.production,
})
