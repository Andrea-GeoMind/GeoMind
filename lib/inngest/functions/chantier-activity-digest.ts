import { inngest } from '@/lib/inngest/client'
import { sendActivityDigest } from '@/lib/chantiers/alerts'
import { captureJobFailure } from '@/lib/monitoring'

/**
 * E-mail groupé de l'espace chantier : un par chantier et par vague.
 *
 * Chaque saisie, fichier reçu ou « J'ai terminé » envoie l'événement
 * chantier.activity.recorded. Le debounce attend 10 minutes sans nouvelle
 * activité sur le même chantier avant de partir (au plus 30 minutes si le
 * client ne s'arrête pas) : une séance de saisie donne un seul e-mail.
 *
 * Nouvelle fonction : `pnpm inngest:sync` après déploiement (CLAUDE.md §3).
 */
export const chantierActivityDigestFunction = inngest.createFunction(
  {
    id: 'chantier-activity-digest',
    triggers: [{ event: 'chantier.activity.recorded' }],
    debounce: { key: 'event.data.chantierId', period: '10m', timeout: '30m' },
  },
  async ({ event, step }) => {
    const chantierId = String(event.data.chantierId ?? '')
    try {
      return await step.run('send-digest', () => sendActivityDigest(chantierId))
    } catch (err) {
      captureJobFailure('chantier-activity-digest', err, { chantierId })
      throw err
    }
  }
)
