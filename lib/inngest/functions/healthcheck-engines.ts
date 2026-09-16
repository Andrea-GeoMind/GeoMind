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
 * Coût : 4 appels/jour sur un prompt très court, soit quelques centimes/mois.
 */

import { inngest } from '@/lib/inngest/client'
import { createEngines } from '@/lib/ai/engines'
import type { IAEngine, IAEngineName } from '@/lib/ai/connectors/base'
import { captureEngineFailure, captureEngineOutage, captureJobFailure } from '@/lib/monitoring'
import { probeEmailDelivery } from '@/lib/email/health'
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

      return { ...engines, email }
    } catch (err) {
      captureJobFailure('healthcheck-engines', err)
      throw err
    }
  }
)
