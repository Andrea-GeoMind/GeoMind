import { notFound } from 'next/navigation'
import { Check, Mail, Phone, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'
import { openAudit } from '@/lib/prospect-audit/access'
import {
  AUDIT_CONTACT,
  HOW_IT_WORKS,
  OFFER_TITLE,
  formatAuditDate,
  frenchSpacing,
  honestyNotice,
  offerItems,
  ordinal,
} from '@/lib/prospect-audit/copy'
import { hasOwnSite } from '@/lib/prospect-audit/issues'
import {
  citedInsteadForQuestion,
  comparisonRows,
  findCell,
  groupIssues,
  issueCountLabel,
  presenceSummary,
  scoreLabel,
  shortBusinessName,
} from '@/lib/prospect-audit/view'
import {
  ENGINE_LABELS,
  INTENT_LABELS,
  ISSUE_CATEGORY_LABELS,
  PROSPECT_ENGINES,
  type AnswerCell,
  type AuditDocument,
} from '@/lib/prospect-audit/types'

export const dynamic = 'force-dynamic'

/**
 * /audit/[token] — audit de visibilité d'un commerce, remis en main propre
 * (QR code de la feuille A4). Sans compte, jamais indexé, 60 jours.
 * Tout ce qui est affiché vient du document figé de l'audit : données
 * publiques du commerce et réponses des IA résumées.
 */
export default async function AuditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const access = await openAudit(token)
  if (!access.ok) notFound()
  const doc = access.document
  const p = doc.prospect
  const name = shortBusinessName(p.name)

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <Logo size={30} />
        <p className="text-right text-sm text-muted-foreground">
          Audit du {formatAuditDate(doc.createdAt)}
        </p>
      </header>

      <section className="pt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Audit de visibilité en ligne
        </p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{p.name}</h1>
        <p className="mt-1 text-muted-foreground">{p.address}</p>
      </section>

      <Scores doc={doc} />
      <AiPresence doc={doc} name={name} />
      <PlaceComparison doc={doc} name={name} />
      <Issues doc={doc} />
      <Solutions doc={doc} />
      <WeekPlan doc={doc} />
      <Offer doc={doc} />

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>{honestyNotice(doc.createdAt)}</p>
        <p className="mt-2">
          Fiche Google relevée le {formatAuditDate(`${p.placesCollectedAt}T12:00:00Z`)}. Lien valable
          jusqu&apos;au {formatAuditDate(doc.expiresAt)}.
        </p>
        <p className="mt-2">
          {AUDIT_CONTACT.name} · GeoMind · {AUDIT_CONTACT.phone} · {AUDIT_CONTACT.email} ·{' '}
          {AUDIT_CONTACT.site}
        </p>
      </footer>
    </main>
  )
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold sm:text-2xl">{children}</h2>
      {sub ? <p className="mt-1 text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function Scores({ doc }: { doc: AuditDocument }) {
  const { scores } = doc
  const noSite = !doc.site.analysed
  const tiles = [
    { label: 'Présence dans les IA', value: scores.authority, hint: 'part des réponses qui vous citent' },
    { label: 'Technique du site', value: scores.technical, hint: noSite ? 'pas de site analysé' : 'sur 100' },
    { label: 'Contenu du site', value: scores.content, hint: noSite ? 'pas de site analysé' : 'sur 100' },
  ]
  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="sm:w-44">
          <p className="text-sm font-semibold text-muted-foreground">Note globale</p>
          <p className="text-6xl font-extrabold leading-none text-foreground">
            {scores.global}
            <span className="text-2xl font-bold text-muted-foreground"> / 100</span>
          </p>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg bg-muted p-3">
              <p className="text-xs font-semibold leading-tight sm:text-sm">{t.label}</p>
              <p className="mt-1 text-2xl font-extrabold sm:text-3xl">{scoreLabel(t.value)}</p>
              <p className="text-xs leading-tight text-muted-foreground">{t.hint}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {noSite
          ? 'Sans site à vous, la note globale ne porte que sur votre présence dans les IA.'
          : 'La note globale est la moyenne des trois notes.'}
      </p>
    </section>
  )
}

function CellMark({ cell }: { cell: AnswerCell | null }) {
  if (!cell || cell.status === 'failed') {
    return <span className="text-sm text-muted-foreground">pas de réponse</span>
  }
  if (cell.cited) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[var(--score-good-700)]">
        <Check className="h-4 w-4" aria-hidden />
        cité{cell.position ? `, ${ordinal(cell.position)}` : ''}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-[var(--score-bad-600)]">
      <X className="h-4 w-4" aria-hidden />
      absent
    </span>
  )
}

