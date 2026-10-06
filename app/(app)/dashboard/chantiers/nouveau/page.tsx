import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { FIELD_CATALOG } from '@/lib/chantiers/fields'
import ChantierForm from '@/components/features/chantiers/chantier-form'

export const metadata: Metadata = {
  title: 'Nouveau chantier',
  robots: { index: false, follow: false },
}

export default async function NewChantierPage() {
  await requireAdmin()

  const extras = (scope: 'chantier' | 'establishment') =>
    FIELD_CATALOG.filter((f) => f.extra && f.scope === scope).map((f) => ({
      key: f.key,
      label: `${f.label} (${f.key})`,
    }))

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link
        href="/dashboard/chantiers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Chantiers
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Nouveau chantier</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Le chantier est créé en brouillon : le lien du client s’émet ensuite, depuis la liste.
      </p>
      <ChantierForm chantierExtras={extras('chantier')} establishmentExtras={extras('establishment')} />
    </div>
  )
}
