'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any
  }
}

interface PaddleProviderProps {
  children: React.ReactNode
}

export function PaddleProvider({ children }: PaddleProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Paddle) {
      if (process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox') {
        window.Paddle.Environment.set('sandbox')
      }
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      })
    }
  }, [])

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={() => {
          if (process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox') {
            window.Paddle.Environment.set('sandbox')
          }
          window.Paddle.Initialize({
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
          })
        }}
      />
      {children}
    </>
  )
}