function AiPresence({ doc, name }: { doc: AuditDocument; name: string }) {
  const summary = presenceSummary(doc.answers)
  return (
    <section className="mt-12">
      <SectionTitle
        sub={`${summary.cited} réponse${summary.cited > 1 ? 's' : ''} sur ${summary.answered} citent ${name}. Les questions sont celles qu'un client pose, sans jamais nommer votre commerce.`}
      >
        Votre présence dans les IA
      </SectionTitle>
      <ol className="space-y-3">
        {doc.questions.map((q, qi) => {
          const instead = citedInsteadForQuestion(doc.answers, qi)
          return (
            <li key={q.intent} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {INTENT_LABELS[q.intent]}
              </p>
              <p className="mt-0.5 font-semibold">«&nbsp;{frenchSpacing(q.text)}&nbsp;»</p>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {PROSPECT_ENGINES.map((engine) => (
                  <div key={engine} className="rounded-lg bg-muted px-2 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground">{ENGINE_LABELS[engine]}</dt>
                    <dd className="mt-0.5">
                      <CellMark cell={findCell(doc.answers, qi, engine)} />
                    </dd>
                  </div>
                ))}
              </dl>
              {instead.length > 0 ? (
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Cités à votre place : </span>
                  {instead.join(', ')}
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>
      {doc.citedInstead.length > 0 ? (
        <div className="mt-4 rounded-xl bg-muted p-4">
          <p className="font-semibold">Les plus cités à votre place, toutes questions confondues</p>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {doc.citedInstead.slice(0, 6).map((c) => (
              <li key={c.name}>
                {c.name}{' '}
                <span className="text-muted-foreground">
                  — {c.answers} réponse{c.answers > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function PlaceComparison({ doc, name }: { doc: AuditDocument; name: string }) {
  const p = doc.prospect
  const c = p.competitor
  if (!c) return null
  const rows = comparisonRows(p, c)
  const scope = c.scope ? `d'${c.scope}` : 'du même secteur'
  return (
    <section className="mt-12">
      <SectionTitle
        sub={`À côté de vous : le commerce ${scope} qui a le plus d'avis dans un rayon de 500 m, à ${c.distanceM} m.`}
      >
        Votre fiche Google face au concurrent le plus fort
      </SectionTitle>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-left text-sm sm:text-base">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[30%] p-3" />
              <th className="p-3 font-bold">
                {name}
                <span className="block text-xs font-normal text-muted-foreground">votre commerce</span>
              </th>
              <th className="p-3 font-bold">
                {shortBusinessName(c.name)}
                <span className="block text-xs font-normal text-muted-foreground">concurrent</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.label}
                className={cn('border-b border-border last:border-0', r.late && 'bg-[var(--score-bad-50)]')}
              >
                <th className={cn('p-3 font-semibold', r.late && 'text-[var(--score-bad-700)]')}>{r.label}</th>
                <td className={cn('p-3', r.late && 'font-bold text-[var(--score-bad-700)]')}>
                  {r.mine}
                  {r.mineNote ? <span className="block text-xs font-normal">{r.mineNote}</span> : null}
                  {r.late ? (
                    <span className="mt-1 block w-fit rounded border border-[var(--score-bad-600)] px-1.5 text-xs font-bold">
                      En retard
                    </span>
                  ) : null}
                </td>
                <td className="p-3">
                  {r.theirs}
                  {r.theirsNote ? (
                    <span className="block text-xs text-muted-foreground">{r.theirsNote}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Issues({ doc }: { doc: AuditDocument }) {
  const groups = groupIssues(doc.issues)
  return (
    <section className="mt-12">
      <SectionTitle sub="Chaque point découle d'un fait relevé : votre fiche Google, votre site, les réponses des IA.">
        {issueCountLabel(doc.issues.length)}
      </SectionTitle>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.category} className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-baseline justify-between gap-3 font-bold">
              {g.label}
              <span className="text-sm font-semibold text-muted-foreground">
                {g.issues.length} problème{g.issues.length > 1 ? 's' : ''}
              </span>
            </h3>
            <ul className="mt-2 space-y-2">
              {g.issues.map((i) => (
                <li key={i.key} className="border-l-2 border-[var(--score-bad-500)] pl-3">
                  <p className="font-semibold">{i.title}</p>
                  {i.detail ? <p className="text-sm text-muted-foreground">{i.detail}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function Solutions({ doc }: { doc: AuditDocument }) {
  if (doc.solutions.length === 0) return null
  return (
    <section className="mt-12">
      <SectionTitle>Les solutions</SectionTitle>
      <div className="space-y-3">
        {doc.solutions.map((s) => (
          <div key={s.category} className="rounded-xl bg-muted p-4">
            <h3 className="font-bold">{ISSUE_CATEGORY_LABELS[s.category]}</h3>
            <p className="mt-1">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function WeekPlan({ doc }: { doc: AuditDocument }) {
  return (
    <section className="mt-12">
      <SectionTitle sub="Une semaine, jour par jour, à partir de la liste ci-dessus.">Le plan d&apos;action sur une semaine</SectionTitle>
      <ol className="space-y-3">
        {doc.plan.map((d) => (
          <li key={d.day} className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              J{d.day}
            </span>
            <div>
              <p className="font-bold">{d.title}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                {d.tasks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Offer({ doc }: { doc: AuditDocument }) {
  return (
    <section className="mt-12 rounded-2xl border-2 border-foreground bg-card p-5 sm:p-7">
      <h2 className="text-xl font-extrabold sm:text-2xl">{OFFER_TITLE}.</h2>
      <ul className="mt-4 space-y-2">
        {offerItems(hasOwnSite(doc.prospect)).map((item) => (
          <li key={item} className="flex gap-2">
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <p className="font-bold">Comment ça se passe</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
          {HOW_IT_WORKS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={env.AUDIT_BOOKING_URL} target="_blank" rel="noopener noreferrer">
            Prendre rendez-vous (15 min)
          </a>
        </Button>
        <div className="flex flex-col gap-1 text-sm sm:ml-2">
          <a className="inline-flex items-center gap-2 font-semibold" href={AUDIT_CONTACT.phoneHref}>
            <Phone className="h-4 w-4" aria-hidden /> {AUDIT_CONTACT.name} · {AUDIT_CONTACT.phone}
          </a>
          <a className="inline-flex items-center gap-2 font-semibold" href={`mailto:${AUDIT_CONTACT.email}`}>
            <Mail className="h-4 w-4" aria-hidden /> {AUDIT_CONTACT.email}
          </a>
        </div>
      </div>
    </section>
  )
}
