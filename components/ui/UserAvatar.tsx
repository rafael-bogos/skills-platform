'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Building2, LogOut } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

export function UserAvatar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  if (!session?.user) return null

  const initials = session.user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-600 text-xs font-semibold text-white ring-2 ring-white transition-all hover:ring-primary-200 dark:ring-slate-900 dark:hover:ring-primary-900"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {session.user.name}
            </div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
              {session.user.email}
            </div>
          </div>

          <div className="p-1">
            <button
              onClick={() => {
                setOpen(false)
                router.push('/organizations/new')
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
                'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700',
              )}
            >
              <Building2 className="h-4 w-4 text-slate-400" />
              Criar organização
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

            <button
              onClick={handleSignOut}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
                'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
              )}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
