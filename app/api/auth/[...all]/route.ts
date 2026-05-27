import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextRequest } from 'next/server'

const handler = toNextJsHandler(auth)

export async function GET(req: NextRequest) {
  return handler.GET(req)
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req)
  } catch (err) {
    console.error('[BetterAuth] POST error:', err)
    throw err
  }
}
