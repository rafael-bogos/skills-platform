'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, Plus, AlertTriangle, RefreshCw, Trash2, Eye, Search, X, SlidersHorizontal, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'
import CreateSkillModal from '@/components/skills/CreateSkillModal'
import ViewSkillModal from '@/components/skills/ViewSkillModal'
import { CATEGORIES, getCategoryIcon } from '@/components/skills/CategorySelect'
import { cn } from '@/lib/utils'
import type { CreateSkillInput, Skill, SkillStatus } from '@/types'

const STATUS_BADGE = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft:    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  archived: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
}
const STATUS_DOT = {
  active: 'bg-emerald-500', draft: 'bg-slate-400', archived: 'bg-slate-500',
}
const STATUS_LABELS = { active: 'Ativa', draft: 'Rascunho', archived: 'Arquivada' }

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<SkillStatus | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState('')

  const filteredSkills = useMemo(() => {
    const q = search.trim().toLowerCase()
    return skills.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterCategory && s.category !== filterCategory) return false
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [skills, search, filterStatus, filterCategory])

  const isFiltered = search !== '' || filterStatus !== 'all' || filterCategory !== ''
  const presentCategories = useMemo(
    () => CATEGORIES.filter((c) => skills.some((s) => s.category === c.value)),
    [skills],
  )

  function clearFilters() {
    setSearch('')
    setFilterStatus('all')
    setFilterCategory('')
  }

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/skills')
      if (!res.ok) throw new Error()
      setSkills(await res.json())
    } catch {
      setError('Não foi possível carregar as skills. Verifique a conexão com o banco.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  async function handleCreate(input: CreateSkillInput) {
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return
    const created: Skill = await res.json()
    setSkills((prev) => [created, ...prev])
    setCreateOpen(false)
  }

  async function handleUpdate(id: string, data: Partial<Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>>) {
    const res = await fetch(`/api/skills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return
    const updated: Skill = await res.json()
    setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)))
    setViewingSkill((prev) => (prev?.id === id ? updated : prev))
  }

  async function handleDelete(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id))
    setViewingSkill((prev) => (prev?.id === id ? null : prev))
    await fetch(`/api/skills/${id}`, { method: 'DELETE' })
  }

  const activeCount = skills.filter((s) => s.status === 'active').length
  const draftCount  = skills.filter((s) => s.status === 'draft').length

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Skills Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nova Skill
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Page title */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Suas Skills
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Automações configuradas para o Claude.
            </p>
          </div>
          {!loading && skills.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {activeCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {activeCount} {activeCount === 1 ? 'ativa' : 'ativas'}
                </span>
              )}
              {draftCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {draftCount} {draftCount === 1 ? 'rascunho' : 'rascunhos'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button
              onClick={fetchSkills}
              className="ml-auto flex items-center gap-1 underline underline-offset-2 hover:no-underline"
            >
              <RefreshCw className="h-3 w-3" /> Tentar novamente
            </button>
          </div>
        )}

        {/* ── Search & filters ── */}
        {!loading && skills.length > 0 && (
          <div className="mb-6 space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-primary-950"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-400" />

              {/* Status */}
              {(['all', 'active', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    filterStatus === s
                      ? s === 'active'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : s === 'draft'
                          ? 'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-300'
                          : 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950 dark:text-primary-300'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
                  )}
                >
                  {s === 'all' ? (
                    'Todos'
                  ) : (
                    <>
                      <span className={cn('h-1.5 w-1.5 rounded-full', s === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                      {s === 'active' ? 'Ativas' : 'Rascunhos'}
                    </>
                  )}
                </button>
              ))}

              {/* Divider */}
              {presentCategories.length > 0 && (
                <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              )}

              {/* Category pills */}
              {presentCategories.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setFilterCategory(filterCategory === value ? '' : value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    filterCategory === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950 dark:text-primary-300'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}

              {/* Clear */}
              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </button>
              )}
            </div>

            {/* Results count when filtered */}
            {isFiltered && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filteredSkills.length === 0
                  ? 'Nenhuma skill encontrada'
                  : `${filteredSkills.length} de ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`}
              </p>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkillCardSkeleton key={i} />)
            : filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onView={setViewingSkill}
                  onDelete={handleDelete}
                />
              ))}

          {/* New skill card — hide when actively filtering */}
          {!loading && !isFiltered && (
            <button
              onClick={() => setCreateOpen(true)}
              className="group flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-5 text-center transition-all hover:border-primary-400 hover:bg-primary-50 dark:border-slate-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-primary-100 dark:bg-slate-800 dark:group-hover:bg-primary-950">
                <Plus className="h-4 w-4 text-slate-400 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </div>
              <span className="text-sm font-medium text-slate-400 group-hover:text-primary-600 dark:text-slate-500 dark:group-hover:text-primary-400">
                Nova Skill
              </span>
            </button>
          )}
        </div>

        {/* No results (filters active, but no match) */}
        {!loading && isFiltered && filteredSkills.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Nenhuma skill encontrada</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tente ajustar sua busca ou filtros.
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Empty state (no skills at all) */}
        {!loading && skills.length === 0 && !error && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-950">
              <Sparkles className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Nenhuma skill ainda</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Crie sua primeira skill para o Claude usar.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Criar primeira skill
            </Button>
          </div>
        )}
      </main>

      <CreateSkillModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <ViewSkillModal
        skill={viewingSkill}
        onClose={() => setViewingSkill(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  )
}

function SkillCard({
  skill,
  onView,
  onDelete,
}: {
  skill: Skill
  onView: (s: Skill) => void
  onDelete: (id: string) => void
}) {
  const CategoryIcon = getCategoryIcon(skill.category)

  return (
    <div
      onClick={() => onView(skill)}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950">
            <CategoryIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            {skill.name}
          </h2>
        </div>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_BADGE[skill.status],
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[skill.status])} />
          {STATUS_LABELS[skill.status]}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {skill.description || <span className="italic">Sem descrição</span>}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {skill.category && (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {skill.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <FileText className="h-3 w-3" />
            {skill.files?.length ?? 0}
          </span>
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onView(skill)}
            className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Ver detalhes"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(skill.id)}
            className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
            title="Excluir skill"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SkillCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
        <div className="h-7 w-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}
