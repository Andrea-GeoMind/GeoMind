/**
 * Route de conversation avec GEO (cahier-des-charges §16).
 * Sonnet + web search via OpenRouter, fallback Haiku, streaming SSE,
 * crédits décomptés au réel (plancher 5 / plafond 60), rate limit 30 msg/h,
 * compression mémoire déclenchée tous les 10 messages utilisateur.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { CREDIT_COSTS, consumeCredits, refundCredits, addPurchasedCredits } from '@/lib/credits'
import {
  insertCoachMessage,
  getRecentCoachMessages,
  countCoachMessagesLastHour,
  countUserMessagesForSite,
} from '@/lib/db/queries/coach'
import { buildCoachContext } from '@/lib/analysis/coach-context'
import { buildCoachSystemPrompt } from '@/lib/ai/prompts/coach'
import { canUseCoachMemory } from '@/lib/quotas'
import { inngest } from '@/lib/inngest/client'
import { env } from '@/lib/env'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const COACH_MODEL = 'anthropic/claude-sonnet-4-6'
const FALLBACK_MODEL = 'anthropic/claude-haiku-4-5'
const MAX_HISTORY = 20
const MAX_INPUT_CHARS = 2_000
const RATE_LIMIT_PER_HOUR = 30
const REQUEST_TIMEOUT_MS = 60_000

// Décompte au réel (§16.7) : coût $ Sonnet ×2 de marge, 1 crédit = 0,001 €
const SONNET_INPUT_PER_TOKEN = 3 / 1_000_000
const SONNET_OUTPUT_PER_TOKEN = 15 / 1_000_000
const CREDIT_FLOOR = 5
const CREDIT_CAP = 60

type RequestBody = {
  content: string
  analysisId?: string | null
  /** Issue pré-injectée — ouverture « Demander à GEO » (§16.5.C) */
  focusedIssue?: { title: string; description: string } | null
}

