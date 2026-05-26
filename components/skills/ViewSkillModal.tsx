'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, Sparkles, Pencil, Check, Trash2, CalendarDays, RefreshCw,
  FileText, FolderOpen, Plus, ChevronDown, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import CategorySelect, { getCategoryIcon } from '@/components/skills/CategorySelect'
import type { Skill, SkillFile, SkillStatus } from '@/types'

interface ViewSkillModalProps {
  skill: Skill | null
  onClose: () => void
  onUpdate: (id: string, data: Partial<Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  onDelete: (id: string) => void
}

const STATUS_BADGE: Record<SkillStatus, string> = {
  active:   'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30',
  draft:    'bg-white/10 text-white/60 ring-1 ring-white/20',
  archived: 'bg-white/10 text-white/40 ring-1 ring-white/15',
}
const STATUS_LABELS: Record<SkillStatus, string> = {
  active: 'Ativa', draft: 'Rascunho', archived: 'Arquivada',
}
const STATUS_DOT: Record<SkillStatus, string> = {
  active: 'bg-emerald-400', draft: 'bg-slate-400', archived: 'bg-slate-500',
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `há ${days}d`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Tab = 'sobre' | 'arquivos'
type EditForm = { name: string; description: string; category: string; status: SkillStatus }

function groupFiles(files: SkillFile[]) {
  const root: SkillFile[] = []
  const folders: Record<string, SkillFile[]> = {}
  for (const f of files) {
    const slash = f.name.indexOf('/')
    if (slash === -1) root.push(f)
    else {
      const folder = f.name.slice(0, slash)
      ;(folders[folder] ??= []).push(f)
    }
  }
  return { root, folders }
}

export default function ViewSkillModal({ skill, onClose, onUpdate, onDelete }: ViewSkillModalProps) {
  const [tab, setTab] = useState<Tab>('sobre')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [form, setForm] = useState<EditForm>({ name: '', description: '', category: '', status: 'draft' })
  const [files, setFiles] = useState<SkillFile[]>([])
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newFileName, setNewFileName] = useState('')
  const [addingFile, setAddingFile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [visible, setVisible] = useState(false)
  const newFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (skill) {
      setForm({ name: skill.name, description: skill.description, category: skill.category, status: skill.status })
      setFiles(skill.files ?? [])
      setMode('view')
      setTab('sobre')
      setDeleteConfirm(false)
      setExpandedFile(null)
      setExpandedFolders(new Set())
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
    }
  }, [skill])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (skill) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [skill, onClose])

  useEffect(() => {
    if (addingFile) setTimeout(() => newFileRef.current?.focus(), 50)
  }, [addingFile])

  function setField<K extends keyof EditForm>(key: K, val: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function updateFileContent(id: string, content: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)))
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (expandedFile === id) setExpandedFile(null)
  }

  function addFile() {
    const name = newFileName.trim()
    if (!name) return
    const file: SkillFile = { id: crypto.randomUUID(), name, content: '' }
    setFiles((prev) => [...prev, file])
    setExpandedFile(file.id)
    const slash = name.indexOf('/')
    if (slash !== -1) setExpandedFolders((prev) => new Set([...prev, name.slice(0, slash)]))
    setNewFileName('')
    setAddingFile(false)
  }

  function handleCancel() {
    if (!skill) return
    setForm({ name: skill.name, description: skill.description, category: skill.category, status: skill.status })
    setFiles(skill.files ?? [])
    setMode('view')
  }

  async function handleSave() {
    if (!skill) return
    setSaving(true)
    await onUpdate(skill.id, { ...form, files })
    setSaving(false)
    setMode('view')
  }

  function handleDelete() {
    if (!skill) return
    if (deleteConfirm) { onDelete(skill.id); onClose() }
    else setDeleteConfirm(true)
  }

  if (!skill) return null

  const CategoryIcon = getCategoryIcon(skill.category)
  const { root, folders } = groupFiles(files)
  const isEditing = mode === 'edit'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-200',
          'max-h-[88vh]',
          visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-2 opacity-0',
        )}
      >
        {/* ── Gradient header ── */}
        <div
          className="relative shrink-0 overflow-hidden px-6 pb-4 pt-5"
          style={{ background: 'linear-gradient(135deg, #3b0764 0%, #5b21b6 45%, #7c3aed 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-primary-500/20 blur-2xl" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <CategoryIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="truncate font-mono text-xl font-bold leading-tight text-white">
                {skill.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {skill.category && (
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70 ring-1 ring-white/15">
                    {skill.category}
                  </span>
                )}
                <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_BADGE[skill.status])}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[skill.status])} />
                  {STATUS_LABELS[skill.status]}
                </span>
                <span className="ml-auto flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  <FileText className="h-3 w-3" />
                  {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative mt-4 flex gap-1">
            {(['sobre', 'arquivos'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                  tab === t
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white/80',
                )}
              >
                {t === 'sobre' ? 'Sobre' : 'Arquivos'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
          {tab === 'sobre' ? (
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {mode === 'view' ? (
                <>
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        Gatilho do Claude
                      </span>
                    </div>
                    <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-primary-900/60 dark:bg-primary-950/30 dark:text-slate-300">
                      {skill.description || <span className="italic text-slate-400">Sem descrição</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Criada {formatDate(skill.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Atualizada {formatDate(skill.updatedAt)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nome</label>
                    <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputCn} autoFocus />
                  </div>
                  <div className="space-y-2 rounded-xl border-2 border-primary-200 bg-primary-50/60 p-4 dark:border-primary-900 dark:bg-primary-950/30">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                      <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">Gatilho do Claude</span>
                    </div>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-primary-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-primary-950"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoria</label>
                      <CategorySelect value={form.category} onChange={(v) => setField('category', v)} dropdownDirection="up" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
                      <div className="flex gap-2">
                        {(['draft', 'active'] as SkillStatus[]).map((s) => (
                          <label key={s} className={cn(
                            'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors',
                            form.status === s
                              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-950 dark:text-primary-300'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                          )}>
                            <input type="radio" name="edit-status" value={s} checked={form.status === s} onChange={() => setField('status', s)} className="sr-only" />
                            <span className={cn('h-1.5 w-1.5 rounded-full', s === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                            {s === 'active' ? 'Ativa' : 'Rascunho'}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Files tab ── */
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-0.5">
                  {/* Root files */}
                  {root.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      expanded={expandedFile === file.id}
                      editing={isEditing}
                      onToggle={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                      onContentChange={(c) => updateFileContent(file.id, c)}
                      onRemove={() => removeFile(file.id)}
                    />
                  ))}

                  {/* Folders */}
                  {Object.entries(folders).map(([folder, folderFiles]) => (
                    <div key={folder}>
                      <button
                        onClick={() => setExpandedFolders((prev) => {
                          const next = new Set(prev)
                          next.has(folder) ? next.delete(folder) : next.add(folder)
                          return next
                        })}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                      >
                        {expandedFolders.has(folder)
                          ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                          : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        }
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="font-medium">{folder}/</span>
                        <span className="ml-auto text-slate-400">{folderFiles.length}</span>
                      </button>
                      {expandedFolders.has(folder) && (
                        <div className="ml-4 space-y-0.5 border-l border-slate-100 pl-2 dark:border-slate-800">
                          {folderFiles.map((file) => (
                            <FileRow
                              key={file.id}
                              file={file}
                              label={file.name.slice(folder.length + 1)}
                              expanded={expandedFile === file.id}
                              editing={isEditing}
                              onToggle={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                              onContentChange={(c) => updateFileContent(file.id, c)}
                              onRemove={() => removeFile(file.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add file */}
                  {isEditing && (
                    <div className="pt-1">
                      {addingFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50/60 px-3 py-2 dark:border-primary-800 dark:bg-primary-950/30">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-primary-400" />
                          <input
                            ref={newFileRef}
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); addFile() }
                              if (e.key === 'Escape') { setAddingFile(false); setNewFileName('') }
                            }}
                            placeholder="ex: references/examples.md"
                            className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none dark:text-slate-300"
                          />
                          <button onClick={addFile} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                            Adicionar
                          </button>
                          <button onClick={() => { setAddingFile(false); setNewFileName('') }} className="text-slate-400 hover:text-slate-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingFile(true)}
                          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:text-primary-400"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar arquivo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit toggle for files tab */}
              {!isEditing && (
                <div className="shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                  <button
                    onClick={() => setMode('edit')}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar arquivos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={handleDelete}
            onBlur={() => setDeleteConfirm(false)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
              deleteConfirm
                ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                : 'text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteConfirm ? 'Confirmar?' : 'Excluir'}
          </button>

          {mode === 'view' ? (
            <Button size="sm" variant="secondary" onClick={() => setMode('edit')}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancel}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="h-3.5 w-3.5" />
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileRow({
  file, label, expanded, editing, onToggle, onContentChange, onRemove,
}: {
  file: SkillFile
  label?: string
  expanded: boolean
  editing: boolean
  onToggle: () => void
  onContentChange: (c: string) => void
  onRemove: () => void
}) {
  const displayName = label ?? file.name
  const isSkillMd = file.name === 'SKILL.md'

  return (
    <div className="rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          }
          <FileText className={cn('h-3.5 w-3.5 shrink-0', isSkillMd ? 'text-primary-500' : 'text-slate-400')} />
          <span className={cn('text-xs', isSkillMd ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400')}>
            {displayName}
          </span>
          {isSkillMd && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              principal
            </span>
          )}
        </button>
        {editing && !isSkillMd && (
          <button
            onClick={onRemove}
            className="rounded p-0.5 text-slate-300 hover:text-red-500 dark:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          {editing ? (
            <textarea
              rows={10}
              value={file.content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:ring-primary-950"
              autoFocus
            />
          ) : (
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
              {file.content || <span className="italic text-slate-400">Arquivo vazio</span>}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

const inputCn =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 ' +
  'transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-primary-950'
