'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CoachMessage } from '@/components/features/coach/coach-message'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface CoachPanelProps {
  siteId: string
  analysisId: string
  initialMessages: ChatMessage[]
  remainingMessages: number | null
}

export function CoachPanel({
  siteId,
  analysisId,
  initialMessages,
  remainingMessages,
}: CoachPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamingIdRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput('')
    setError(null)

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    const assistantId = `a-${Date.now() + 1}`
    streamingIdRef.current = assistantId
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setIsStreaming(true)

    try {
      const response = await fetch(`/api/coach/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, analysisId }),
      })

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({ error: 'Erreur inconnue' }))) as {
          error: string
        }
        throw new Error(errData.error)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const delta = decoder.decode(value, { stream: true })
        accumulated += delta
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.'
      setError(msg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
      streamingIdRef.current = null
      inputRef.current?.focus()
    }
  }

  const isDisabled = isStreaming || (remainingMessages !== null && remainingMessages <= 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-sm font-medium">Posez une question sur votre visibilité IA</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Le coach connaît vos scores, vos problèmes détectés et peut vous guider vers les
              meilleures actions.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <CoachMessage
              key={m.id}
              role={m.role}
              content={m.content}
              isStreaming={isStreaming && m.id === streamingIdRef.current}
            />
          ))}
        </div>

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {remainingMessages !== null && remainingMessages <= 5 && remainingMessages > 0 && (
        <p className="px-4 pb-1 text-center text-xs text-muted-foreground">
          {remainingMessages} message{remainingMessages > 1 ? 's' : ''} restant
          {remainingMessages > 1 ? 's' : ''} ce mois-ci
        </p>
      )}

      <form onSubmit={handleSubmit} className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSubmit(e as unknown as FormEvent)
              }
            }}
            placeholder={
              isDisabled && remainingMessages === 0
                ? 'Quota atteint — passez au plan Pro'
                : 'Posez votre question… (Entrée pour envoyer)'
            }
            disabled={isDisabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isDisabled || !input.trim()}
            className="h-9 w-9 shrink-0 rounded-xl"
          >
            {isStreaming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