function realCreditCost(tokensIn: number, tokensOut: number): number {
  const costUsd = tokensIn * SONNET_INPUT_PER_TOKEN + tokensOut * SONNET_OUTPUT_PER_TOKEN
  const credits = Math.ceil((costUsd * 2) / 0.001)
  return Math.min(CREDIT_CAP, Math.max(CREDIT_FLOOR, credits))
}

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  withWebSearch: boolean
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://geomind.fr',
      // ASCII strict : les valeurs de headers HTTP sont du Latin-1 — un tiret
      // cadratin (—) y fait planter fetch (« Cannot convert argument to ByteString »).
      'X-Title': 'GeoMind GEO',
    },
    body: JSON.stringify({
      model,
      // OpenRouter (compatible OpenAI) ignore un champ `system` de premier niveau :
      // le prompt système doit être le 1er message (role:'system'), sinon le contexte
      // du site n'atteint jamais le modèle et le coach répond « à côté ».
      messages: [{ role: 'system' as const, content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
      usage: { include: true },
      ...(withWebSearch ? { plugins: [{ id: 'web', max_results: 3 }] } : {}),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) {
    return NextResponse.json({ error: 'Site introuvable' }, { status: 404 })
  }

  // Rate limit anti-abus (§16.9) — même avec des crédits
  const lastHour = await countCoachMessagesLastHour(user.id)
  if (lastHour >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: 'GEO a besoin de souffler — réessayez dans quelques minutes (limite horaire atteinte).' },
      { status: 429 }
    )
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const content = body.content?.trim()
  if (!content) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  }
  if (content.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Message trop long (max ${MAX_INPUT_CHARS} caractères)` },
      { status: 400 }
    )
  }

  // Décompte avant l'appel LLM — ajusté au réel après la réponse, remboursé si échec
  const upfrontCost = CREDIT_COSTS.coachMessagePremium
  const consumed = await consumeCredits(user.id, upfrontCost, 'coach_message', { siteId })
  if (!consumed.ok) {
    return NextResponse.json(
      {
        error: `Il me faut plus de carburant ! Recharge tes crédits pour continuer (solde : ${consumed.balance.total}).`,
      },
      { status: 429 }
    )
  }

  await insertCoachMessage({
    siteId,
    analysisId: body.analysisId ?? null,
    userId: user.id,
    role: 'user',
    content,
  })

  const memoryAllowed = await canUseCoachMemory(user.id)
  const [coachContext, history] = await Promise.all([
    buildCoachContext(siteId, { userId: user.id, focusedIssue: body.focusedIssue ?? null }),
    // Sans mémoire (plan Gratuit) : seul le fil de la session compte côté client,
    // on ne recharge que les messages très récents pour le contexte immédiat.
    getRecentCoachMessages(user.id, siteId, memoryAllowed ? MAX_HISTORY + 1 : 6),
  ])

  const systemPrompt = buildCoachSystemPrompt(coachContext)

  const historyMessages = history
    .filter((m) => m.content !== content) // le message tout juste inséré
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const messages = [...historyMessages, { role: 'user' as const, content }]

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = ''
      let usedFallback = false
      let tokensIn = 0
      let tokensOut = 0

      try {
        let orResponse = await callOpenRouter(COACH_MODEL, systemPrompt, messages, true)

        // Fallback Haiku si Sonnet indisponible (§16.3) — uniquement avant tout octet streamé
        if (!orResponse.ok && orResponse.status >= 500) {
          usedFallback = true
          orResponse = await callOpenRouter(FALLBACK_MODEL, systemPrompt, messages, false)
        }

        if (!orResponse.ok) {
          const errText = await orResponse.text()
          await refundCredits(user.id, upfrontCost, { siteId, step: 'openrouter' })
          controller.error(new Error(`OpenRouter ${orResponse.status}: ${errText}`))
          return
        }

        const reader = orResponse.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>
                usage?: { prompt_tokens?: number; completion_tokens?: number }
              }
              const delta = parsed.choices?.[0]?.delta?.content ?? ''
              if (delta) {
                fullContent += delta
                controller.enqueue(new TextEncoder().encode(delta))
              }
              if (parsed.usage) {
                tokensIn = parsed.usage.prompt_tokens ?? 0
                tokensOut = parsed.usage.completion_tokens ?? 0
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        // Stream interrompu côté serveur → aucun décompte (§17.4)
        await refundCredits(user.id, upfrontCost, { siteId, step: 'stream' })
        controller.error(err)
        return
      }

      if (fullContent) {
        const finalContent = usedFallback
          ? `${fullContent}\n\n*(mode rapide aujourd'hui)*`
          : fullContent

        await insertCoachMessage({
          siteId,
          analysisId: body.analysisId ?? null,
          userId: user.id,
          role: 'assistant',
          content: finalContent,
        })

        // Ajustement au coût réel (§16.7) — best effort, jamais bloquant
        if (tokensIn > 0 || tokensOut > 0) {
          try {
            const real = realCreditCost(tokensIn, tokensOut)
            if (real > upfrontCost) {
              await consumeCredits(user.id, real - upfrontCost, 'coach_message', {
                siteId,
                type: 'usage_adjustment',
              })
            } else if (real < upfrontCost) {
              await addPurchasedCredits(user.id, upfrontCost - real, 'coach_message', {
                siteId,
                type: 'usage_adjustment_refund',
              })
            }
          } catch (err) {
            console.error('[coach] Échec ajustement crédits:', err)
          }
        }

        // Compression mémoire tous les 10 messages utilisateur (§16.8)
        if (memoryAllowed) {
          try {
            const userMessageCount = await countUserMessagesForSite(user.id, siteId)
            if (userMessageCount > 0 && userMessageCount % 10 === 0) {
              await inngest.send({
                name: 'coach.memory.compress',
                data: { userId: user.id, siteId },
              })
            }
          } catch (err) {
            console.error('[coach] Échec déclenchement compression mémoire:', err)
          }
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
