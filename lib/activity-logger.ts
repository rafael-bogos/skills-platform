import { prisma } from './prisma'

export type ActivityAction =
  | 'SKILL_CREATED'
  | 'SKILL_UPDATED'
  | 'SKILL_DELETED'
  | 'SKILL_PUBLISHED'
  | 'SKILL_ARCHIVED'

interface LogActivityParams {
  userId: string
  userEmail: string
  userName: string
  organizationId: string | null
  action: ActivityAction
  entityId?: string
  entityName?: string
  metadata?: Record<string, unknown>
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        organizationId: params.organizationId,
        action: params.action,
        entityId: params.entityId ?? null,
        entityName: params.entityName ?? null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
      },
    })
  } catch {
    // Logging never breaks the main flow
  }
}
