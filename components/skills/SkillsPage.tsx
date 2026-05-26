'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, Plus, AlertTriangle, RefreshCw, Trash2, Eye, Search, X, SlidersHorizontal, FileText, AlertCircle, Layers, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'
import CreateSkillModal from '@/components/skills/CreateSkillModal'
import ViewSkillModal from '@/components/skills/ViewSkillModal'
import LearnTab from '@/components/skills/LearnTab'
import { CATEGORIES, getCategoryIcon } from '@/components/skills/CategorySelect'
import { cn } from '@/lib/utils'
import type { CreateSkillInput, Skill, SkillStatus } from '@/types'

type ActiveTab = 'skills' | 'learn'
const TAB_ORDER: ActiveTab[] = ['skills', 'learn']

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('skills')
  const [tabDir, setTabDir] = useState<'left' | 'right'>('right')

  function changeTab(next: ActiveTab) {
    setTabDir(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(activeTab) ? 'right' : 'left')
    setActiveTab(next)
  }
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createInitialData, setCreateInitialData] = useState<Partial<CreateSkillInput> | null>(null)
  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null)

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

  function handleOpenCreateModal(data?: Partial<CreateSkillInput>) {
    setCreateInitialData(data ?? null)
    setCreateOpen(true)
  }

  function handleModalClose() {
    setCreateOpen(false)
    setCreateInitialData(null)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Skills Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {activeTab === 'skills' && (
              <Button size="sm" onClick={() => handleOpenCreateModal()}>
                <Plus className="h-3.5 w-3.5" />
                Nova Skill
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

        {/* ── Tab navigation ── */}
        <div className="relative mb-8 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900/70">
          {/* Sliding pill indicator */}
          <div
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-lg bg-primary-600 shadow-md transition-transform duration-200 ease-out dark:bg-primary-500"
            style={{ transform: activeTab === 'learn' ? 'translateX(calc(100% + 4px))' : 'translateX(0)' }}
          />
          {([
            { id: 'skills', icon: Layers, label: 'Minhas Skills' },
            { id: 'learn',  icon: BookOpen, label: 'Aprender' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={cn(
                'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150',
                activeTab === id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Learn tab ── */}
        {activeTab === 'learn' && (
          <div key="learn" className={tabDir === 'right' ? 'tab-slide-right' : 'tab-slide-left'}>
            <LearnTab />
          </div>
        )}

        {/* ── Skills tab ── */}
        {activeTab === 'skills' && (
        <div key="skills" className={tabDir === 'right' ? 'tab-slide-right' : 'tab-slide-left'}>
        {/* Page title */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
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
                  onDeleteRequest={setPendingDelete}
                />
              ))}

          {/* New skill card — hide when actively filtering */}
          {!loading && !isFiltered && (
            <button
              onClick={() => handleOpenCreateModal()}
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
            <Button onClick={() => handleOpenCreateModal()}>
              <Plus className="h-4 w-4" /> Criar primeira skill
            </Button>
          </div>
        )}
        </div>
        )}
      </main>

      <CreateSkillModal
        open={createOpen}
        onClose={handleModalClose}
        onSubmit={handleCreate}
        initialData={createInitialData}
      />
      <ViewSkillModal
        skill={viewingSkill}
        onClose={() => setViewingSkill(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
      <DeleteConfirmDialog
        skill={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function SkillCard({
  skill,
  onView,
  onDeleteRequest,
}: {
  skill: Skill
  onView: (s: Skill) => void
  onDeleteRequest: (s: Skill) => void
}) {
  const CategoryIcon = getCategoryIcon(skill.category)

  return (
    <div
      onClick={() => onView(skill)}
      className="group relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Top row */}
      <div className="flex min-w-0 items-start justify-between gap-2">
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
            onClick={() => onDeleteRequest(skill)}
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

function DeleteConfirmDialog({
  skill,
  onCancel,
  onConfirm,
}: {
  skill: Skill | null
  onCancel: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    if (!skill) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [skill, onCancel])

  if (!skill) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Excluir skill</h2>
        <p className="mt-1.5 break-words text-sm text-slate-500 dark:text-slate-400">
          Tem certeza que deseja excluir{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">{skill.name}</span>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Excluir
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
