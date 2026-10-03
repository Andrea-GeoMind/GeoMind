/**
 * Healthcheck quotidien des moteurs IA.
 *
 * Raison d'être : OpenRouter a retiré le modèle utilisé par le connecteur
 * ChatGPT ; celui-ci a renvoyé 404 sur chaque appel pendant des semaines sans
 * que personne ne le voie, parce qu'une analyse « réussit » même quand un
 * moteur ne répond jamais (l'erreur est avalée pour ne pas faire échouer le
 * reste). Ce cron interroge chaque moteur avec une question courte et alerte
 * Sentry dès qu'un moteur tombe — avant que ce soit un client qui le découvre.
 *
 * Il sonde aussi l'envoi d'email et la base. Cette dernière sonde a une double
 * utilité : vérifier que la base répond, et la garder éveillée. Le plan gratuit
 * de Supabase met un projet en pause après sept jours sans requête, ce qui est
 * arrivé le 2026-10-03 — le healthcheck tournait, mais ne touchait que les
 * moteurs et Resend, donc Supabase ne voyait aucune activité.
 *
 * Coût : 4 appels/jour sur un prompt très court, soit quelques centimes/mois.
 */

import { inngest } from '@/lib/inngest/client'
import { createEngines } from '@/lib/ai/engines'
import type { IAEngine, IAEngineName } from '@/lib/ai/connectors/base'
import { captureEngineFailure, captureEngineOutage, captureJobFailure } from '@/lib/monitoring'
import { probeEmailDelivery } from '@/lib/email/health'
import { probeDatabase, SLOW_QUERY_MS } from '@/lib/db/health'
import { logAudit } from '@/lib/db/queries/audit-log'
import { captureEmailFailure } from '@/lib/monitoring'

/** Question courte mais réaliste : doit déclencher une recherche web et des sources. */
const PROBE_PROMPT =
  'Quels sont les principaux moteurs de recherche utilisés en France ? Réponds en une phrase avec tes sources.'

/**
 * Au-delà, on considère le moteur dégradé même s'il finit par répondre.
 * Calibré sur mesure réelle : ChatGPT avec recherche web tourne autour de
 * 27 s, Claude et Gemini sous 5 s. Un seuil à 30 s déclencherait des fausses
 * alertes quotidiennes sur ChatGPT — 60 s ne se déclenche que sur un vrai
 * décrochage.
 */
const SLOW_RESPONSE_MS = 60_000

export interface EngineHealth {
  engine: IAEngineName
  ok: boolean
  /** Le moteur a répondu mais sans aucune source exploitable. */
  degraded: boolean
  durationMs: number
  error?: string
}

export async function probeEngine(engine: IAEngine): Promise<EngineHealth> {
  const startedAt = Date.now()
  try {
    const response = await engine.query(PROBE_PROMPT)
    const durationMs = Date.now() - startedAt
    return {
      engine: engine.name,
      ok: true,
      // Pas de sources, ou réponse anormalement lente : le moteur répond mal.
      degraded: response.partial_response || durationMs > SLOW_RESPONSE_MS,
      durationMs,
    }
  } catch (err) {
    return {
      engine: engine.name,
      ok: false,
      degraded: false,
      durationMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function runEngineHealthcheck(): Promise<{
  checkedAt: string
  healthy: number
  total: number
  results: EngineHealth[]
}> {
  const engines = createEngines()

  const results = await Promise.all(engines.map(probeEngine))

  for (const result of results) {
    if (!result.ok) {
      captureEngineFailure(result.engine, new Error(result.error ?? 'échec inconnu'), {
        step: 'healthcheck',
      })
      // Sonde unitaire : 1 tentative, 1 échec → panne franche du moteur.
      captureEngineOutage(result.engine, {
        attempted: 1,
        failed: 1,
        step: 'healthcheck',
      })
    } else if (result.degraded) {
      captureEngineFailure(
        result.engine,
        new Error(
          `Moteur dégradé : réponse sans sources ou lente (${result.durationMs} ms)`
        ),
        { step: 'healthcheck-degraded' }
      )
    }
  }

  const healthy = results.filter((r) => r.ok && !r.degraded).length
  console.log(
    `[healthcheck] ${healthy}/${results.length} moteurs sains —`,
    results.map((r) => `${r.engine}:${r.ok ? (r.degraded ? 'dégradé' : 'ok') : 'KO'}`).join(' ')
  )

  return {
    checkedAt: new Date().toISOString(),
    healthy,
    total: results.length,
    results,
  }
}

/** Cron quotidien — 5 h 30 UTC, avant le monitoring hebdomadaire de 6 h. */
export const healthcheckEnginesFunction = inngest.createFunction(
  { id: 'healthcheck-engines', triggers: [{ cron: '30 5 * * *' }] },
  async ({ step }) => {
    try {
      const engines = await step.run('probe-engines', runEngineHealthcheck)

      // Sonde d'envoi d'email : une clé Resend révoquée ne se voit nulle part
      // ailleurs, `sendEmail` échouant en silence par conception.
      const email = await step.run('probe-email', async () => {
        const health = await probeEmailDelivery()
        if (!health.ok) {
          console.error('[healthcheck] envoi d’email indisponible :', health.error)
          captureEmailFailure('healthcheck', new Error(health.error ?? 'échec inconnu'), {
            to: 'n/a',
          })
        } else {
          console.log('[healthcheck] envoi d’email : ok')
        }
        return health
      })

      // Sonde de la base. Placée en premier dans l'ordre d'importance : sans
      // elle, l'application ne sert plus à rien, et c'est la seule qui compte
      // comme activité aux yeux de Supabase.
      const database = await step.run('probe-database', async () => {
        const health = await probeDatabase()
        if (!health.ok) {
          console.error('[healthcheck] base injoignable :', health.error)
          captureJobFailure(
            'healthcheck-database',
            new Error(health.error ?? 'base injoignable')
          )
        } else if (health.durationMs > SLOW_QUERY_MS) {
          console.warn(`[healthcheck] base lente : ${health.durationMs} ms`)
          captureJobFailure(
            'healthcheck-database-slow',
            new Error(`Base lente : ${health.durationMs} ms pour un select 1`)
          )
        } else {
          console.log(`[healthcheck] base : ok (${health.durationMs} ms)`)
        }
        return health
      })

      // Trace durable du passage. C'est ce qui permet de répondre « oui, il a
      // tourné hier » sans accès au tableau de bord Inngest — et l'écriture
      // compte elle aussi comme activité pour Supabase.
      await step.run('record-run', () =>
        logAudit('healthcheck.ran', null, {
          enginesHealthy: engines.healthy,
          enginesTotal: engines.total,
          emailOk: email.ok,
          databaseOk: database.ok,
          databaseMs: database.durationMs,
        })
      )

      return { ...engines, email, database }
    } catch (err) {
      captureJobFailure('healthcheck-engines', err)
      throw err
    }
  }
)
