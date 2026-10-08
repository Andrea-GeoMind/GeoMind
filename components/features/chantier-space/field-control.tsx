'use client'

import { Check, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CHANTIER_COPY, fillCopy } from '@/lib/chantiers/copy'
import {
  ADDRESS_OTHER,
  PROVIDER_CATEGORIES,
  type DecisionOption,
  type FieldDef,
} from '@/lib/chantiers/fields'
import { formatChantierDate } from '@/lib/chantiers/status'
import type { SlotStatus } from '@/components/features/chantier-space/use-autosave'

const C = CHANTIER_COPY

/** text-base sous sm : en dessous de 16 px, iOS zoome sur le champ actif */
const INPUT = 'h-11 text-base sm:text-sm'
const TEXTAREA =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm'

type OnChange = (value: unknown, options?: { immediate?: boolean }) => void

type Props = {
  field: FieldDef
  value: unknown
  status?: SlotStatus
  geomindAddress: string
  addressOptions?: string[]
  /** Identifiant unique dans la page (plusieurs établissements) */
  idPrefix: string
  onChange: OnChange
  /** « Besoin d'aide ? Demander à GEO », sous l'aide */
  assistant?: React.ReactNode
}

// ─── Valeurs vides par type ───────────────────────────────────────────────────

function obj<T extends object>(value: unknown, empty: T): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...empty, ...(value as T) } : empty
}
function arr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

// ─── Briques ──────────────────────────────────────────────────────────────────

