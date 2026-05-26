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
  status: SkillStatus
  files: SkillFile[]
  createdAt: string
  updatedAt: string
}

export interface CreateSkillInput {
  name: string
  description: string
  category: string
  status: SkillStatus
  files: SkillFile[]
}
