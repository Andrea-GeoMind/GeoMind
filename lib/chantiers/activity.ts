import 'server-only'
import { inngest } from '@/lib/inngest/client'
import { captureChantierFailure } from '@/lib/monitoring'

/**
 * Signale une activité du client (saisie, fichier, « J'ai terminé »). L'e-mail
 * groupé part 10 minutes après la dernière (chantier-activity-digest). Un
 * échec d'envoi de l'événement ne doit jamais faire échouer la saisie.
 */
export async function recordChantierActivity(chantierId: string): Promise<void> {
  try {
    await inngest.send({ name: 'chantier.activity.recorded', data: { chantierId } })
  } catch (err) {
    captureChantierFailure('activity_event', err, { chantierId })
  }
}
