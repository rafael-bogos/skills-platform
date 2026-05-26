'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, X, FileText, FolderOpen, ChevronRight, Plus, ArrowLeft, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import CategorySelect from '@/components/skills/CategorySelect'
import type { CreateSkillInput, SkillFile, SkillStatus } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────────

function emptyForm(): CreateSkillInput {
  return {
    name: '',
    description: '',
    category: '',
    status: 'draft',
    files: [{ id: crypto.randomUUID(), name: 'SKILL.md', content: '' }],
  }
}

type DirItem =
  | { kind: 'file'; name: string; file: SkillFile }
  | { kind: 'folder'; name: string }

function listDirectory(files: SkillFile[], dirPath: string, knownFolders: Set<string> = new Set()): DirItem[] {
  const prefix = dirPath ? `${dirPath}/` : ''
  const seen = new Map<string, DirItem>()

  // include explicitly-created empty folders that are direct children of dirPath
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
    if (slash === -1) {
      seen.set(rest, { kind: 'file', name: rest, file })
    } else {
      const folder = rest.slice(0, slash)
      if (!seen.has(folder)) seen.set(folder, { kind: 'folder', name: folder })
    }
  }
  return [...seen.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

type RepoView =
  | { mode: 'browse'; path: string }
  | { mode: 'edit'; file: SkillFile }

// ── component ────────────────────────────────────────────────────────────────

interface CreateSkillModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (skill: CreateSkillInput) => void
}

