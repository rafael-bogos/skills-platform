import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { GroupColor } from '@/types'

type Params = { params: Promise<{ id: string }> }

async function getAuthorizedGroup(id: string, userId: string, activeOrgId: string | null) {
  const group = await prisma.skillGroup.findUnique({ where: { id } })
  if (!group) return { group: null, authorized: false, memberRole: null }

  const isOwner = group.userId === userId
  const isOrgMember = group.organizationId !== null && group.organizationId === activeOrgId

  let memberRole: string | null = null
  if (isOrgMember && group.organizationId) {
    const m = await prisma.member.findFirst({ where: { userId, organizationId: group.organizationId } })
    memberRole = m?.role ?? null
  }

  return { group, authorized: isOwner || isOrgMember, memberRole }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const { group: existing, authorized, memberRole } = await getAuthorizedGroup(id, session.user.id, activeOrgId)

    if (!existing) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    if (!authorized) return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    if (memberRole === 'member') return NextResponse.json({ error: 'Membros não podem editar grupos' }, { status: 403 })

    const body = await req.json()
    const { name, description, color } = body

    const group = await prisma.skillGroup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(color !== undefined && { color: color as GroupColor }),
      },
    })

    return NextResponse.json(group)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar grupo' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const { group: existing, authorized, memberRole } = await getAuthorizedGroup(id, session.user.id, activeOrgId)

    if (!existing) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    if (!authorized) return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    if (memberRole === 'member') return NextResponse.json({ error: 'Membros não podem excluir grupos' }, { status: 403 })

    // Unlink skills from this group before deleting
    await prisma.skill.updateMany({ where: { groupId: id }, data: { groupId: null } })
    await prisma.skillGroup.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir grupo' }, { status: 500 })
  }
}
