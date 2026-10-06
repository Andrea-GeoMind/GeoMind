import { requireChantierAccess, logChantierAccess } from '@/lib/chantiers/access'
import { geomindAddressFor } from '@/lib/chantiers/copy'
import { formatChantierDate } from '@/lib/chantiers/status'
import { loadChantierState } from '@/lib/db/queries/chantier-answers'
import { listFilesForClient } from '@/lib/chantiers/file-service'
import LinkState from '@/components/features/chantier-space/link-state'
import ChantierSpace from '@/components/features/chantier-space/chantier-space'

export const dynamic = 'force-dynamic'
// Plafond des Server Actions de la page (dépôt de fichiers compris) : une
// opération bloquée échoue au lieu de laisser le client attendre sans fin.
export const maxDuration = 60

const STATE = {
  unknown: 'unknown',
  expired: 'expired',
  revoked: 'revoked',
  closed: 'closed',
  rate_limited: 'rateLimited',
} as const

export default async function ChantierSpacePage() {
  const access = await requireChantierAccess('view')
  if (!access.ok) {
    const expiresAt = access.chantier?.tokenExpiresAt
    return (
      <LinkState
        state={STATE[access.state]}
        contact={geomindAddressFor(access.chantier?.options ?? {})}
        date={access.state === 'expired' && expiresAt ? formatChantierDate(expiresAt) : undefined}
      />
    )
  }

  const { chantier, establishments } = access
  await logChantierAccess(chantier.id, 'view', access.ipTruncated)
  const [{ answers }, files] = await Promise.all([
    loadChantierState(chantier.id),
    listFilesForClient(chantier.id),
  ])

  return (
    <ChantierSpace
      clientName={chantier.clientName}
      geomindAddress={geomindAddressFor(chantier.options)}
      expiresAt={chantier.tokenExpiresAt?.toISOString() ?? null}
      submittedAt={chantier.submittedAt?.toISOString() ?? null}
      chantierOptions={chantier.options}
      establishments={establishments.map((e) => ({
        id: e.id,
        name: e.name,
        kind: e.kind,
        options: e.options,
      }))}
      initialAnswers={answers}
      files={files}
    />
  )
}
