'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Pencil, Trash2, Check, Loader2, Plus, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { GROUP_COLORS } from '@/types'
import type { GroupColor, SkillGroup } from '@/types'

interface ManageGroupsModalProps {
  open: boolean
  onClose: () => void
  groups: SkillGroup[]
  skillCountByGroup: Record<string, number>
  onGroupUpdated: (group: SkillGroup) => void
  onGroupDeleted: (id: string) => void
  onGroupCreated: (group: SkillGroup) => void
}

export default function ManageGroupsModal({
  open, onClose, groups, skillCountByGroup, onGroupUpdated, onGroupDeleted, onGroupCreated,
}: ManageGroupsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState<GroupColor>('slate')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState<GroupColor>('slate')
  const [creatingLoading, setCreatingLoading] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open, onClose])

  useEffect(() => {
    if (!open) { setEditingId(null); setDeletingId(null); setCreating(false) }
  }, [open])

  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 50)
  }, [editingId])

  useEffect(() => {
    if (creating) setTimeout(() => newInputRef.current?.focus(), 50)
  }, [creating])

  function startEdit(g: SkillGroup) {
    setEditingId(g.id)
    setEditName(g.name)
    setEditDescription(g.description)
    setEditColor(g.color as GroupColor)
    setDeletingId(null)
  }

  async function handleSave(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim(), color: editColor }),
      })
      if (!res.ok) return
      onGroupUpdated(await res.json())
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (deletingId !== id) { setDeletingId(id); setEditingId(null); return }
    setSaving(true)
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' })
      onGroupDeleted(id)
      setDeletingId(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreatingLoading(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim(), color: newColor }),
      })
      if (!res.ok) return
      onGroupCreated(await res.json())
      setCreating(false)
      setNewName('')
      setNewDescription('')
      setNewColor('slate')
    } finally {
      setCreatingLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Gerenciar Grupos
              {groups.length > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {groups.length}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 && !creating && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Layers className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum grupo criado ainda.</p>
            </div>
          )}

          {groups.map((g) => {
            const gc = GROUP_COLORS.find((c) => c.value === g.color) ?? GROUP_COLORS[0]
            const count = skillCountByGroup[g.id] ?? 0
            const isEditing = editingId === g.id
            const isDeleting = deletingId === g.id

            return (
              <div
                key={g.id}
                className={cn(
                  'border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800',
                  isEditing && 'bg-slate-50 dark:bg-slate-800/40',
                )}
              >
                {isEditing ? (
                  /* Edit form */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        maxLength={50}
                        onChange={(e) => setEditName(e.target.value.slice(0, 50))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(g.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-primary-950"
                      />
                      <p className={cn('text-right text-xs tabular-nums', editName.length >= 50 ? 'text-red-400' : 'text-slate-400 dark:text-slate-500')}>
                        {editName.length}/50
                      </p>
                    </div>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descrição (opcional)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-primary-950"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {GROUP_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setEditColor(c.value)}
                          className={cn('h-5 w-5 rounded-full transition-all', c.dot, editColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110')}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(g.id)} disabled={saving || !editName.trim()}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={saving}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  /* View row */
                  <div className="flex items-center gap-3">
                    <span className={cn('h-3 w-3 shrink-0 rounded-full', gc.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{g.name}</p>
                      {g.description && (
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">{g.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {count} {count === 1 ? 'skill' : 'skills'}
                    </span>
                    <button
                      onClick={() => startEdit(g)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      onBlur={() => { if (deletingId === g.id) setDeletingId(null) }}
                      className={cn(
                        'shrink-0 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                        isDeleting
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30',
                      )}
                      title="Excluir"
                    >
                      {isDeleting ? 'Confirmar?' : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Inline create form */}
          {creating && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="space-y-3">
                <div className="space-y-1">
                  <input
                    ref={newInputRef}
                    type="text"
                    value={newName}
                    maxLength={50}
                    onChange={(e) => setNewName(e.target.value.slice(0, 50))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                    placeholder="Nome do grupo…"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-primary-950"
                  />
                  <p className={cn('text-right text-xs tabular-nums', newName.length >= 50 ? 'text-red-400' : 'text-slate-400 dark:text-slate-500')}>
                    {newName.length}/50
                  </p>
                </div>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-primary-950"
                />
                <div className="flex flex-wrap gap-1.5">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewColor(c.value)}
                      className={cn('h-5 w-5 rounded-full transition-all', c.dot, newColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110')}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate} disabled={creatingLoading || !newName.trim()}>
                    {creatingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Criar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName('') }} disabled={creatingLoading}>Cancelar</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          {!creating ? (
            <button
              onClick={() => { setCreating(true); setEditingId(null) }}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <Plus className="h-3.5 w-3.5" /> Novo grupo
            </button>
          ) : (
            <span />
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