function Choices({
  name,
  options,
  value,
  onSelect,
  inline = false,
}: {
  name: string
  options: readonly DecisionOption[]
  value: string | null
  onSelect: (id: string) => void
  inline?: boolean
}) {
  return (
    <div role="radiogroup" className={cn('grid gap-2', inline && 'grid-cols-2')}>
      {options.map((o) => (
        <label
          key={o.id}
          className={cn(
            'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-base transition-colors sm:text-sm',
            value === o.id ? 'border-primary bg-primary/5 font-medium' : 'hover:border-primary/40'
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.id}
            checked={value === o.id}
            onChange={() => onSelect(o.id)}
            className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  )
}

function Textarea({
  id,
  value,
  onChange,
  rows = 3,
  placeholder,
  maxLength,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={TEXTAREA}
    />
  )
}

function Comment({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {C.decisions.comment}
      </label>
      <Textarea id={id} value={value} onChange={onChange} rows={2} maxLength={2000} />
    </div>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={C.info.remove}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-primary hover:underline"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  )
}

/** Entier positif : tout caractère non numérique est ignoré à la saisie. */
function NumberInput({
  id,
  value,
  onChange,
  suffix,
}: {
  id: string
  value: unknown
  onChange: OnChange
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 7)
          onChange(digits === '' ? null : Number(digits))
        }}
        className={cn(INPUT, 'w-32')}
      />
      {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
    </div>
  )
}

// ─── Champ ────────────────────────────────────────────────────────────────────

export default function FieldControl({
  field,
  value,
  status,
  geomindAddress,
  addressOptions = [],
  idPrefix,
  onChange,
  assistant,
}: Props) {
  const id = `${idPrefix}-${field.key}`
  const help = field.help ? fillCopy(field.help, { '[ADRESSE]': geomindAddress }) : null
  const isGroup = field.type !== 'text' && field.type !== 'integer' && field.type !== 'euros'

  return (
    <div className="space-y-3 border-b border-border/70 py-5 last:border-b-0">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          {isGroup ? (
            <p id={`${id}-label`} className="text-base font-semibold leading-snug">
              {field.label}
            </p>
          ) : (
            <label htmlFor={id} className="text-base font-semibold leading-snug">
              {field.label}
            </label>
          )}
          {status === 'saved' && (
            <Check aria-label={C.autosave.saved} className="mt-1 h-4 w-4 shrink-0 text-accent" />
          )}
        </div>
        {help && <p className="text-sm leading-relaxed text-muted-foreground">{help}</p>}
        {assistant}
      </div>

      <Control field={field} value={value} id={id} addressOptions={addressOptions} onChange={onChange} />

      {status === 'invalid' && <p className="text-sm text-destructive">{C.autosave.invalid}</p>}
    </div>
  )
}

function Control({
  field,
  value,
  id,
  addressOptions,
  onChange,
}: {
  field: FieldDef
  value: unknown
  id: string
  addressOptions: string[]
  onChange: OnChange
}) {
  switch (field.type) {
    case 'access':
      return (
        <Choices
          name={id}
          options={[
            { id: 'given', label: C.access.given },
            { id: field.alternative.value, label: field.alternative.label },
          ]}
          value={typeof value === 'string' ? value : null}
          onSelect={(v) => onChange(v, { immediate: true })}
        />
      )

    case 'text':
      return field.multiline ? (
        <Textarea
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v)}
          rows={4}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
        />
      ) : (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        />
      )

    case 'integer':
      return <NumberInput id={id} value={value} onChange={onChange} suffix={field.unit} />

    case 'euros':
      return <NumberInput id={id} value={value} onChange={onChange} suffix={C.info.euroSuffix} />

    case 'yesNoDetail': {
      const v = obj(value, { value: null as boolean | null, detail: '' })
      return (
        <div className="space-y-3">
          <Choices
            name={id}
            inline
            options={[
              { id: 'yes', label: C.info.yes },
              { id: 'no', label: C.info.no },
            ]}
            value={v.value === null ? null : v.value ? 'yes' : 'no'}
            onSelect={(choice) => onChange({ ...v, value: choice === 'yes' }, { immediate: true })}
          />
          <div className="space-y-1.5">
            <label htmlFor={`${id}-detail`} className="text-sm text-muted-foreground">
              {field.detailLabel}
            </label>
            <Textarea
              id={`${id}-detail`}
              value={v.detail}
              rows={2}
              maxLength={2000}
              onChange={(detail) => onChange({ ...v, detail })}
            />
          </div>
        </div>
      )
    }

    case 'list': {
      const items = arr<string>(value)
      const rows = items.length === 0 ? [''] : items
      return (
        <div className="space-y-2">
          {rows.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                aria-label={field.itemLabel}
                placeholder={field.itemLabel}
                value={item}
                maxLength={300}
                onChange={(e) => onChange(rows.map((x, j) => (j === i ? e.target.value : x)))}
                className={INPUT}
              />
              {rows.length > 1 && (
                <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i), { immediate: true })} />
              )}
            </div>
          ))}
          <AddButton label={C.info.addZone} onClick={() => onChange([...rows, ''], { immediate: true })} />
        </div>
      )
    }

    case 'priceList': {
      const items = arr<{ label: string; price: string }>(value)
      const rows = items.length === 0 ? [{ label: '', price: '' }] : items
      const set = (i: number, patch: Partial<{ label: string; price: string }>) =>
        onChange(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)))
      return (
        <div className="space-y-3">
          {rows.map((item, i) => (
            <div key={i} className="flex gap-2 rounded-lg bg-muted/40 p-2 sm:bg-transparent sm:p-0">
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_10rem]">
                <Input
                  aria-label={C.info.serviceLabel}
                  placeholder={C.info.serviceLabel}
                  value={item.label}
                  maxLength={300}
                  onChange={(e) => set(i, { label: e.target.value })}
                  className={INPUT}
                />
                <Input
                  aria-label={C.info.servicePrice}
                  placeholder={C.info.servicePrice}
                  value={item.price}
                  maxLength={100}
                  onChange={(e) => set(i, { price: e.target.value })}
                  className={INPUT}
                />
              </div>
              {rows.length > 1 && (
                <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i), { immediate: true })} />
              )}
            </div>
          ))}
          <AddButton
            label={C.info.addService}
            onClick={() => onChange([...rows, { label: '', price: '' }], { immediate: true })}
          />
        </div>
      )
    }

    case 'faq': {
      const items = arr<{ question: string; answer: string }>(value)
      const rows = items.length === 0 ? [{ question: '', answer: '' }] : items
      const set = (i: number, patch: Partial<{ question: string; answer: string }>) =>
        onChange(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)))
      return (
        <div className="space-y-3">
          {rows.map((item, i) => (
            <div key={i} className="flex gap-2 rounded-lg bg-muted/40 p-2">
              <div className="flex-1 space-y-2">
                <Input
                  aria-label={C.info.question}
                  placeholder={C.info.question}
                  value={item.question}
                  maxLength={300}
                  onChange={(e) => set(i, { question: e.target.value })}
                  className={INPUT}
                />
                <Textarea
                  value={item.answer}
                  placeholder={C.info.answer}
                  rows={2}
                  maxLength={2000}
                  onChange={(answer) => set(i, { answer })}
                />
              </div>
              {rows.length > 1 && (
                <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i), { immediate: true })} />
              )}
            </div>
          ))}
          <AddButton
            label={C.info.addQuestion}
            onClick={() => onChange([...rows, { question: '', answer: '' }], { immediate: true })}
          />
        </div>
      )
    }

    case 'contact': {
      const v = obj(value, { name: '', email: '', phone: '' })
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            aria-label={C.access.contactName}
            placeholder={C.access.contactName}
            autoComplete="off"
            value={v.name}
            maxLength={300}
            onChange={(e) => onChange({ ...v, name: e.target.value })}
            className={INPUT}
          />
          <Input
            aria-label={C.access.contactEmail}
            placeholder={C.access.contactEmail}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={v.email}
            maxLength={254}
            onChange={(e) => onChange({ ...v, email: e.target.value.trim() })}
            className={INPUT}
          />
          <Input
            aria-label={C.access.contactPhone}
            placeholder={C.access.contactPhone}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={v.phone}
            maxLength={40}
            onChange={(e) => onChange({ ...v, phone: e.target.value })}
            className={INPUT}
          />
        </div>
      )
    }

    case 'contacts': {
      type Item = { category?: string; name: string; website: string; contact: string }
      const empty: Item = field.withCategory
        ? { category: 'photographe', name: '', website: '', contact: '' }
        : { name: '', website: '', contact: '' }
      const items = arr<Item>(value)
      const rows = items.length === 0 ? [empty] : items
      const set = (i: number, patch: Partial<Item>) =>
        onChange(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)))
      return (
        <div className="space-y-3">
          {rows.map((item, i) => (
            <div key={i} className="flex gap-2 rounded-lg bg-muted/40 p-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                {field.withCategory && (
                  <select
                    aria-label={C.info.contactCategory}
                    value={item.category ?? 'autre'}
                    onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)), { immediate: true })}
                    className={cn(INPUT, 'w-full rounded-md border border-input bg-background px-3')}
                  >
                    {PROVIDER_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
                <Input
                  aria-label={C.info.contactName}
                  placeholder={C.info.contactName}
                  value={item.name}
                  maxLength={300}
                  onChange={(e) => set(i, { name: e.target.value })}
                  className={INPUT}
                />
                <Input
                  aria-label={C.info.contactWebsite}
                  placeholder={C.info.contactWebsite}
                  inputMode="url"
                  value={item.website}
                  maxLength={500}
                  onChange={(e) => set(i, { website: e.target.value })}
                  className={INPUT}
                />
                <Input
                  aria-label={C.info.contactDetails}
                  placeholder={C.info.contactDetails}
                  value={item.contact}
                  maxLength={300}
                  onChange={(e) => set(i, { contact: e.target.value })}
                  className={INPUT}
                />
              </div>
              {rows.length > 1 && (
                <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i), { immediate: true })} />
              )}
            </div>
          ))}
          <AddButton label={C.info.addContact} onClick={() => onChange([...rows, empty], { immediate: true })} />
        </div>
      )
    }

    case 'reference': {
      const v = obj(value, { date: '', title: '', url: '' })
      return (
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
          <Input
            type="date"
            aria-label={C.info.referenceDate}
            value={v.date}
            onChange={(e) => onChange({ ...v, date: e.target.value }, { immediate: true })}
            className={INPUT}
          />
          <Input
            aria-label={C.info.referenceTitle}
            placeholder={C.info.referenceTitle}
            value={v.title}
            maxLength={300}
            onChange={(e) => onChange({ ...v, title: e.target.value })}
            className={INPUT}
          />
          <Input
            aria-label={C.info.referenceUrl}
            placeholder={`${C.info.referenceUrl} (https://…)`}
            inputMode="url"
            value={v.url}
            maxLength={1000}
            onChange={(e) => onChange({ ...v, url: e.target.value.trim() })}
            className={cn(INPUT, 'sm:col-span-2')}
          />
        </div>
      )
    }

    case 'decision': {
      const v = obj(value, { choice: null as string | null, comment: '' })
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{field.explanation}</p>
          <Choices
            name={id}
            options={field.options}
            value={v.choice}
            onSelect={(choice) => onChange({ ...v, choice }, { immediate: true })}
          />
          <Comment id={`${id}-comment`} value={v.comment} onChange={(comment) => onChange({ ...v, comment })} />
        </div>
      )
    }

    case 'address': {
      const v = obj(value, { choice: null as string | null, otherText: '', comment: '' })
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{field.explanation}</p>
          <Choices
            name={id}
            options={[
              ...addressOptions.map((a) => ({ id: a, label: a })),
              { id: ADDRESS_OTHER, label: C.decisions.addressOther },
            ]}
            value={v.choice}
            onSelect={(choice) => onChange({ ...v, choice }, { immediate: true })}
          />
          {v.choice === ADDRESS_OTHER && (
            <Input
              aria-label={C.decisions.addressOtherPlaceholder}
              placeholder={C.decisions.addressOtherPlaceholder}
              value={v.otherText}
              maxLength={300}
              autoFocus
              onChange={(e) => onChange({ ...v, otherText: e.target.value })}
              className={INPUT}
            />
          )}
          <Comment id={`${id}-comment`} value={v.comment} onChange={(comment) => onChange({ ...v, comment })} />
        </div>
      )
    }

    case 'agreement': {
      const v = obj(value, {
        choice: null as 'yes' | 'no' | null,
        comment: '',
        signerName: '',
        signature: null as { signedAt: string } | null,
      })
      // La signature est posée par le serveur, qui ignore celle qu'on lui
      // enverrait. On la garde localement pour l'affichage tant que l'accord
      // et le signataire ne changent pas.
      const input = { choice: v.choice, comment: v.comment, signerName: v.signerName, signature: null }
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{field.explanation}</p>
          <Choices
            name={id}
            inline
            options={[
              { id: 'yes', label: C.info.yes },
              { id: 'no', label: C.info.no },
            ]}
            value={v.choice}
            onSelect={(choice) => onChange({ ...input, choice }, { immediate: true })}
          />
          {v.choice === 'yes' && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium leading-relaxed">{field.agreementText}</p>
              <div className="space-y-1.5">
                <label htmlFor={`${id}-signer`} className="text-sm text-muted-foreground">
                  {C.decisions.signerName}
                </label>
                <Input
                  id={`${id}-signer`}
                  autoComplete="name"
                  value={v.signerName}
                  maxLength={300}
                  onChange={(e) => onChange({ ...input, signerName: e.target.value })}
                  className={INPUT}
                />
              </div>
              {v.signature ? (
                <p className="flex items-center gap-1.5 text-sm text-accent">
                  <Check className="h-4 w-4" />
                  {fillCopy(C.decisions.signed, {
                    '[NOM]': v.signerName,
                    '[DATE]': formatChantierDate(new Date(v.signature.signedAt)),
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{C.decisions.signerNameRequired}</p>
              )}
            </div>
          )}
          <Comment
            id={`${id}-comment`}
            value={v.comment}
            onChange={(comment) => onChange({ ...input, comment, signature: v.signature })}
          />
        </div>
      )
    }

    case 'attestation': {
      const v = obj(value, { accepted: false, signature: null as { signedAt: string } | null })
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3">
          <input
            type="checkbox"
            checked={v.accepted}
            onChange={(e) => onChange({ accepted: e.target.checked }, { immediate: true })}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
          />
          <span className="space-y-1 text-base leading-relaxed sm:text-sm">
            <span className="block">{field.attestationText}</span>
            {v.accepted && v.signature && (
              <span className="block text-sm text-muted-foreground">
                {formatChantierDate(new Date(v.signature.signedAt))}
              </span>
            )}
          </span>
        </label>
      )
    }

    case 'file':
      // Rendu par FileField (dépôt direct au stockage), jamais ici
      return null
  }
}