export default function CreateSkillModal({ open, onClose, onSubmit }: CreateSkillModalProps) {
  const [form, setForm] = useState<CreateSkillInput>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<'name', string>>>({})
  const [view, setView] = useState<RepoView>({ mode: 'browse', path: '' })
  const [emptyFolders, setEmptyFolders] = useState<Set<string>>(new Set())
  const [addingFile, setAddingFile] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const newFileRef = useRef<HTMLInputElement>(null)
  const newFolderRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setErrors({})
      setView({ mode: 'browse', path: '' })
      setEmptyFolders(new Set())
      setAddingFile(false)
      setNewFileName('')
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (addingFile) setTimeout(() => newFileRef.current?.focus(), 50)
  }, [addingFile])
  useEffect(() => {
    if (addingFolder) setTimeout(() => newFolderRef.current?.focus(), 50)
  }, [addingFolder])

  function setMeta(key: 'name' | 'description' | 'category' | 'status', value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'name') setErrors((prev) => ({ ...prev, name: undefined }))
  }

  function updateFileContent(id: string, content: string) {
    setForm((prev) => ({ ...prev, files: prev.files.map((f) => (f.id === id ? { ...f, content } : f)) }))
    setView((prev) => {
      if (prev.mode === 'edit' && prev.file.id === id) return { ...prev, file: { ...prev.file, content } }
      return prev
    })
  }

  function removeFile(id: string) {
    setForm((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }))
    if (view.mode === 'edit' && view.file.id === id) navigateBack()
  }

  function navigateBack() {
    if (view.mode === 'edit') {
      const parent = view.file.name.split('/').slice(0, -1).join('/')
      setView({ mode: 'browse', path: parent })
    } else if (view.mode === 'browse' && view.path) {
      const parent = view.path.split('/').slice(0, -1).join('/')
      setView({ mode: 'browse', path: parent })
    }
    setAddingFile(false)
    setNewFileName('')
    setAddingFolder(false)
    setNewFolderName('')
  }

  function openFile(file: SkillFile) {
    setAddingFile(false)
    setView({ mode: 'edit', file })
  }

  function openFolder(folderPath: string) {
    setAddingFile(false)
    setView({ mode: 'browse', path: folderPath })
  }

  function addFile() {
    const rawName = newFileName.trim()
    if (!rawName) return
    const dirPath = view.mode === 'browse' ? view.path : ''
    const fullName = dirPath ? `${dirPath}/${rawName}` : rawName
    // impede duplicidade de nomes (arquivo ou pasta)
    const exists = form.files.some(f => f.name === fullName) || form.files.some(f => f.name.startsWith(fullName + '/'))
    if (exists) return
    const file: SkillFile = { id: crypto.randomUUID(), name: fullName, content: '' }
    setForm((prev) => ({ ...prev, files: [...prev.files, file] }))
    setNewFileName('')
    setAddingFile(false)
    setView({ mode: 'edit', file })
  }

  function addFolder() {
    const rawName = newFolderName.trim()
    if (!rawName) return
    if (rawName.includes('/')) return
    const dirPath = view.mode === 'browse' ? view.path : ''
    const fullName = dirPath ? `${dirPath}/${rawName}` : rawName
    const alreadyKnown = emptyFolders.has(fullName)
    const exists = alreadyKnown || form.files.some(f => f.name === fullName || f.name.startsWith(fullName + '/'))
    if (exists) return
    setEmptyFolders((prev) => new Set([...prev, fullName]))
    setAddingFolder(false)
    setNewFolderName('')
    setView({ mode: 'browse', path: fullName })
  }

  function removeFolder(folderPath: string) {
    const hasFiles = form.files.some(f => f.name.startsWith(folderPath + '/'))
    if (hasFiles) return
    setEmptyFolders((prev) => { const next = new Set(prev); next.delete(folderPath); return next })
    if (view.mode === 'browse' && view.path === folderPath) navigateBack()
    if (view.mode === 'edit' && view.file.name.startsWith(folderPath + '/')) navigateBack()
  }

  function validate() {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Nome é obrigatório'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  if (!open) return null

  const repoName = form.name.trim() || 'skill-name'
  const canGoBack = view.mode === 'edit' || (view.mode === 'browse' && !!view.path)
  const currentFile = view.mode === 'edit' ? view.file : null
  const dirPath = view.mode === 'browse' ? view.path : view.file.name.split('/').slice(0, -1).join('/')
  const crumbs = dirPath ? dirPath.split('/') : []
  const items = view.mode === 'browse' ? listDirectory(form.files, view.path, emptyFolders) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* ── Modal header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950">
              <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 id="modal-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Nova Skill
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">

            {/* ── Metadata ── */}
            <div className="space-y-4 px-6 py-5">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => setMeta('name', e.target.value)}
                  placeholder="ex: frontend-design, code-review"
                  className={inputCn(!!errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Descrição{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setMeta('description', e.target.value)}
                  placeholder="ex: Use esta skill sempre que o usuário pedir para criar componentes React..."
                  className={inputCn(false) + ' resize-none'}
                />
              </div>

              {/* Categoria + Status */}
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoria</label>
                  <CategorySelect value={form.category} onChange={(v) => setMeta('category', v)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['draft', 'active'] as SkillStatus[]).map((s) => (
                      <label
                        key={s}
                        className={cn(
                          'flex cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors',
                          form.status === s
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-950 dark:text-primary-300'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                        )}
                      >
                        <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setMeta('status', s)} className="sr-only" />
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', s === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                        {s === 'active' ? 'Ativa' : 'Rascunho'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Repository explorer ── */}
            <div className="border-t border-slate-200 dark:border-slate-700">

              {/* Repo nav bar — breadcrumb + actions */}
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                {canGoBack && (
                  <button
                    type="button"
                    onClick={navigateBack}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Breadcrumb */}
                <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => { setAddingFile(false); setView({ mode: 'browse', path: '' }) }}
                    className={cn(
                      'min-w-0 text-primary-600 hover:underline dark:text-primary-400',
                      crumbs.length === 0 && !currentFile ? 'truncate' : 'shrink-0 max-w-[8rem] truncate',
                    )}
                  >
                    {repoName}
                  </button>
                  {crumbs.map((part, i) => {
                    const crumbPath = crumbs.slice(0, i + 1).join('/')
                    const isLast = i === crumbs.length - 1 && !currentFile
                    return (
                      <span key={crumbPath} className="flex min-w-0 shrink-0 items-center gap-0.5">
                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => { setAddingFile(false); setView({ mode: 'browse', path: crumbPath }) }}
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
                  {currentFile && (
                    <span className="flex min-w-0 shrink items-center gap-0.5">
                      <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200">
                        {currentFile.name.split('/').pop()}
                      </span>
                    </span>
                  )}
                </div>

                {/* Add file/folder buttons (browse mode only) */}
                {view.mode === 'browse' && !addingFile && !addingFolder && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingFile(true)}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-primary-600 dark:hover:text-primary-400"
                    >
                      <Plus className="h-3 w-3" />
                      Add file
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingFolder(true)}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-600 dark:hover:text-amber-400"
                    >
                      <Plus className="h-3 w-3" />
                      Add folder
                    </button>
                  </div>
                )}
              </div>

              {/* ── Directory listing ── */}
              {view.mode === 'browse' && (
                <div className="min-h-[160px]">
                  {/* Back row when inside a subfolder */}
                  {view.path && (
                    <div
                      onClick={navigateBack}
                      className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30"
                    >
                      <FolderOpen className="h-4 w-4 text-amber-400" />
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">..</span>
                    </div>
                  )}

                  {/* Items */}
                  {items.map((item) => (
                    <div
                      key={item.name}
                      onClick={() => item.kind === 'folder'
                        ? openFolder(view.path ? `${view.path}/${item.name}` : item.name)
                        : openFile(item.file)
                      }
                      className="group flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30"
                    >
                      {item.kind === 'folder' ? (
                        <>
                          <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
                          <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                            {item.name}/
                          </span>
                          {(() => {
                            const folderPath = view.path ? `${view.path}/${item.name}` : item.name
                            const isEmpty = !form.files.some(f => f.name.startsWith(folderPath + '/'))
                            return isEmpty ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFolder(folderPath) }}
                                className="shrink-0 rounded p-0.5 text-transparent transition-colors hover:text-red-500 group-hover:text-slate-300 dark:group-hover:text-slate-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null
                          })()}
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </>
                      ) : (
                        <>
                          <FileText className={cn(
                            'h-4 w-4 shrink-0',
                            item.file.name === 'SKILL.md' ? 'text-primary-500' : 'text-slate-400',
                          )} />
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate font-mono text-xs',
                              item.file.name === 'SKILL.md'
                                ? 'font-semibold text-slate-800 dark:text-slate-200'
                                : 'text-slate-700 dark:text-slate-300',
                            )}
                          >
                            {item.name}
                          </span>
                          {item.file.name === 'SKILL.md' && (
                            <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                              principal
                            </span>
                          )}
                          {item.file.content && item.file.name !== 'SKILL.md' && (
                            <span className="shrink-0 text-xs text-slate-300 dark:text-slate-600">···</span>
                          )}
                          {item.file.name !== 'SKILL.md' && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(item.file.id) }}
                              className="shrink-0 rounded p-0.5 text-transparent transition-colors hover:text-red-500 group-hover:text-slate-300 dark:group-hover:text-slate-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {/* Empty state */}
                  {items.length === 0 && !addingFile && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Pasta vazia</p>
                      <button
                        type="button"
                        onClick={() => setAddingFile(true)}
                        className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Adicionar arquivo
                      </button>
                    </div>
                  )}
                  {/* Inline add-file input */}
                  {addingFile && (
                    <div className="flex items-center gap-2 border-b border-primary-200 bg-primary-50/60 px-4 py-2.5 dark:border-primary-800 dark:bg-primary-950/30">
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
                        placeholder={view.path ? 'nome-do-arquivo.md' : 'ex: references/examples.md'}
                        className="flex-1 bg-transparent font-mono text-xs text-slate-700 placeholder-slate-400 focus:outline-none dark:text-slate-300"
                      />
                      <button type="button" onClick={addFile} className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingFile(false); setNewFileName('') }}
                        className="shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {/* Inline add-folder input */}
                  {addingFolder && (
                    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50/60 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
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
                        placeholder={view.path ? 'nome-da-pasta' : 'ex: references'}
                        className="flex-1 bg-transparent font-mono text-xs text-slate-700 placeholder-slate-400 focus:outline-none dark:text-slate-300"
                      />
                      <button type="button" onClick={addFolder} className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingFolder(false); setNewFolderName('') }}
                        className="shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── File editor ── */}
              {view.mode === 'edit' && (
                <div className="px-4 py-4">
                  <textarea
                    rows={14}
                    value={view.file.content}
                    onChange={(e) => updateFileContent(view.file.id, e.target.value)}
                    placeholder="Conteúdo em markdown..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-800 placeholder-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:ring-primary-950"
                  />
                  {view.file.name !== 'SKILL.md' && (
                    <button
                      type="button"
                      onClick={() => removeFile(view.file.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover arquivo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Criar Skill
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function inputCn(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
    'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
    'dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500',
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200 dark:border-red-700'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-100 dark:border-slate-700 dark:focus:border-primary-500 dark:focus:ring-primary-950',
  )
}
