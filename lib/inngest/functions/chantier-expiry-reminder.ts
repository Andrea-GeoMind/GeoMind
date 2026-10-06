import { inngest } from '@/lib/inngest/client'
import { sendExpiryReminders } from '@/lib/chantiers/alerts'
import { captureJobFailure } from '@/lib/monitoring'

/**
 * Alerte « le lien expire dans 7 jours » quand le client n'a pas cliqué sur
 * « J'ai terminé ». Tous les jours à 7 h UTC (9 h à Paris l'été), une fois par
 * lien. L'événement chantier.expiry.check.requested lance un passage à la
 * demande (vérification après déploiement).
 *
 * Nouvelle fonction : `pnpm inngest:sync` après déploiement (CLAUDE.md §3).
 */
export const chantierExpiryReminderFunction = inngest.createFunction(
  {
    id: 'chantier-expiry-reminder',
    triggers: [{ cron: '0 7 * * *' }, { event: 'chantier.expiry.check.requested' }],
  },
  async ({ step }) => {
    try {
      return await step.run('send-expiry-reminders', () => sendExpiryReminders())
    } catch (err) {
      captureJobFailure('chantier-expiry-reminder', err)
      throw err
    }
  }
)
