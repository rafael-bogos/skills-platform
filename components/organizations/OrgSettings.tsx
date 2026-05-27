'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Trash2, Crown, Shield, User, ChevronDown, Check, Copy, CheckCheck, Link2 } from 'lucide-react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Role = 'owner' | 'admin' | 'member'

const ROLE_LABELS: Record<Role, string> = { owner: 'Dono', admin: 'Admin', member: 'Membro' }
const ROLE_ICONS: Record<Role, React.ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5 text-amber-500" />,
  admin: <Shield className="h-3.5 w-3.5 text-blue-500" />,
  member: <User className="h-3.5 w-3.5 text-slate-400" />,
}

const inputCn = cn(
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
  'text-slate-900 placeholder-slate-400 outline-none transition-colors',
  'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500',
)

interface Member {
  id: string
  role: string
  user: { id: string; name: string; email: string; image?: string | null }
}

function RoleSelector({
  memberId,
  currentRole,
  onUpdate,
  disabled,
}: {
  memberId: string
  currentRole: Role
  onUpdate: (memberId: string, role: Role) => Promise<void>
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function select(role: Role) {
    if (role === currentRole) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    await onUpdate(memberId, role)
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => !loading && setOpen((v) => !v)}
        disabled={disabled || loading}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
          !disabled && 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700',
          loading && 'opacity-50',
        )}
      >
        {ROLE_ICONS[currentRole]}
        {ROLE_LABELS[currentRole]}
        {!disabled && <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="p-1">
              {(['admin', 'member'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => select(role)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {ROLE_ICONS[role]}
                  {ROLE_LABELS[role]}
                  {currentRole === role && <Check className="ml-auto h-3.5 w-3.5 text-primary-500" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function OrgSettings({ slug }: { slug: string }) {
  const { data: session } = authClient.useSession()

  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteRole, setInviteRole] = useState<Role>('member')
  const [generating, setGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll() }, [slug])

  async function loadAll() {
    setLoading(true)
    const orgResult = await authClient.organization.getFullOrganization({
      query: { organizationSlug: slug },
    })
    if (orgResult?.data) {
      setOrgId(orgResult.data.id)
      setOrgName(orgResult.data.name)
      setMembers((orgResult.data.members ?? []) as Member[])
    }
    setLoading(false)
  }

  async function handleGenerateLink() {
    if (!orgId) return
    setGenerating(true)
    setGeneratedLink(null)
    try {
      const res = await fetch('/api/invite-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, role: inviteRole }),
      })
      if (res.ok) {
        const { token } = await res.json()
        setGeneratedLink(`${window.location.origin}/invite/${token}`)
      }
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleUpdateRole(memberId: string, role: Role) {
    const result = await authClient.organization.updateMemberRole({
      memberId,
      role,
      ...(orgId ? { organizationId: orgId } : {}),
    })
    if (!result?.error) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)))
    }
  }

  async function handleRemoveMember(memberId: string) {
    await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
      ...(orgId ? { organizationId: orgId } : {}),
    })
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const currentMember = members.find((m) => m.user.id === session?.user?.id)
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {orgName || slug}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie membros e convites
          </p>
        </div>

        {/* Link de convite (owner/admin) */}
        {canManage && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Link2 className="h-4 w-4 text-primary-500" />
              Convidar por link
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className={cn(inputCn, 'w-36')}
                >
                  <option value="member">Membro</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" onClick={handleGenerateLink} disabled={generating || !orgId}>
                  {generating ? 'Gerando...' : 'Gerar link'}
                </Button>
              </div>

              {generatedLink && (
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/40">
                  <p className="mb-2 text-xs font-medium text-green-700 dark:text-green-400">
                    Qualquer pessoa com este link pode entrar — válido por 7 dias:
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 truncate rounded border border-green-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-green-900 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <button
                      onClick={handleCopy}
                      className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40"
                    >
                      {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de membros */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Membros ({members.length})
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              Carregando...
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <User className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500">Nenhum membro encontrado</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => {
                const isMe = member.user.id === session?.user?.id
                const isOwner = member.role === 'owner'
                const canChange = canManage && !isOwner && !isMe

                return (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                          <span className="truncate">{member.user.name}</span>
                          {isMe && <span className="shrink-0 text-xs text-slate-400">(você)</span>}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {member.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <RoleSelector
                        memberId={member.id}
                        currentRole={member.role as Role}
                        onUpdate={handleUpdateRole}
                        disabled={!canChange}
                      />
                      {canChange && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          title="Remover membro"
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
