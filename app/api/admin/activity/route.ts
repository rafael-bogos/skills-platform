import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const activeOrgId = session.session.activeOrganizationId ?? null
    if (!activeOrgId) {
      return NextResponse.json({ error: 'Selecione uma organização' }, { status: 400 })
    }

    const member = await prisma.member.findFirst({
      where: { userId: session.user.id, organizationId: activeOrgId },
    })
    if (!member || member.role === 'member') {
      return NextResponse.json({ error: 'Acesso restrito a admins' }, { status: 403 })
    }

    const [allSkills, members, recentLogs, allLogs] = await Promise.all([
      prisma.skill.findMany({
        where: { organizationId: activeOrgId },
        select: { status: true },
      }),
      prisma.member.findMany({
        where: { organizationId: activeOrgId },
        include: { user: { select: { name: true, email: true, image: true } } },
      }),
      prisma.activityLog.findMany({
        where: { organizationId: activeOrgId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.activityLog.findMany({
        where: { organizationId: activeOrgId },
        select: { userId: true, userName: true, userEmail: true, createdAt: true },
      }),
    ])

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const stats = {
      totalSkills: allSkills.length,
      activeSkills: allSkills.filter((s) => s.status === 'active').length,
      draftSkills: allSkills.filter((s) => s.status === 'draft').length,
      memberCount: members.length,
      activityThisWeek: recentLogs.filter((l) => l.createdAt >= weekAgo).length,
      activityToday: recentLogs.filter((l) => l.createdAt >= todayStart).length,
    }

    // Aggregate user activity ranking
    const userMap = new Map<
      string,
      { userId: string; userName: string; userEmail: string; count: number; lastActive: Date }
    >()
    for (const log of allLogs) {
      const entry = userMap.get(log.userId)
      if (!entry) {
        userMap.set(log.userId, {
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail,
          count: 1,
          lastActive: log.createdAt,
        })
      } else {
        entry.count++
        if (log.createdAt > entry.lastActive) entry.lastActive = log.createdAt
      }
    }

    const ranking = [...userMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((u) => ({ ...u, lastActive: u.lastActive.toISOString() }))

    return NextResponse.json({
      stats,
      activities: recentLogs,
      ranking,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados de admin' }, { status: 500 })
  }
}
