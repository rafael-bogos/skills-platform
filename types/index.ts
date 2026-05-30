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

export const GROUP_COLORS = [
  { value: 'slate',  label: 'Cinza',     dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'blue',   label: 'Azul',      dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'violet', label: 'Roxo',      dot: 'bg-violet-400',  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { value: 'emerald',label: 'Verde',     dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'orange', label: 'Laranja',   dot: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { value: 'pink',   label: 'Rosa',      dot: 'bg-pink-400',    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { value: 'amber',  label: 'Amarelo',   dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'red',    label: 'Vermelho',  dot: 'bg-red-400',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
] as const

export type GroupColor = typeof GROUP_COLORS[number]['value']

export interface SkillGroup {
  id: string
  name: string
  description: string
  color: GroupColor
  createdAt: string
  updatedAt: string
  userId: string | null
  organizationId: string | null
}

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
  groupId: string | null
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
  groupId?: string | null
}
