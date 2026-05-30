import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { GroupColor } from '@/types'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const where = activeOrgId
      ? { organizationId: activeOrgId }
      : { userId: session.user.id, organizationId: null }

    const groups = await prisma.skillGroup.findMany({ where, orderBy: { name: 'asc' } })
    return NextResponse.json(groups)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar grupos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null

    if (activeOrgId) {
      const member = await prisma.member.findFirst({
        where: { userId: session.user.id, organizationId: activeOrgId },
      })
      if (!member || member.role === 'member') {
        return NextResponse.json({ error: 'Apenas admin e dono podem criar grupos' }, { status: 403 })
      }
    }

    const body = await req.json()
    const { name, description, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })
    }

    const group = await prisma.skillGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? '',
        color: (color as GroupColor) ?? 'slate',
        userId: activeOrgId ? null : session.user.id,
        organizationId: activeOrgId,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar grupo' }, { status: 500 })
  }
}
