'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, CheckCircle, Archive, Users, Layers,
  TrendingUp, Activity, RefreshCw, AlertTriangle, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalSkills: number
  activeSkills: number
  draftSkills: number
  memberCount: number
  activityThisWeek: number
  activityToday: number
}

interface ActivityEntry {
  id: string
  userId: string
  userEmail: string
  userName: string
  action: string
  entityId: string | null
  entityName: string | null
  createdAt: string
}

interface RankEntry {
  userId: string
  userName: string
  userEmail: string
  count: number
  lastActive: string
}

interface AdminData {
  stats: AdminStats
  activities: ActivityEntry[]
  ranking: RankEntry[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'agora mesmo'
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  SKILL_CREATED: {
    label: 'criou a skill',
    icon: Plus,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  SKILL_UPDATED: {
    label: 'atualizou a skill',
    icon: Pencil,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  SKILL_DELETED: {
    label: 'excluiu a skill',
    icon: Trash2,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
  },
  SKILL_PUBLISHED: {
    label: 'publicou a skill',
    icon: CheckCircle,
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-100 dark:bg-primary-900/40',
  },
  SKILL_ARCHIVED: {
    label: 'arquivou a skill',
    icon: Archive,
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-amber-500',
]

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-slate-500 dark:text-slate-400">{label}</span>
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
        <p className="mt-0.5 h-4 text-xs text-slate-400 dark:text-slate-500">{sub ?? ''}</p>
      </div>
    </div>
  )
}

function ActivityFeed({ activities }: { activities: ActivityEntry[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Activity className="h-5 w-5 text-slate-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">Sem atividade ainda</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            As ações dos membros aparecerão aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {activities.map((entry, i) => {
        const cfg = ACTION_CONFIG[entry.action] ?? {
          label: entry.action.toLowerCase().replace('_', ' '),
          icon: Activity,
          color: 'text-slate-500',
          bg: 'bg-slate-100',
        }
        const ActionIcon = cfg.icon
        const isLast = i === activities.length - 1

        return (
          <div key={entry.id} className="flex gap-3 py-2.5">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  cfg.bg,
                )}
              >
                <ActionIcon className={cn('h-3.5 w-3.5', cfg.color)} />
              </div>
              {!isLast && (
                <div className="mt-1 w-px flex-1 bg-slate-100 dark:bg-slate-800" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {entry.userName}
                </span>{' '}
                <span className="text-slate-500 dark:text-slate-400">{cfg.label}</span>
                {entry.entityName && (
                  <>
                    {' '}
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {entry.entityName}
                    </span>
                  </>
                )}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="h-3 w-3" />
                {timeAgo(entry.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UserRanking({ ranking }: { ranking: RankEntry[] }) {
  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 dark:text-slate-500">Sem dados ainda</p>
      </div>
    )
  }

  const maxCount = ranking[0].count

  return (
    <div className="space-y-3">
      {ranking.map((user, i) => (
        <div key={user.userId} className="flex items-center gap-3">
          {/* Position */}
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              i === 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                : i === 1
                  ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  : i === 2
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
            )}
          >
            {i + 1}
          </span>

          {/* Avatar */}
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
              avatarColor(user.userId),
            )}
          >
            {initials(user.userName)}
          </div>

          {/* Info + bar */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.userName}
              </p>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {user.count}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${Math.round((user.count / maxCount) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mt-4">
        <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-0.5 h-4 w-20 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminTab() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/activity')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d: AdminData) => setData(d))
      .catch(() => setError('Não foi possível carregar os dados de administração.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Administração
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atividade e métricas da organização
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-700 hover:shadow active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 transition-transform', loading && 'animate-spin')} />
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={fetchData}
            className="ml-auto flex items-center gap-1 underline underline-offset-2 hover:no-underline"
          >
            <RefreshCw className="h-3 w-3" /> Tentar novamente
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard
              label="Skills totais"
              value={data.stats.totalSkills}
              icon={Layers}
              color="bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
            />
            <StatCard
              label="Skills ativas"
              value={data.stats.activeSkills}
              icon={CheckCircle}
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              sub={`${data.stats.draftSkills} rascunho${data.stats.draftSkills !== 1 ? 's' : ''}`}
            />
            <StatCard
              label="Membros"
              value={data.stats.memberCount}
              icon={Users}
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
            />
            <StatCard
              label="Ações hoje"
              value={data.stats.activityToday}
              icon={Activity}
              color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
            />
            <StatCard
              label="Esta semana"
              value={data.stats.activityThisWeek}
              icon={TrendingUp}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            />
            <StatCard
              label="Contribuidores"
              value={data.ranking.length}
              icon={Users}
              color="bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400"
            />
          </>
        ) : null}
      </div>

      {/* Activity + Ranking */}
      {!loading && data && (
        <div
          className="grid min-h-[400px] gap-6 lg:grid-cols-[1fr_320px]"
          style={{ height: 'calc(100vh - 660px)' }}
        >
          {/* Activity feed */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Atividade recente
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Últimas {data.activities.length} ações registradas
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ActivityFeed activities={data.activities} />
            </div>
          </div>

          {/* Ranking */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Membros mais ativos
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Por total de ações
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <UserRanking ranking={data.ranking} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
