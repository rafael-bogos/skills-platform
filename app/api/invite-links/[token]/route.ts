import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

async function findLink(token: string) {
  return prisma.inviteLink.findUnique({
    where: { token },
    include: { organization: true },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const link = await findLink(token)

  if (!link) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  }

  return NextResponse.json({
    orgName: link.organization.name,
    orgSlug: link.organization.slug,
    role: link.role,
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const link = await findLink(token)
  if (!link) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  }

  const existing = await prisma.member.findFirst({
    where: { userId: session.user.id, organizationId: link.organizationId },
  })
  if (existing) {
    return NextResponse.json({ alreadyMember: true, orgSlug: link.organization.slug })
  }

  await prisma.member.create({
    data: {
      userId: session.user.id,
      organizationId: link.organizationId,
      role: link.role,
      createdAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, orgSlug: link.organization.slug })
}
