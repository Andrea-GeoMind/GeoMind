'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CloudOff, LifeBuoy, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'
import { cn } from '@/lib/utils'
import type { ChantierEstablishmentOptions, ChantierOptions } from '@/lib/db/schema'
import { CHANTIER_COPY, fillCopy } from '@/lib/chantiers/copy'
import {
  chantierFields,
  establishmentFields,
  inputSchemaFor,
  type EstablishmentKind,
  type FieldDef,
  type FieldSection,
} from '@/lib/chantiers/fields'
import { computeCompleteness, type CompletenessItem } from '@/lib/chantiers/completeness'
import { formatChantierDate } from '@/lib/chantiers/status'
import { submitChantierAction } from '@/app/chantier/espace/actions'
import FieldControl from '@/components/features/chantier-space/field-control'
import { slotKey, useAutosave, type GlobalStatus } from '@/components/features/chantier-space/use-autosave'

const C = CHANTIER_COPY

export interface SpaceEstablishment {
  id: string
  name: string
  kind: EstablishmentKind
  options: ChantierEstablishmentOptions
}

type Props = {
  clientName: string
  geomindAddress: string
  expiresAt: string | null
  submittedAt: string | null
  chantierOptions: ChantierOptions
  establishments: SpaceEstablishment[]
  initialAnswers: { establishmentId: string | null; fieldKey: string; value: unknown }[]
  files: { establishmentId: string | null; fieldKey: string; status: 'pending' | 'ready' | 'deleted' }[]
}

type SectionId = FieldSection | 'recap'

const SECTIONS: { id: SectionId; title: string; short: string }[] = [
  { id: 'access', title: C.access.title, short: C.nav.short.access },
  { id: 'info', title: C.info.title, short: C.nav.short.info },
  { id: 'files', title: C.files.title, short: C.nav.short.files },
  { id: 'decisions', title: C.decisions.title, short: C.nav.short.decisions },
  { id: 'recap', title: C.recap.title, short: C.nav.short.recap },
]

const SECTION_INTRO: Record<FieldSection, string> = {
  access: C.access.intro,
  info: C.info.intro,
  files: C.files.intro,
  decisions: C.decisions.intro,
}

function readHash(): SectionId {
  const hash = typeof window === 'undefined' ? '' : window.location.hash.slice(1)
  return SECTIONS.some((s) => s.id === hash) ? (hash as SectionId) : 'access'
}

