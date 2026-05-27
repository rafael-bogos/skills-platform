'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const inputCn = cn(
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
  'text-slate-900 placeholder-slate-400 outline-none transition-colors',
  'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500',
  'dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
)

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CreateOrgForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) setSlug(toSlug(value))
  }

  function handleSlugChange(value: string) {
    setSlug(toSlug(value))
    setSlugEdited(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !slug.trim()) return
    setLoading(true)
    try {
      const result = await authClient.organization.create({ name: name.trim(), slug })
      if (result?.error) {
        setError(result.error.message ?? 'Erro ao criar organização.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Nova organização
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crie um espaço compartilhado para sua equipe
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nome da organização
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="Minha Empresa"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputCn}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Identificador (slug)
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <span className="select-none border-r border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                  org/
                </span>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="minha-empresa"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none dark:text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Apenas letras minúsculas, números e hífens.
              </p>
            </div>

            <Button type="submit" size="md" disabled={loading || !name || !slug} className="mt-1 w-full justify-center">
              {loading ? 'Criando...' : 'Criar organização'}
            </Button>
          </form>
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
        </div>
      </div>
    </div>
  )
}
