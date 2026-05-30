'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Layers, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { GROUP_COLORS } from '@/types'
import type { GroupColor, SkillGroup } from '@/types'

interface CreateGroupModalProps {
  open: boolean
  onClose: () => void
  onCreated: (group: SkillGroup) => void
}

export default function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<GroupColor>('slate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setColor('slate')
      setLoading(false)
      setError('')
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), color }),
      })
      if (!res.ok) { setError('Erro ao criar grupo'); return }
      onCreated(await res.json())
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950">
              <Layers className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Novo Grupo</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Nome <span className="text-red-400">*</span>
              </label>
              <span className={cn('text-xs tabular-nums', name.length >= 50 ? 'text-red-400' : 'text-slate-400 dark:text-slate-500')}>
                {name.length}/50
              </span>
            </div>
            <input
              ref={nameRef}
              type="text"
              value={name}
              maxLength={50}
              onChange={(e) => { setName(e.target.value.slice(0, 50)); setError('') }}
              placeholder="ex: Integração Stripe, Responsivo…"
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2',
                'dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500',
                error
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200 dark:border-red-700'
                  : 'border-slate-200 focus:border-primary-500 focus:ring-primary-100 dark:border-slate-700 dark:focus:ring-primary-950',
              )}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Descrição <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste grupo…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-primary-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Cor</label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-6 w-6 rounded-full transition-all',
                    c.dot,
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                      : 'opacity-60 hover:opacity-100 hover:scale-110',
                  )}
                />
              ))}
            </div>
            {/* Preview */}
            {name.trim() && (
              <div className="mt-1">
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  GROUP_COLORS.find(c => c.value === color)?.badge,
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', GROUP_COLORS.find(c => c.value === color)?.dot)} />
                  {name.trim()}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? 'Criando…' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
