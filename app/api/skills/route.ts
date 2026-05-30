import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import type { SkillStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    const where = activeOrgId
      ? { organizationId: activeOrgId }
      : { userId: session.user.id, organizationId: null }

    const skills = await prisma.skill.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(skills)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar skills' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { name, description, category, tags, status, files: inputFiles, groupId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })
    }

    const files = inputFiles?.length
      ? inputFiles.map((f: { id?: string; name: string; content: string }) => ({
          id: f.id ?? crypto.randomUUID(),
          name: f.name,
          content: f.content ?? '',
        }))
      : [{ id: crypto.randomUUID(), name: 'SKILL.md', content: '' }]

    const activeOrgId = session.session.activeOrganizationId ?? null

    if (activeOrgId) {
      const member = await prisma.member.findFirst({
        where: { userId: session.user.id, organizationId: activeOrgId },
      })
      if (!member || member.role === 'member') {
        return NextResponse.json({ error: 'Apenas admin e dono podem criar skills' }, { status: 403 })
      }
    }

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? '',
        category: category?.trim() ?? '',
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [],
        status: (status as SkillStatus) ?? 'draft',
        files,
        userId: activeOrgId ? null : session.user.id,
        organizationId: activeOrgId,
        groupId: groupId ?? null,
      },
    })

    void logActivity({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      organizationId: activeOrgId,
      action: (status as string) === 'active' ? 'SKILL_PUBLISHED' : 'SKILL_CREATED',
      entityId: skill.id,
      entityName: skill.name,
    })

    return NextResponse.json(skill, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar skill' }, { status: 500 })
  }
}
