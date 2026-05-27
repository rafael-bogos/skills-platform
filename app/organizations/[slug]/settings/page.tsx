import type { Metadata } from 'next'
import { OrgSettings } from '@/components/organizations/OrgSettings'

export const metadata: Metadata = { title: 'Configurações da organização — Skills Platform' }

export default async function OrgSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <OrgSettings slug={slug} />
}
