'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CoachFocusedIssue } from '@/components/features/coach/coach-provider'

/**
 * Hook de conversation avec GEO — streaming texte brut depuis
 * POST /api/coach/[siteId] (§16.3). Partagé entre l'onglet dédié
 * (CoachPanel) et le panel flottant.
 *
 * Gestion d'erreurs : 429 (crédits insuffisants / rate limit) → kind
 * 'credits' (CTA recharge), autres → kind 'generic' avec retry qui ne
 * duplique pas le message user dans l'historique (§16.10).
 */

export interface CoachChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type CoachChatErrorKind = 'credits' | 'generic'

export interface CoachChatError {
  message: string
  kind: CoachChatErrorKind
}

interface UseCoachChatOptions {
  siteId: string
  analysisId: string | null
  initialMessages?: CoachChatMessage[]
}

interface PendingPayload {
  content: string
  focusedIssue: CoachFocusedIssue | null
}

export function useCoachChat({ siteId, analysisId, initialMessages }: UseCoachChatOptions) {
  const [messages, setMessages] = useState<CoachChatMessage[]>(initialMessages ?? [])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<CoachChatError | null>(null)
  const streamingIdRef = useRef<string | null>(null)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const lastFailedRef = useRef<PendingPayload | null>(null)

  const performRequest = useCallback(
    async (payload: PendingPayload) => {
      setError(null)
      setIsStreaming(true)

      const assistantId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      streamingIdRef.current = assistantId
      setStreamingId(assistantId)
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      try {
        const response = await fetch(`/api/coach/${siteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: payload.content,
            analysisId,
            focusedIssue: payload.focusedIssue,
          }),
        })

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({ error: 'Erreur inconnue' }))) as {
            error?: string
          }
          const kind: CoachChatErrorKind = response.status === 429 ? 'credits' : 'generic'
          throw Object.assign(new Error(errData.error ?? 'Une erreur est survenue.'), { kind })
        }

        if (!response.body) {
          throw Object.assign(new Error('Réponse vide du serveur.'), { kind: 'generic' })
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const snapshot = accumulated
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
          )
        }

        lastFailedRef.current = null
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Une erreur est survenue. Réessayez.'
        const kind: CoachChatErrorKind =
          err instanceof Error && (err as Error & { kind?: CoachChatErrorKind }).kind === 'credits'
            ? 'credits'
            : 'generic'
        setError({ message, kind })
        lastFailedRef.current = payload
        // On retire le placeholder assistant ; le message user reste affiché
        // pour que « Réessayer » ne le duplique pas.
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsStreaming(false)
        streamingIdRef.current = null
        setStreamingId(null)
      }
    },
    [siteId, analysisId]
  )

  const sendMessage = useCallback(
    async (content: string, focusedIssue: CoachFocusedIssue | null = null) => {
      const trimmed = content.trim()
      if (!trimmed || streamingIdRef.current !== null) return

      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role: 'user', content: trimmed },
      ])
      await performRequest({ content: trimmed, focusedIssue })
    },
    [performRequest]
  )

  const retry = useCallback(async () => {
    const payload = lastFailedRef.current
    if (!payload || streamingIdRef.current !== null) return
    await performRequest(payload)
  }, [performRequest])

  const userMessageCount = messages.filter((m) => m.role === 'user').length

  return { messages, isStreaming, streamingId, error, sendMessage, retry, userMessageCount }
}

/**
 * Autoscroll « collé en bas » (§16.10) : ne suit le flux que si
 * l'utilisateur est déjà en bas — on ne vole jamais le scroll.
 */
export function useStickToBottom(dep: unknown) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  useEffect(() => {
    if (!stickRef.current) return
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [dep])

  return { containerRef, handleScroll }
}
