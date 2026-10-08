'use client'

import { useRef, useState } from 'react'
import { Loader2, MessageCircleQuestion, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CoachMarkdown } from '@/components/features/coach/coach-markdown'
import { GeoAvatar } from '@/components/features/coach/geo-avatar'
import {
  ASSISTANT,
  QUESTION_ERRORS,
  prepareAnswerForDisplay,
  questionKey,
  type AssistantExchangeView,
} from '@/lib/chantiers/assistant'

/**
 * « Besoin d'aide ? Demander à GEO » sous une étape de l'espace client.
 * Conversation limitée à cette étape (app/chantier/assistant/route.ts).
 * Aucun PostHog ; le bouton d'envoi reste désactivé tant qu'une réponse
 * arrive, pour la question vide, trop courte ou identique à la précédente.
 */

type Props = {
  fieldKey: string
  fieldLabel: string
  establishmentId: string | null
  initialExchanges: AssistantExchangeView[]
}

const FAILED = 'L’assistant ne répond pas pour le moment. Réessayez dans un instant.'

export default function FieldAssistant({ fieldKey, fieldLabel, establishmentId, initialExchanges }: Props) {
  const [open, setOpen] = useState(false)
  const [exchanges, setExchanges] = useState<AssistantExchangeView[]>(initialExchanges)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const panelId = `${establishmentId ?? 'chantier'}-${fieldKey}-assistant`

  const key = questionKey(input)
  const last = exchanges.at(-1)
  const tooLong = input.trim().length > ASSISTANT.maxQuestionChars
  const repeat = !!last && questionKey(last.question) === key
  const canSend = !pending && key.length >= ASSISTANT.minQuestionChars && !tooLong && !repeat

  async function send() {
    if (!canSend || inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError(null)
    const question = input.trim()
    const localId = `local-${Date.now()}`
    setExchanges((list) => [...list, { id: localId, question, answer: '' }])
    const setAnswer = (answer: string) =>
      setExchanges((list) => list.map((e) => (e.id === localId ? { ...e, answer } : e)))

    try {
      const res = await fetch('/chantier/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ establishmentId, fieldKey, question }),
      })
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setExchanges((list) => list.filter((e) => e.id !== localId))
        setError(data?.error ?? FAILED)
        return
      }
      setInput('')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setAnswer(answer)
      }
      if (!answer.trim()) setAnswer(FAILED)
    } catch {
      setExchanges((list) => list.filter((e) => e.id !== localId || e.answer))
      setError(FAILED)
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-controls={panelId}
        className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-semibold text-primary hover:underline"
      >
        <MessageCircleQuestion className="h-4 w-4" />
        Besoin d’aide ? Demander à GEO
      </button>
    )
  }

  return (
    <div id={panelId} className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-4">
      <div className="flex items-start gap-2.5">
        <GeoAvatar size="sm" pulse={pending} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">GEO vous aide pour cette étape</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ne partagez jamais de mot de passe, de code ni de capture d’écran de connexion : GeoMind n’en a jamais
            besoin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer l’assistant"
          className="-m-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {exchanges.length > 0 && (
        <ol className="space-y-3" aria-live="polite">
          {exchanges.map((e) => (
            <li key={e.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                {e.question}
              </p>
              <div className="max-w-[95%] break-words rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm leading-relaxed shadow-sm ring-1 ring-border [&_a]:break-all">
                {e.answer ? (
                  <CoachMarkdown content={prepareAnswerForDisplay(e.answer)} analytics={false} />
                ) : (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> GEO rédige sa réponse…
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form
        onSubmit={(ev) => {
          ev.preventDefault()
          void send()
        }}
        className="space-y-2"
      >
        <label htmlFor={`${panelId}-input`} className="sr-only">
          Votre question sur « {fieldLabel} »
        </label>
        <textarea
          id={`${panelId}-input`}
          value={input}
          onChange={(ev) => {
            setInput(ev.target.value)
            setError(null)
          }}
          rows={3}
          placeholder="Ex. : je ne trouve pas ce menu sur mon téléphone"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        />
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn('text-xs tabular-nums', tooLong ? 'font-semibold text-destructive' : 'text-muted-foreground')}
          >
            {input.trim().length.toLocaleString('fr-FR')} / {ASSISTANT.maxQuestionChars.toLocaleString('fr-FR')}
          </span>
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer
          </button>
        </div>
        {(error || tooLong || (repeat && !pending)) && (
          <p role="alert" className="text-sm text-destructive">
            {error ?? (tooLong ? QUESTION_ERRORS.too_long : QUESTION_ERRORS.repeat)}
          </p>
        )}
      </form>
    </div>
  )
}
