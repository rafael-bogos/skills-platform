'use client'

import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import {
  X, Pencil, Check, Trash2, CalendarDays, RefreshCw,
  FileText, FolderOpen, Plus, ChevronDown, ChevronRight, ArrowLeft, Copy, Download,
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

type EditForm = { name: string; description: string; category: string; status: SkillStatus }

type DirItem = { kind: 'file'; name: string; file: SkillFile } | { kind: 'folder'; name: string }

function listDirectory(files: SkillFile[], dirPath: string, knownFolders: Set<string> = new Set()): DirItem[] {
  const prefix = dirPath ? `${dirPath}/` : ''
  const seen = new Map<string, DirItem>()
  for (const folder of knownFolders) {
    if (dirPath) {
      if (folder.startsWith(prefix)) {
        const rest = folder.slice(prefix.length)
        if (rest && !rest.includes('/')) seen.set(rest, { kind: 'folder', name: rest })
      }
    } else {
      if (!folder.includes('/')) seen.set(folder, { kind: 'folder', name: folder })
    }
  }
  for (const file of files) {
    if (!file.name.startsWith(prefix)) continue
    const rest = file.name.slice(prefix.length)
    if (!rest) continue
    const slash = rest.indexOf('/')
    if (slash === -1) seen.set(rest, { kind: 'file', name: rest, file })
    else {
      const folder = rest.slice(0, slash)
      if (!seen.has(folder)) seen.set(folder, { kind: 'folder', name: folder })
    }
  }
  return [...seen.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

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
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [form, setForm] = useState<EditForm>({ name: '', description: '', category: '', status: 'draft' })
  const [files, setFiles] = useState<SkillFile[]>([])
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [editPath, setEditPath] = useState('')
  const [emptyFolders, setEmptyFolders] = useState<Set<string>>(new Set())
  const [newFileName, setNewFileName] = useState('')
  const [addingFile, setAddingFile] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [visible, setVisible] = useState(false)
  const newFileRef = useRef<HTMLInputElement>(null)
  const newFolderRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (skill) {
      setForm({ name: skill.name, description: skill.description, category: skill.category, status: skill.status })
      setFiles(skill.files ?? [])
      setMode('view')
      setDeleteConfirm(false)
      setExpandedFile(null)
      setExpandedFolders(new Set())
      setEditPath('')
      setEmptyFolders(new Set())
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
    }
  }, [skill])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (skill) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [skill, onClose])

  useEffect(() => {
    if (addingFile) setTimeout(() => newFileRef.current?.focus(), 50)
  }, [addingFile])
  useEffect(() => {
    if (addingFolder) setTimeout(() => newFolderRef.current?.focus(), 50)
  }, [addingFolder])

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

  function navigateEditDir(path: string) {
    setEditPath(path)
    setAddingFile(false)
    setNewFileName('')
    setAddingFolder(false)
    setNewFolderName('')
    setExpandedFile(null)
  }

  function addFile() {
    const rawName = newFileName.trim()
    if (!rawName) return
    const fullName = editPath ? `${editPath}/${rawName}` : rawName
    if (files.some(f => f.name === fullName)) return
    const file: SkillFile = { id: crypto.randomUUID(), name: fullName, content: '' }
    setFiles((prev) => [...prev, file])
    setExpandedFile(file.id)
    setNewFileName('')
    setAddingFile(false)
  }

  function addFolder() {
    const rawName = newFolderName.trim()
    if (!rawName || rawName.includes('/')) return
    const fullName = editPath ? `${editPath}/${rawName}` : rawName
    if (emptyFolders.has(fullName) || files.some(f => f.name.startsWith(fullName + '/'))) return
    setEmptyFolders((prev) => new Set([...prev, fullName]))
    setAddingFolder(false)
    setNewFolderName('')
    navigateEditDir(fullName)
  }

  function handleCancel() {
    if (!skill) return
    setForm({ name: skill.name, description: skill.description, category: skill.category, status: skill.status })
    setFiles(skill.files ?? [])
    setEditPath('')
    setEmptyFolders(new Set())
    setAddingFile(false)
    setAddingFolder(false)
    setExpandedFile(null)
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

  async function handleDownload() {
    if (!skill) return
    const zip = new JSZip()
    const root = zip.folder(skill.name)!
    for (const file of files) {
      root.file(file.name, file.content)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skill.name}.zip`
    a.click()
    URL.revokeObjectURL(url)
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
          className="relative shrink-0 overflow-hidden px-4 pb-4 pt-5 sm:px-6"
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

        </div>

        {/* ── Body (single scroll) ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">

            {/* ── Metadata ── */}
            {mode === 'view' ? (
              <>
                {skill.description && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Descrição</span>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{skill.description}</p>
                  </div>
                )}
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Descrição <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
                  </label>
                  <textarea rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} className={inputCn + ' resize-none'} />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoria</label>
                    <CategorySelect value={form.category} onChange={(v) => setField('category', v)} dropdownDirection="up" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['draft', 'active'] as SkillStatus[]).map((s) => (
                        <label key={s} className={cn(
                          'flex cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors',
                          form.status === s
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-950 dark:text-primary-300'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                        )}>
                          <input type="radio" name="edit-status" value={s} checked={form.status === s} onChange={() => setField('status', s)} className="sr-only" />
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', s === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                          {s === 'active' ? 'Ativa' : 'Rascunho'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Files section ── */}
            <div className="space-y-2 pt-1">
              {/* Section header */}
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Arquivos</span>
                {files.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {files.length}
                  </span>
                )}
              </div>

              {isEditing ? (
                /* ── Edit mode: directory browser ── */
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {/* Nav bar */}
                  <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                    {editPath && (
                      <button
                        type="button"
                        onClick={() => navigateEditDir(editPath.split('/').slice(0, -1).join('/'))}
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {/* Breadcrumb */}
                    <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => navigateEditDir('')}
                        className={cn(
                          'min-w-0 text-primary-600 hover:underline dark:text-primary-400',
                          editPath ? 'max-w-[8rem] shrink-0 truncate' : 'truncate',
                        )}
                      >
                        {form.name || 'skill'}
                      </button>
                      {editPath.split('/').filter(Boolean).map((part, i, arr) => {
                        const crumbPath = arr.slice(0, i + 1).join('/')
                        const isLast = i === arr.length - 1
                        return (
                          <span key={crumbPath} className="flex min-w-0 shrink-0 items-center gap-0.5">
                            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                            <button
                              type="button"
                              onClick={() => navigateEditDir(crumbPath)}
                              className={cn(
                                'min-w-0 truncate',
                                isLast
                                  ? 'max-w-[10rem] font-semibold text-slate-700 dark:text-slate-200'
                                  : 'max-w-[6rem] text-primary-600 hover:underline dark:text-primary-400',
                              )}
                            >
                              {part}
                            </button>
                          </span>
                        )
                      })}
                    </div>
                    {/* Add buttons */}
                    {!addingFile && !addingFolder && (
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAddingFile(true)}
                          className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:border-primary-400 hover:text-primary-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-primary-600 dark:hover:text-primary-400"
                        >
                          <Plus className="h-3 w-3" /> Arquivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingFolder(true)}
                          className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-600 dark:hover:text-amber-400"
                        >
                          <Plus className="h-3 w-3" /> Pasta
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Directory listing */}
                  <div>
                    {listDirectory(files, editPath, emptyFolders).map((item) => (
                      item.kind === 'folder' ? (
                        <div
                          key={item.name}
                          onClick={() => navigateEditDir(editPath ? `${editPath}/${item.name}` : item.name)}
                          className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
                          <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{item.name}/</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </div>
                      ) : (
                        <div key={item.name} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <FileRow
                            file={item.file}
                            label={item.name}
                            expanded={expandedFile === item.file.id}
                            editing
                            onToggle={() => setExpandedFile(expandedFile === item.file.id ? null : item.file.id)}
                            onContentChange={(c) => updateFileContent(item.file.id, c)}
                            onRemove={() => removeFile(item.file.id)}
                          />
                        </div>
                      )
                    ))}

                    {listDirectory(files, editPath, emptyFolders).length === 0 && !addingFile && !addingFolder && (
                      <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">Pasta vazia</p>
                        <button type="button" onClick={() => setAddingFile(true)} className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
                          Adicionar arquivo
                        </button>
                      </div>
                    )}

                    {/* Add file input */}
                    {addingFile && (
                      <div className="flex items-center gap-2 border-b border-primary-200 bg-primary-50/60 px-4 py-2.5 last:border-0 dark:border-primary-800 dark:bg-primary-950/30">
                        <FileText className="h-4 w-4 shrink-0 text-primary-400" />
                        <input
                          ref={newFileRef}
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addFile() }
                            if (e.key === 'Escape') { setAddingFile(false); setNewFileName('') }
                          }}
                          placeholder={editPath ? 'nome-do-arquivo.md' : 'ex: references/examples.md'}
                          className="flex-1 bg-transparent font-mono text-xs text-slate-700 placeholder-slate-400 focus:outline-none dark:text-slate-300"
                        />
                        <button onClick={addFile} className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">Criar</button>
                        <button onClick={() => { setAddingFile(false); setNewFileName('') }} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    )}

                    {/* Add folder input */}
                    {addingFolder && (
                      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50/60 px-4 py-2.5 last:border-0 dark:border-amber-800 dark:bg-amber-950/30">
                        <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
                        <input
                          ref={newFolderRef}
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addFolder() }
                            if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName('') }
                          }}
                          placeholder="nome-da-pasta"
                          className="flex-1 bg-transparent font-mono text-xs text-slate-700 placeholder-slate-400 focus:outline-none dark:text-slate-300"
                        />
                        <button onClick={addFolder} className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">Criar</button>
                        <button onClick={() => { setAddingFolder(false); setNewFolderName('') }} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── View mode: tree ── */
                <div className="space-y-1.5">
                  {root.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      expanded={expandedFile === file.id}
                      editing={false}
                      onToggle={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                      onContentChange={(c) => updateFileContent(file.id, c)}
                      onRemove={() => removeFile(file.id)}
                    />
                  ))}
                  {Object.entries(folders).map(([folder, folderFiles]) => (
                    <div key={folder} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setExpandedFolders((prev) => {
                          const next = new Set(prev); next.has(folder) ? next.delete(folder) : next.add(folder); return next
                        })}
                        className="flex w-full cursor-pointer items-center gap-2 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        {expandedFolders.has(folder) ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="min-w-0 flex-1 truncate font-medium">{folder}/</span>
                        <span className="shrink-0 text-slate-400">{folderFiles.length}</span>
                      </button>
                      {expandedFolders.has(folder) && (
                        <div className="divide-y divide-slate-100 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                          {folderFiles.map((file) => (
                            <FileRow
                              key={file.id}
                              file={file}
                              label={file.name.slice(folder.length + 1)}
                              expanded={expandedFile === file.id}
                              editing={false}
                              onToggle={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                              onContentChange={(c) => updateFileContent(file.id, c)}
                              onRemove={() => removeFile(file.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="py-2 text-xs text-slate-400 dark:text-slate-500">Nenhum arquivo</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
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
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMode('edit')}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            </div>
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
  const [copied, setCopied] = useState(false)
  const displayName = label ?? file.name
  const isSkillMd = file.name === 'SKILL.md'

  function handleCopy() {
    navigator.clipboard.writeText(file.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      expanded
        ? 'border-primary-200 bg-primary-50/40 dark:border-primary-900/60 dark:bg-primary-950/20'
        : 'border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/70',
    )}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left min-w-0">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary-400" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          }
          <FileText className={cn('h-4 w-4 shrink-0', isSkillMd ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400')} />
          <span className={cn('min-w-0 truncate text-xs font-medium', isSkillMd ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300')}>
            {displayName}
          </span>
          {isSkillMd && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              principal
            </span>
          )}
        </button>
        {expanded && !editing && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy() }}
            className={cn(
              'flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors',
              copied
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:hover:text-slate-300',
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        )}
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