export default function ChantierSpace(props: Props) {
  const { clientName, geomindAddress, chantierOptions, establishments } = props

  const [answers, setAnswers] = useState(
    () => new Map(props.initialAnswers.map((a) => [slotKey(a.establishmentId, a.fieldKey), a.value]))
  )
  const [section, setSection] = useState<SectionId>('access')
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id ?? '')
  const [submittedAt, setSubmittedAt] = useState(props.submittedAt)

  // La section ouverte vit dans l'état React ; l'adresse (#infos…) n'en est
  // que le reflet, pour qu'un rechargement rouvre la même section.
  useEffect(() => {
    setSection(readHash())
  }, [])

  const onStored = useCallback((slot: string, value: unknown) => {
    setAnswers((prev) => new Map(prev).set(slot, value))
  }, [])
  const { queue, markInvalid, statuses, global } = useAutosave(onStored)

  const change = useCallback(
    (field: FieldDef, estId: string | null, options: ChantierEstablishmentOptions) =>
      (value: unknown, opts?: { immediate?: boolean }) => {
        setAnswers((prev) => new Map(prev).set(slotKey(estId, field.key), value))
        // Même validation que le serveur, pour ne rien envoyer d'invalide
        // (un e-mail en cours de frappe, par exemple)
        if (inputSchemaFor(field, options)?.safeParse(value).success === false) {
          markInvalid(estId, field.key)
          return
        }
        queue({ establishmentId: estId, fieldKey: field.key, value }, opts)
      },
    [queue, markInvalid]
  )

  const completeness = useMemo(
    () =>
      computeCompleteness({
        chantierOptions,
        establishments,
        answers: [...answers].map(([slot, value]) => {
          const [est, fieldKey] = slot.split('|') as [string, string]
          return { establishmentId: est === '-' ? null : est, fieldKey, value }
        }),
        files: props.files,
      }),
    [answers, chantierOptions, establishments, props.files]
  )

  const goTo = (id: SectionId) => {
    setSection(id)
    window.history.replaceState(window.history.state, '', `#${id}`)
    window.scrollTo({ top: 0 })
  }

  const current = SECTIONS.findIndex((s) => s.id === section)
  const selected = establishments.find((e) => e.id === establishmentId) ?? establishments[0]

  const renderField = (field: FieldDef, est: SpaceEstablishment | null) => {
    const slot = slotKey(est?.id ?? null, field.key)
    return (
      <FieldControl
        key={slot}
        field={field}
        value={answers.get(slot)}
        status={statuses[slot]}
        geomindAddress={geomindAddress}
        addressOptions={est?.options.addressOptions}
        idPrefix={est?.id ?? 'chantier'}
        onChange={change(field, est?.id ?? null, est?.options ?? {})}
      />
    )
  }

  return (
    <div className="pb-16">
      <Header
        clientName={clientName}
        percent={completeness.percent}
        status={global}
        section={section}
        onSection={goTo}
      />

      <main className="mx-auto max-w-2xl px-4 pt-5 sm:px-6">
        {section === 'access' && (
          <Intro expiresAt={props.expiresAt} clientName={clientName} />
        )}

        {section !== 'recap' ? (
          <FieldSectionView
            section={section}
            chantierOptions={chantierOptions}
            establishments={establishments}
            selected={selected}
            onSelect={setEstablishmentId}
            completenessItems={completeness.items}
            geomindAddress={geomindAddress}
            renderField={renderField}
          />
        ) : (
          <Recap
            items={completeness.items}
            blocking={completeness.blocking}
            alerts={completeness.alerts}
            missing={completeness.missing}
            submittedAt={submittedAt}
            onSubmitted={setSubmittedAt}
            onJump={(item) => {
              if (item.establishmentId) setEstablishmentId(item.establishmentId)
              goTo(item.section)
            }}
          />
        )}

        <nav className="mt-8 flex items-center justify-between gap-3">
          {current > 0 ? (
            <Button variant="outline" className="h-11" onClick={() => goTo(SECTIONS[current - 1]!.id)}>
              <ArrowLeft />
              {SECTIONS[current - 1]!.short}
            </Button>
          ) : (
            <span />
          )}
          {current < SECTIONS.length - 1 && (
            <Button className="h-11" onClick={() => goTo(SECTIONS[current + 1]!.id)}>
              {SECTIONS[current + 1]!.short}
              <ArrowRight />
            </Button>
          )}
        </nav>

        <p className="mt-12 text-center text-xs text-muted-foreground">{C.footer}</p>
      </main>
    </div>
  )
}

// ─── En-tête fixe : client, avancement, enregistrement, sections ─────────────

function SaveStatus({ status }: { status: GlobalStatus }) {
  if (status === 'idle') return null
  const map = {
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: C.autosave.saving, cls: 'text-muted-foreground' },
    saved: { icon: <Check className="h-3.5 w-3.5" />, text: C.autosave.saved, cls: 'text-accent' },
    error: { icon: <CloudOff className="h-3.5 w-3.5" />, text: C.autosave.errorShort, cls: 'text-destructive' },
  } as const
  const s = map[status]
  return (
    <p role="status" aria-live="polite" className={cn('flex items-center gap-1.5 text-xs font-medium', s.cls)}>
      {s.icon}
      <span className="whitespace-nowrap">{s.text}</span>
    </p>
  )
}

function Header({
  clientName,
  percent,
  status,
  section,
  onSection,
}: {
  clientName: string
  percent: number
  status: GlobalStatus
  section: SectionId
  onSection: (id: SectionId) => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto max-w-2xl px-4 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <LogoMark size={22} />
            <p className="truncate text-sm font-bold">{clientName}</p>
          </div>
          <SaveStatus status={status} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <span className="whitespace-nowrap text-right text-xs font-medium tabular-nums text-muted-foreground">
            {fillCopy(C.header.progress, { '[POURCENT]': String(percent) })}
          </span>
        </div>
        <nav
          aria-label={C.nav.sections}
          className="-mx-4 mt-2 flex overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSection(s.id)}
              aria-current={section === s.id ? 'step' : undefined}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                section === s.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {i + 1}. {s.short}
            </button>
          ))}
        </nav>
      </div>
      {status === 'error' && (
        <p role="alert" className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {C.autosave.error}
        </p>
      )}
    </header>
  )
}

