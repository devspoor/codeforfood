import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    region: process.env.FLY_REGION || 'unknown'
  })
}
