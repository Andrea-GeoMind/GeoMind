import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { canSendCoachMessage } from '@/lib/quotas'
import { insertCoachMessage, getCoachMessages } from '@/lib/db/queries/coach'
import { buildCoachContext } from '@/lib/analysis/coach-context'
import { buildCoachSystemPrompt } from '@/lib/ai/prompts/coach'
import { env } from '@/lib/env'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const COACH_MODEL = 'anthropic/claude-haiku-4-5'
const MAX_HISTORY = 20

type RequestBody = {
  content: string
  analysisId: string
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

  const allowed = await canSendCoachMessage(user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Quota atteint. Passez au plan Pro pour continuer.' },
      { status: 429 }
    )
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { content, analysisId } = body
  if (!content?.trim() || !analysisId) {
    return NextResponse.json({ error: 'Champs manquants : content, analysisId' }, { status: 400 })
  }

  await insertCoachMessage({
    siteId,
    analysisId,
    userId: user.id,
    role: 'user',
    content: content.trim(),
  })

  const [coachContext, history] = await Promise.all([
    buildCoachContext(siteId),
    getCoachMessages(siteId, analysisId, MAX_HISTORY + 1),
  ])

  const systemPrompt = buildCoachSystemPrompt(coachContext)

  const historyMessages = history
    .slice(0, -1)
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const messages = [
    ...historyMessages,
    { role: 'user' as const, content: content.trim() },
  ]

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = ''

      try {
        const orResponse = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://geomind.fr',
            'X-Title': 'GeoMind Coach',
          },
          body: JSON.stringify({
            model: COACH_MODEL,
            messages,
            system: systemPrompt,
            stream: true,
            max_tokens: 1024,
          }),
        })

        if (!orResponse.ok) {
          const errText = await orResponse.text()
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
                choices: Array<{ delta: { content?: string } }>
              }
              const delta = parsed.choices[0]?.delta?.content ?? ''
              if (delta) {
                fullContent += delta
                controller.enqueue(new TextEncoder().encode(delta))
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        controller.error(err)
        return
      }

      if (fullContent) {
        await insertCoachMessage({
          siteId,
          analysisId,
          userId: user.id,
          role: 'assistant',
          content: fullContent,
        })
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
