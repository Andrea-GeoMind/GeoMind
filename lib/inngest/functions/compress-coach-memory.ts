/**
 * Compression de la mémoire de GEO (cahier-des-charges §16.8).
 * Déclenchée tous les 10 messages utilisateur par la route coach.
 * Résume la conversation via Haiku (coût interne, jamais décompté au client)
 * en 4 sections fixes, plafonné à 800 caractères.
 */
import { z } from 'zod'
import { inngest } from '@/lib/inngest/client'
import { getCoachTranscript, upsertCoachMemory, countUserMessagesForSite } from '@/lib/db/queries/coach'
import { callStructured } from '@/lib/ai/structured'

const MEMORY_MAX_CHARS = 800

const MemorySummarySchema = z.object({
  summary: z
    .string()
    .describe(
      'Résumé structuré en 4 sections : Problèmes abordés / Corrections déjà faites / À suivre / Préférences du client'
    ),
})

const SYSTEM_PROMPT = `Tu résumes une conversation entre GEO (assistant de visibilité IA) et son client (TPE/PME).
Produis un résumé de 800 caractères MAXIMUM, en français, structuré en 4 sections courtes :
- Problèmes abordés : les points faibles GEO discutés
- Corrections faites : ce que le client dit avoir déjà corrigé
- À suivre : les prochaines étapes convenues
- Préférences : comment le client aime travailler (ex : "utilise WordPress", "veut des réponses courtes")
Omets une section si elle est vide. Sois factuel, pas de fioritures.`

export const compressCoachMemoryFunction = inngest.createFunction(
  { id: 'compress-coach-memory', triggers: [{ event: 'coach.memory.compress' }] },
  async ({ event, step }) => {
    const { userId, siteId } = event.data as { userId: string; siteId: string }

    const transcript = await step.run('fetch-transcript', () =>
      getCoachTranscript(userId, siteId, 40)
    )

    if (transcript.length === 0) return { skipped: true }

    const conversation = transcript
      .map((m) => `${m.role === 'user' ? 'Client' : 'GEO'} : ${m.content}`)
      .join('\n')
      // borne le volume envoyé à Haiku
      .slice(-12_000)

    const summary = await step.run('summarize', async () => {
      const { data } = await callStructured({
        systemPrompt: SYSTEM_PROMPT,
        userContent: conversation,
        schema: MemorySummarySchema,
      })
      return data.summary.slice(0, MEMORY_MAX_CHARS)
    })

    await step.run('save-memory', async () => {
      const messageCount = await countUserMessagesForSite(userId, siteId)
      await upsertCoachMemory({ userId, siteId, memorySummary: summary, messageCount })
    })

    return { compressed: true }
  }
)
