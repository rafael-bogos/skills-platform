import type { Metadata } from 'next'
import { CreateOrgForm } from '@/components/organizations/CreateOrgForm'

export const metadata: Metadata = { title: 'Nova organização — Skills Platform' }

export default function NewOrganizationPage() {
  return <CreateOrgForm />
}
