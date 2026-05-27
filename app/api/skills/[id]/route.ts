import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { SkillStatus } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

async function getAuthorizedSkill(id: string, userId: string, activeOrgId: string | null) {
  const skill = await prisma.skill.findUnique({ where: { id } })
  if (!skill) return { skill: null, authorized: false, memberRole: null }

  const isOwner = skill.userId === userId
  const isOrgMember = skill.organizationId !== null && skill.organizationId === activeOrgId

  let memberRole: string | null = null
  if (isOrgMember && skill.organizationId) {
    const m = await prisma.member.findFirst({ where: { userId, organizationId: skill.organizationId } })
    memberRole = m?.role ?? null
  }

  return { skill, authorized: isOwner || isOrgMember, memberRole }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const { skill, authorized } = await getAuthorizedSkill(id, session.user.id, activeOrgId)

    if (!skill) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    if (!authorized) return NextResponse.json({ error: 'Proibido' }, { status: 403 })

    return NextResponse.json(skill)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar skill' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const { skill: existing, authorized, memberRole } = await getAuthorizedSkill(id, session.user.id, activeOrgId)

    if (!existing) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    if (!authorized) return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    if (memberRole === 'member') return NextResponse.json({ error: 'Membros não podem editar skills' }, { status: 403 })

    const body = await req.json()
    const { name, description, category, status, files } = body

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(status !== undefined && { status: status as SkillStatus }),
        ...(files !== undefined && {
          files: files.map((f: { id?: string; name: string; content: string }) => ({
            id: f.id ?? crypto.randomUUID(),
            name: f.name,
            content: f.content,
          })),
        }),
      },
    })

    return NextResponse.json(skill)
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2025'
    if (isNotFound) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    return NextResponse.json({ error: 'Erro ao atualizar skill' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const { skill: existing, authorized, memberRole } = await getAuthorizedSkill(id, session.user.id, activeOrgId)

    if (!existing) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    if (!authorized) return NextResponse.json({ error: 'Proibido' }, { status: 403 })
    if (memberRole === 'member') return NextResponse.json({ error: 'Membros não podem excluir skills' }, { status: 403 })

    await prisma.skill.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2025'
    if (isNotFound) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    return NextResponse.json({ error: 'Erro ao deletar skill' }, { status: 500 })
  }
}
