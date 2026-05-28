export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  perPage: number
}

export type SkillStatus = 'active' | 'draft' | 'archived'

export interface SkillFile {
  id: string
  name: string
  content: string
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  status: SkillStatus
  files: SkillFile[]
  createdAt: string
  updatedAt: string
  userId: string | null
  organizationId: string | null
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: string
}

export interface OrgMember {
  id: string
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
  user: { name: string; email: string; image: string | null }
}

export interface CreateSkillInput {
  name: string
  description?: string
  category: string
  tags?: string[]
  status: SkillStatus
  files: SkillFile[]
}
