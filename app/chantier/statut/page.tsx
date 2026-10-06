import { z } from 'zod'
import LinkState from '@/components/features/chantier-space/link-state'
import { DEFAULT_GEOMIND_ADDRESS } from '@/lib/chantiers/copy'
import { formatChantierDate } from '@/lib/chantiers/status'

const ReasonSchema = z.enum(['unknown', 'expired', 'revoked', 'closed', 'rate_limited'])
const STATE = {
  unknown: 'unknown',
  expired: 'expired',
  revoked: 'revoked',
  closed: 'closed',
  rate_limited: 'rateLimited',
} as const

/** Lien refusé à l'entrée (route /chantier/[token]). Rien de secret ici. */
export default async function ChantierStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ raison?: string; date?: string }>
}) {
  const { raison, date } = await searchParams
  const reason = ReasonSchema.catch('unknown').parse(raison)
  const day = z.iso.date().safeParse(date)
  return (
    <LinkState
      state={STATE[reason]}
      contact={DEFAULT_GEOMIND_ADDRESS}
      date={day.success ? formatChantierDate(new Date(`${day.data}T12:00:00Z`)) : undefined}
    />
  )
}
