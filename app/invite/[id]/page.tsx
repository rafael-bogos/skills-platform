import type { Metadata } from 'next'
import { AcceptInvite } from '@/components/organizations/AcceptInvite'

export const metadata: Metadata = { title: 'Convite — Skills Platform' }

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ autoaccept?: string }>
}) {
  const { id } = await params
  const { autoaccept } = await searchParams
  return <AcceptInvite token={id} autoAccept={autoaccept === '1'} />
}
