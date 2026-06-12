'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Send, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CoachMessage } from '@/components/features/coach/coach-message'
import { GeoAvatar } from '@/components/features/coach/geo-avatar'
import { captureCoachEvent } from '@/components/features/coach/coach-analytics'
import {
  useCoachChat,
  useStickToBottom,
  type CoachChatMessage,
} from '@/components/features/coach/use-coach-chat'
import type { CoachFocusedIssue } from '@/components/features/coach/coach-provider'

const MAX_INPUT_CHARS = 2_000

interface CoachPanelProps {
  siteId: string
  analysisId: string | null
  initialMessages: CoachChatMessage[]
  remainingMessages: number | null
  /** Chips contextuelles (§16.6) affichées sous l'input tant que la conversation n'a pas démarré */
  suggestions?: string[]
  /** Message d'accueil de GEO — affiché côté UI uniquement, jamais persisté */
  welcomeMessage?: string
  /** Issue pré-injectée (« Demander à GEO », §16.5.C) — envoyée automatiquement une fois */
  focusedIssue?: CoachFocusedIssue | null
  onFocusedIssueConsumed?: () => void
}

export function CoachPanel({
  siteId,
  analysisId,
  initialMessages,
  remainingMessages,
  suggestions = [],
  welcomeMessage,
  focusedIssue = null,
  onFocusedIssueConsumed,
}: CoachPanelProps) {
  const { messages, isStreaming, streamingId, error, sendMessage, retry, userMessageCount } =
    useCoachChat({ siteId, analysisId, initialMessages })
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { containerRef, handleScroll } = useStickToBottom(messages)
  const consumedIssueRef = useRef<CoachFocusedIssue | null>(null)

  // Ouverture depuis une issue : premier message user envoyé automatiquement (§16.5.C)
  useEffect(() => {
    if (!focusedIssue || consumedIssueRef.current === focusedIssue) return
    consumedIssueRef.current = focusedIssue
    void sendMessage(`Aide-moi à corriger : ${focusedIssue.title}`, focusedIssue)
    onFocusedIssueConsumed?.()
  }, [focusedIssue, sendMessage, onFocusedIssueConsumed])

  // Re-focus de l'input à la fin du stream
  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus()
  }, [isStreaming])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput('')
    await sendMessage(trimmed)
  }

  function handleSuggestion(suggestion: string) {
    if (isStreaming) return
    captureCoachEvent('coach_suggestion_clicked', { suggestion })
    void sendMessage(suggestion)
  }

  const isDisabled = isStreaming || (remainingMessages !== null && remainingMessages <= 0)
  const showSuggestions = suggestions.length > 0 && userMessageCount === 0 && !isStreaming

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        aria-live="polite"
      >
        {messages.length === 0 && !welcomeMessage && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <GeoAvatar size="lg" />
            <p className="text-sm font-medium">
              Salut, moi c&apos;est GEO 👋 Je connais ton site et ses analyses par cœur.
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">Dis-moi ce qui t&apos;amène !</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.length === 0 && welcomeMessage && (
            <CoachMessage role="assistant" content={welcomeMessage} />
          )}
          {messages.map((m) => (
            <CoachMessage
              key={m.id}
              role={m.role}
              content={m.content}
              isStreaming={isStreaming && m.id === streamingId}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span className="min-w-0 flex-1">{error.message}</span>
          {error.kind === 'credits' ? (
            <Link
              href="/settings/billing"
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Recharger
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void retry()}
              className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2"
            >
              <RotateCcw size={11} />
              Réessayer
            </button>
          )}
        </div>
      )}

      {remainingMessages !== null && remainingMessages <= 5 && remainingMessages > 0 && (
        <p className="px-4 pb-1 text-center text-xs text-muted-foreground">
          {remainingMessages} message{remainingMessages > 1 ? 's' : ''} restant
          {remainingMessages > 1 ? 's' : ''} ce mois-ci
        </p>
      )}

      <div className="border-t border-border bg-card px-4 py-3">
        {showSuggestions && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              maxLength={MAX_INPUT_CHARS}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSubmit(e as unknown as FormEvent)
                }
              }}
              placeholder={
                isDisabled && remainingMessages === 0
                  ? 'Plus de crédits — recharge pour continuer'
                  : 'Pose ta question… (Entrée pour envoyer)'
              }
              disabled={isDisabled}
              rows={1}
              aria-label="Votre message pour GEO"
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isDisabled || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-xl"
              aria-label="Envoyer"
            >
              {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
