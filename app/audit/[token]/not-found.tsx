import { AUDIT_CONTACT } from '@/lib/prospect-audit/copy'

export default function AuditNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">Cet audit n&apos;est pas disponible</h1>
      <p className="mt-3 text-muted-foreground">
        Le lien est incomplet, a expiré (un audit reste en ligne 60 jours) ou a été essayé trop
        souvent. Pour en obtenir un nouveau, contactez {AUDIT_CONTACT.name} au{' '}
        <a className="font-semibold text-primary underline" href={AUDIT_CONTACT.phoneHref}>
          {AUDIT_CONTACT.phone}
        </a>{' '}
        ou à{' '}
        <a className="font-semibold text-primary underline" href={`mailto:${AUDIT_CONTACT.email}`}>
          {AUDIT_CONTACT.email}
        </a>
        .
      </p>
    </main>
  )
}
