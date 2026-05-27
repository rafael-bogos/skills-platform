import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { organizationId, role = 'member' } = await request.json()
  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId obrigatório' }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id, organizationId },
  })
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const token = randomBytes(16).toString('hex')
  await prisma.inviteLink.create({
    data: {
      token,
      organizationId,
      role,
      createdBy: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return NextResponse.json({ token })
}
