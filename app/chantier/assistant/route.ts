import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireChantierAccess } from '@/lib/chantiers/access'
import {
  ASSISTANT,
  budgetState,
  buildAssistantContext,
  buildModelMessages,
  checkQuestion,
  crossedThreshold,
  estimateCostUsd,
  parisDayStart,
  QUESTION_ERRORS,
  resolveAssistantTarget,
  unavailableMessage,
} from '@/lib/chantiers/assistant'
import { buildChantierAssistantPrompt } from '@/lib/ai/prompts/chantier-assistant'
import { recordChantierActivity } from '@/lib/chantiers/activity'
import { sendAssistantBudgetAlert } from '@/lib/chantiers/alerts'
import { alertEmailFor, geomindAddressFor } from '@/lib/chantiers/copy'
import {
  assistantSpentSince,
  findCachedAnswer,
  insertAssistantExchange,
  loadAssistantExchanges,
} from '@/lib/db/queries/chantier-assistant'
import { env } from '@/lib/env'
import { captureChantierFailure } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Assistant de l'espace client : « Besoin d'aide ? Demander à GEO ».
 *
 * Même garde que les Server Actions de l'espace (lien valide, chantier
 * ouvert, limite de débit) : personne sans lien ne déclenche d'appel. Puis,
 * avant tout appel au modèle, ce qui ne coûte rien : question vide, trop
 * courte, trop longue, identique à la précédente, déjà posée (cache), budget
 * du jour épuisé.
 *
 * Exception assumée à la règle n°1 de CLAUDE.md (pas d'appel LLM synchrone
 * dans une route), comme le coach (app/api/coach) : une conversation en
 * direct, courte (un modèle éco, 600 jetons au plus, 45 s).
 *
 * Réponse : texte brut en flux. En-tête X-Assistant : model | cache | unavailable.
 * Le contenu des questions et des réponses ne part jamais chez Sentry ni PostHog.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const bodySchema = z.object({
  establishmentId: z.uuid().nullable(),
  fieldKey: z.string().min(1).max(100),
  // Au-delà de 1 000 caractères, checkQuestion renvoie un message lisible
  question: z.string().max(20_000),
})

const DENIED = 'Ce lien n’est plus valide : rechargez la page.'
const TOO_MANY = 'Beaucoup de questions en peu de temps : réessayez dans une heure.'
const FAILED = 'L’assistant ne répond pas pour le moment. Réessayez dans un instant.'

/** Lien refusé, ou limite de débit : celle du chantier (30 questions par heure) ou celle des faux liens. */
function denied(state: string, knownChantier: boolean) {
  if (state === 'rate_limited') return json(knownChantier ? TOO_MANY : DENIED, 429)
  return json(DENIED, 403)
}

function json(error: string, status: number) {
  // En-têtes privés (noindex, no-store…) : next.config.mjs, pour tout /chantier/*
  return NextResponse.json({ error }, { status })
}

function textResponse(body: string | ReadableStream<Uint8Array>, kind: 'model' | 'cache' | 'unavailable') {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Assistant': kind },
  })
}

interface StreamChunk {
  choices?: Array<{ delta?: { content?: string } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number }
}