function Intro({ expiresAt, clientName }: { expiresAt: string | null; clientName: string }) {
  return (
    <div className="mb-6 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{C.header.eyebrow}</p>
      <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
        {fillCopy(C.header.title, { '[CLIENT]': clientName })}
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">{C.header.intro}</p>
      {expiresAt && (
        <p className="text-sm text-muted-foreground">
          {fillCopy(C.header.privateLink, { '[DATE]': formatChantierDate(new Date(expiresAt)) })}
        </p>
      )}
    </div>
  )
}

// ─── Sections à champs ────────────────────────────────────────────────────────

function FieldSectionView({
  section,
  chantierOptions,
  establishments,
  selected,
  onSelect,
  completenessItems,
  geomindAddress,
  renderField,
}: {
  section: FieldSection
  chantierOptions: ChantierOptions
  establishments: SpaceEstablishment[]
  selected: SpaceEstablishment | undefined
  onSelect: (id: string) => void
  completenessItems: CompletenessItem[]
  geomindAddress: string
  renderField: (field: FieldDef, est: SpaceEstablishment | null) => React.ReactNode
}) {
  const sectionTitle = SECTIONS.find((s) => s.id === section)!.title
  const chantierLevel = chantierFields(chantierOptions).filter((f) => f.section === section)
  const before = chantierLevel.filter((f) => f.type === 'attestation')
  const after = chantierLevel.filter((f) => f.type !== 'attestation')
  const perEstablishment = selected
    ? establishmentFields(selected.kind, selected.options).filter((f) => f.section === section)
    : []
  const hasEstablishmentFields = establishments.some(
    (e) => establishmentFields(e.kind, e.options).some((f) => f.section === section)
  )

  return (
    <section aria-labelledby={`title-${section}`} className="space-y-5">
      <div className="space-y-2">
        <h2 id={`title-${section}`} className="text-xl font-extrabold tracking-tight">
          {sectionTitle}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">{SECTION_INTRO[section]}</p>
      </div>

      {section === 'access' && (
        <div className="space-y-3">
          <p className="flex gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{C.access.noPassword}</span>
          </p>
          <p className="rounded-xl bg-card p-4 text-sm shadow-sm ring-1 ring-border">
            {fillCopy(C.access.inviteAddress, { '[ADRESSE]': '' })}
            <span className="mt-1 block select-all break-all font-mono text-base font-semibold text-foreground">
              {geomindAddress}
            </span>
          </p>
        </div>
      )}

      {before.length > 0 && <Panel>{before.map((f) => renderField(f, null))}</Panel>}

      {hasEstablishmentFields && selected && (
        <div className="space-y-3">
          {establishments.length > 1 && (
            <EstablishmentPicker
              establishments={establishments}
              selected={selected.id}
              onSelect={onSelect}
              section={section}
              items={completenessItems}
            />
          )}
          <Panel title={selected.name}>{perEstablishment.map((f) => renderField(f, selected))}</Panel>
        </div>
      )}

      {after.length > 0 && (
        <Panel title={establishments.length > 1 ? C.nav.allEstablishments : undefined}>
          {after.map((f) => renderField(f, null))}
        </Panel>
      )}
    </section>
  )
}

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card px-4 shadow-sm ring-1 ring-border sm:px-5">
      {title && <h3 className="border-b border-border/70 py-3 text-sm font-bold">{title}</h3>}
      {children}
    </div>
  )
}

