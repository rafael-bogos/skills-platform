'use client'

import { useEffect, useRef, useState } from 'react'
import { Layers, Plus, X, Check, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GROUP_COLORS } from '@/types'
import type { GroupColor, SkillGroup } from '@/types'

interface GroupSelectProps {
  groups: SkillGroup[]
  value: string | null
  onChange: (groupId: string | null) => void
  onGroupCreated: (group: SkillGroup) => void
  disabled?: boolean
}

export function getGroupColor(color: string) {
  return GROUP_COLORS.find((c) => c.value === color) ?? GROUP_COLORS[0]
}

export default function GroupSelect({ groups, value, onChange, onGroupCreated, disabled }: GroupSelectProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<GroupColor>('slate')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 50)
  }, [creating])

  const selected = groups.find((g) => g.id === value) ?? null
  const selectedColor = selected ? getGroupColor(selected.color) : null

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (!res.ok) return
      const group: SkillGroup = await res.json()
      onGroupCreated(group)
      onChange(group.id)
      setCreating(false)
      setNewName('')
      setNewColor('slate')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500',
          'dark:bg-slate-800 dark:focus:ring-primary-950',
          open
            ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-950'
            : 'border-slate-200 dark:border-slate-700',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {selected ? (
          <>
            <span className={cn('h-2 w-2 shrink-0 rounded-full', selectedColor?.dot)} />
            <span className="flex-1 truncate text-left text-slate-900 dark:text-slate-100">{selected.name}</span>
          </>
        ) : (
          <>
            <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="flex-1 text-left text-slate-400 dark:text-slate-500">Sem grupo</span>
          </>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {/* No group option */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false) }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
              !value ? 'bg-slate-50 dark:bg-slate-800' : '',
            )}
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="flex-1 text-left text-slate-500 dark:text-slate-400">Sem grupo</span>
            {!value && <Check className="h-3.5 w-3.5 text-primary-500" />}
          </button>

          {groups.length > 0 && <div className="border-t border-slate-100 dark:border-slate-800" />}

          {/* Existing groups */}
          {groups.map((group) => {
            const gc = getGroupColor(group.color)
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => { onChange(group.id); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                  value === group.id ? 'bg-slate-50 dark:bg-slate-800' : '',
                )}
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', gc.dot)} />
                <span className="flex-1 truncate text-left text-slate-800 dark:text-slate-200">{group.name}</span>
                {value === group.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
              </button>
            )
          })}

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Create new */}
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo grupo
            </button>
          ) : (
            <div className="space-y-2.5 p-3">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreate() }
                  if (e.key === 'Escape') { setCreating(false); setNewName('') }
                }}
                placeholder="Nome do grupo…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-primary-950"
              />
              {/* Color picker */}
              <div className="flex flex-wrap gap-1.5">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setNewColor(c.value)}
                    className={cn(
                      'h-5 w-5 rounded-full transition-transform',
                      c.dot,
                      newColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110',
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving || !newName.trim()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewName(''); setNewColor('slate') }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear button when a group is selected */}
      {selected && !open && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null) }}
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