export async function POST(req: NextRequest) {
  const access = await requireChantierAccess('assistant')
  if (!access.ok) return denied(access.state, access.chantier !== null)

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json(QUESTION_ERRORS.invalid, 400)
  const { establishmentId, fieldKey } = parsed.data
  const { chantier } = access

  const target = resolveAssistantTarget({
    chantierOptions: chantier.options,
    establishments: access.establishments,
    establishmentId,
    fieldKey,
  })
  if (!target.ok) return json(QUESTION_ERRORS.invalid, 400)

  const slot = { chantierId: chantier.id, establishmentId, fieldKey }
  const history = await loadAssistantExchanges(slot, ASSISTANT.historyExchanges)
  const verdict = checkQuestion(parsed.data.question, history.at(-1)?.question ?? null)
  if (!verdict.ok) return json(QUESTION_ERRORS[verdict.reason], 400)

  const address = geomindAddressFor(chantier.options)

  // Même question sur la même étape : la réponse déjà donnée, sans appel
  const cached = await findCachedAnswer(slot, verdict.key)
  if (cached) {
    await insertAssistantExchange({ ...slot, question: verdict.question, questionKey: verdict.key, answer: cached, model: 'cache' })
    await recordChantierActivity(chantier.id)
    return textResponse(cached, 'cache')
  }

  const dayStart = parisDayStart(new Date())
  const spentBefore = await assistantSpentSince(dayStart)
  if (budgetState(spentBefore) === 'stopped') {
    return textResponse(unavailableMessage(target.field, address), 'unavailable')
  }

  const system = buildChantierAssistantPrompt(
    buildAssistantContext(target.field, target.establishment?.kind ?? null, address)
  )
  const messages = buildModelMessages(system, history, verdict.question)
  // Règle n°10 : coût estimé avant l'appel (aucun contenu dans le journal)
  console.info(
    `[chantier-assistant] appel ${ASSISTANT.model}, ${messages.length} messages, coût max estimé ${estimateCostUsd(
      Math.ceil(messages.reduce((n, m) => n + m.content.length, 0) / 3),
      ASSISTANT.maxOutputTokens
    ).toFixed(5)} $`
  )

  let upstream: Response
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_CHANTIER_KEY ?? env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://geomind.fr',
        // ASCII strict (valeur d'en-tête HTTP)
        'X-Title': 'GeoMind chantier',
      },
      body: JSON.stringify({
        model: ASSISTANT.model,
        messages,
        stream: true,
        max_tokens: ASSISTANT.maxOutputTokens,
        temperature: ASSISTANT.temperature,
        usage: { include: true },
      }),
      signal: AbortSignal.timeout(ASSISTANT.timeoutMs),
    })
  } catch (err) {
    captureChantierFailure('assistant', err, { chantierId: chantier.id, fieldKey })
    return json(FAILED, 502)
  }
  if (!upstream.ok || !upstream.body) {
    // Le corps d'erreur d'OpenRouter n'est pas transmis : il peut citer la requête
    captureChantierFailure('assistant', new Error(`OpenRouter ${upstream.status}`), { chantierId: chantier.id, fieldKey })
    return json(FAILED, 502)
  }

  const reader = upstream.body.getReader()
  const encoder = new TextEncoder()
  // Panneau fermé en cours de réponse : on lit la fin quand même, pour enregistrer le coût
  let cancelled = false
  const push = (controller: ReadableStreamDefaultController<Uint8Array>, text: string) => {
    if (!cancelled) controller.enqueue(encoder.encode(text))
  }
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const decoder = new TextDecoder()
      let buffer = ''
      let answer = ''
      let tokensIn = 0
      let tokensOut = 0
      let costUsd: number | null = null
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue
            let chunk: StreamChunk
            try {
              chunk = JSON.parse(data) as StreamChunk
            } catch {
              continue // ligne SSE incomplète ou commentaire
            }
            const delta = chunk.choices?.[0]?.delta?.content ?? ''
            if (delta) {
              answer += delta
              push(controller, delta)
            }
            if (chunk.usage) {
              tokensIn = chunk.usage.prompt_tokens ?? tokensIn
              tokensOut = chunk.usage.completion_tokens ?? tokensOut
              costUsd = chunk.usage.cost ?? costUsd
            }
          }
        }
      } catch (err) {
        captureChantierFailure('assistant_stream', err, { chantierId: chantier.id, fieldKey })
      }

      const cost = costUsd ?? estimateCostUsd(tokensIn, tokensOut)
      try {
        if (answer.trim()) {
          await insertAssistantExchange({
            ...slot,
            question: verdict.question,
            questionKey: verdict.key,
            answer: answer.trim(),
            model: ASSISTANT.model,
            tokensIn,
            tokensOut,
            costUsd: cost.toFixed(8),
          })
          await recordChantierActivity(chantier.id)
        } else {
          push(controller, FAILED)
        }
        console.info(`[chantier-assistant] ${tokensIn} + ${tokensOut} jetons, ${cost.toFixed(6)} $`)
        // Relu après l'enregistrement : deux questions simultanées ne ratent pas le seuil
        const spentAfter = await assistantSpentSince(dayStart)
        const crossed = crossedThreshold(spentAfter - cost, spentAfter)
        if (crossed) await sendAssistantBudgetAlert(crossed, spentAfter, alertEmailFor(chantier.options))
      } catch (err) {
        captureChantierFailure('assistant_record', err, { chantierId: chantier.id, fieldKey })
      }
      if (!cancelled) controller.close()
    },
    cancel() {
      cancelled = true
    },
  })

  return textResponse(stream, 'model')
}