function EstablishmentPicker({
  establishments,
  selected,
  onSelect,
  section,
  items,
}: {
  establishments: SpaceEstablishment[]
  selected: string
  onSelect: (id: string) => void
  section: FieldSection
  items: CompletenessItem[]
}) {
  return (
    <div role="tablist" aria-label={C.nav.establishment} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
      {establishments.map((e) => {
        const own = items.filter((i) => i.establishmentId === e.id && i.section === section && i.required)
        const done = own.filter((i) => i.filled).length
        const blocked = own.some((i) => i.blocking && !i.filled)
        return (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={selected === e.id}
            onClick={() => onSelect(e.id)}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
              selected === e.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card hover:border-primary/40'
            )}
          >
            {e.name}
            {own.length > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  selected === e.id ? 'bg-white/20' : blocked ? 'bg-amber-100 text-amber-900' : 'bg-muted'
                )}
              >
                {done}/{own.length}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Récapitulatif ────────────────────────────────────────────────────────────

function ItemList({ items, onJump }: { items: CompletenessItem[]; onJump: (item: CompletenessItem) => void }) {
  return (
    <ul className="divide-y divide-border/70">
      {items.map((item) => (
        <li key={`${item.establishmentId ?? '-'}|${item.fieldKey}`}>
          <button
            type="button"
            onClick={() => onJump(item)}
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-primary"
          >
            <span>
              {item.label}
              {item.establishmentName && (
                <span className="block text-xs text-muted-foreground">{item.establishmentName}</span>
              )}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function Recap({
  blocking,
  alerts,
  missing,
  submittedAt,
  onSubmitted,
  onJump,
}: {
  items: CompletenessItem[]
  blocking: CompletenessItem[]
  alerts: CompletenessItem[]
  missing: CompletenessItem[]
  submittedAt: string | null
  onSubmitted: (iso: string) => void
  onJump: (item: CompletenessItem) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(false)
  const [isPending, startTransition] = useTransition()
  const otherMissing = missing.filter((i) => !i.blocking)

  const submit = () => {
    setError(false)
    startTransition(async () => {
      try {
        const result = await submitChantierAction()
        if (result.ok) {
          onSubmitted(result.submittedAt)
          setConfirming(false)
        } else if (result.error === 'access') {
          window.location.reload()
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      }
    })
  }

  return (
    <section aria-labelledby="title-recap" className="space-y-5">
      <h2 id="title-recap" className="text-xl font-extrabold tracking-tight">
        {C.recap.title}
      </h2>

      {blocking.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <h3 className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            {C.recap.blockingTitle}
          </h3>
          <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{C.recap.blockingIntro}</p>
          <ItemList items={blocking} onJump={onJump} />
        </div>
      )}

      {alerts.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <h3 className="flex items-center gap-2 font-bold">
            <LifeBuoy className="h-4 w-4 text-primary" />
            {C.recap.helpTitle}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{C.recap.helpIntro}</p>
          <ItemList items={alerts} onJump={onJump} />
        </div>
      )}

      {otherMissing.length > 0 ? (
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <h3 className="font-bold">{C.recap.missingTitle}</h3>
          <ItemList items={otherMissing} onJump={onJump} />
        </div>
      ) : (
        blocking.length === 0 && (
          <p className="flex items-center gap-2 rounded-2xl bg-accent/10 p-4 font-semibold text-accent">
            <Check className="h-5 w-5" />
            {C.recap.complete}
          </p>
        )
      )}

      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        {submittedAt && (
          <p className="text-sm font-medium text-accent">
            {fillCopy(C.recap.done, { '[DATE]': formatChantierDate(new Date(submittedAt)) })}
          </p>
        )}
        {confirming ? (
          <div className="space-y-3">
            <p className="text-sm">{C.recap.confirmIncomplete}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="h-11" onClick={submit} disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {C.recap.confirmYes}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => setConfirming(false)}>
                {C.recap.confirmNo}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              className="h-12 w-full text-base"
              disabled={isPending}
              onClick={() => (missing.length > 0 ? setConfirming(true) : submit())}
            >
              {isPending && <Loader2 className="animate-spin" />}
              {C.recap.finishButton}
            </Button>
            <p className="text-center text-sm text-muted-foreground">{C.recap.finishHint}</p>
          </>
        )}
        {error && <p className="text-sm text-destructive">{C.autosave.error}</p>}
      </div>
    </section>
  )
}
