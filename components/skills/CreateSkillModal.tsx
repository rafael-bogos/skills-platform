'use client'

import { useEffect, useRef, useState } from 'react' // useRef: nameRef
import { Sparkles, X, FileText, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import CategorySelect from '@/components/skills/CategorySelect'
import type { CreateSkillInput, SkillStatus } from '@/types'

const empty: CreateSkillInput = {
  name: '',
  description: '',
  category: '',
  status: 'draft',
  skillContent: '',
}

interface CreateSkillModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (skill: CreateSkillInput) => void
}

export default function CreateSkillModal({ open, onClose, onSubmit }: CreateSkillModalProps) {
  const [form, setForm] = useState<CreateSkillInput>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSkillInput, string>>>({})
  const [contentOpen, setContentOpen] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setForm(empty)
      setErrors({})
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  function set<K extends keyof CreateSkillInput>(key: K, value: CreateSkillInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Nome é obrigatório'
    if (!form.description.trim()) next.description = 'Descreva quando o Claude deve usar esta skill'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        {/* Header */}
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
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="ex: frontend-design, code-review"
                className={inputCn(!!errors.name)}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Descrição — destaque */}
            <div
              className={cn(
                'space-y-2 rounded-xl border-2 p-4 transition-colors',
                errors.description
                  ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                  : 'border-primary-200 bg-primary-50/60 dark:border-primary-900 dark:bg-primary-950/30',
              )}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary-700 dark:text-primary-400">
                  Descrição <span className="text-red-400">*</span>
                </label>
                <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                  <Sparkles className="h-3 w-3" />
                  Gatilho do Claude
                </span>
              </div>
              <p className="text-xs text-primary-600/70 dark:text-primary-400/60">
                Diga ao Claude <strong>quando</strong> usar esta skill. Seja específico — esta frase é o que ele lê para decidir.
              </p>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="ex: Use esta skill sempre que o usuário pedir para criar componentes React, páginas web, estilizar interfaces ou quando mencionar design de UI..."
                className={cn(
                  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500',
                  errors.description
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200 dark:border-red-700'
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-100 dark:border-primary-800 dark:focus:ring-primary-950',
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Conteúdo SKILL.md — colapsável */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setContentOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  Conteúdo do SKILL.md
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-400 dark:bg-slate-800">
                    opcional
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-slate-400 transition-transform',
                    contentOpen && 'rotate-180',
                  )}
                />
              </button>
              {contentOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                  <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
                    Instruções detalhadas que o Claude seguirá. Se vazio, um template padrão será gerado.
                  </p>
                  <textarea
                    rows={8}
                    value={form.skillContent ?? ''}
                    onChange={(e) => set('skillContent', e.target.value)}
                    placeholder={`# ${form.name || 'skill-name'}\n\n## Como usar\n\nDescreva aqui como o Claude deve executar esta skill.\n\n## Exemplos\n\nAdicione exemplos de uso.`}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 placeholder-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:ring-primary-950"
                  />
                </div>
              )}
            </div>

            {/* Categoria + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Categoria
                </label>
                <CategorySelect value={form.category} onChange={(v) => set('category', v)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Status
                </label>
                <div className="flex gap-2">
                  {(['draft', 'active'] as SkillStatus[]).map((s) => (
                    <label
                      key={s}
                      className={cn(
                        'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors',
                        form.status === s
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-950 dark:text-primary-300'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={form.status === s}
                        onChange={() => set('status', s)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          s === 'active' ? 'bg-emerald-500' : 'bg-slate-400',
                        )}
                      />
                      {s === 'active' ? 'Ativa' : 'Rascunho'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
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

