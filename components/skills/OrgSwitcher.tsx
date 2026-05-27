'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { Building2, Check, ChevronDown, User, Settings } from 'lucide-react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface OrgSwitcherProps {
  onSwitch?: () => void
}

export function OrgSwitcher({ onSwitch }: OrgSwitcherProps) {
  const { data: orgs } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function switchTo(orgId: string | null) {
    if (orgId) {
      await authClient.organization.setActive({ organizationId: orgId })
    } else {
      await authClient.organization.setActive({ organizationId: null as unknown as string })
    }
    setOpen(false)
    onSwitch?.()
  }

  if (!orgs?.length) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium',
          'text-slate-700 transition-colors hover:bg-slate-50',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
        )}
      >
        {activeOrg ? (
          <Building2 className="h-3.5 w-3.5 text-primary-500" />
        ) : (
          <User className="h-3.5 w-3.5 text-slate-400" />
        )}
        <span className="max-w-[120px] truncate">
          {activeOrg?.name ?? 'Pessoal'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="p-1">
            <button
              onClick={() => switchTo(null)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span className="flex-1 text-left">Pessoal</span>
              {!activeOrg && <Check className="h-3.5 w-3.5 text-primary-500" />}
            </button>

            {orgs.length > 0 && (
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
            )}

            {orgs.map((org) => (
              <div key={org.id} className="flex items-center gap-1">
                <button
                  onClick={() => switchTo(org.id)}
                  className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {org.logo ? (
                    <Image unoptimized src={org.logo} alt={org.name} width={16} height={16} className="h-4 w-4 rounded" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary-400" />
                  )}
                  <span className="flex-1 truncate text-left">{org.name}</span>
                  {activeOrg?.id === org.id && <Check className="h-3.5 w-3.5 text-primary-500" />}
                </button>
                <Link
                  href={`/organizations/${org.slug}/settings`}
                  onClick={() => setOpen(false)}
                  title="Configurações"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
