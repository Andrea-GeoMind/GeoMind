import { CHANTIER_COPY, fillCopy } from '@/lib/chantiers/copy'
import { LogoMark } from '@/components/logo'

export type LinkStateKind = keyof typeof CHANTIER_COPY.linkStates

type Props = {
  state: LinkStateKind
  contact: string
  /** Date déjà formatée (lien expiré) */
  date?: string
}

/** Page affichée quand le lien ne donne pas accès à l'espace. */
export default function LinkState({ state, contact, date }: Props) {
  const { title, body } = CHANTIER_COPY.linkStates[state]
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <LogoMark size={28} />
        <span className="text-sm font-bold tracking-tight">
          GEO<span className="text-primary">MIND</span>
        </span>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        {fillCopy(date ? body : body.replace(' le [DATE]', ''), {
          '[CONTACT]': contact,
          '[DATE]': date ?? '',
        })}
      </p>
    </main>
  )
}
