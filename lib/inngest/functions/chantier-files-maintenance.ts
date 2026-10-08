import { inngest } from '@/lib/inngest/client'
import {
  cleanupAbandonedUploads,
  cleanupOrphanObjects,
  deleteExpiredFiles,
} from '@/lib/chantiers/file-service'
import { deleteAssistantExchangesBefore } from '@/lib/db/queries/chantier-assistant'
import { ASSISTANT_RETENTION_DAYS } from '@/lib/chantiers/assistant'
import { captureJobFailure } from '@/lib/monitoring'

/**
 * Entretien des fichiers de l'espace chantier, toutes les heures :
 *   1. dépôts commencés jamais confirmés depuis plus de 2 h → retirés du
 *      stockage, ils ne comptent plus dans les 300 Mo ;
 *   2. fichiers arrivés à leur date de suppression (liste des mariés : dépôt
 *      + 30 jours) → retirés du stockage, pas seulement de la base ;
 *   3. objets sans fichier vivant en base (emplacements neutralisés après une
 *      suppression, chantier supprimé) → retirés du bucket ;
 *   4. échanges avec l'assistant de plus de 30 jours → supprimés.
 *
 * L'événement chantier.files.maintenance.requested permet de lancer un
 * passage à la demande (vérification après déploiement).
 *
 * Nouvelle fonction : `pnpm inngest:sync` après déploiement, sinon le cron
 * n'est jamais enregistré chez Inngest (cf. CLAUDE.md §3).
 */
export const chantierFilesMaintenanceFunction = inngest.createFunction(
  {
    id: 'chantier-files-maintenance',
    triggers: [{ cron: '20 * * * *' }, { event: 'chantier.files.maintenance.requested' }],
  },
  async ({ step }) => {
    try {
      const abandoned = await step.run('cleanup-abandoned-uploads', () => cleanupAbandonedUploads({}))
      const expired = await step.run('delete-expired-files', () => deleteExpiredFiles())
      const orphans = await step.run('cleanup-orphan-objects', () => cleanupOrphanObjects())
      const assistantExchanges = await step.run('delete-old-assistant-exchanges', () =>
        deleteAssistantExchangesBefore(new Date(Date.now() - ASSISTANT_RETENTION_DAYS * 86_400_000))
      )
      return { abandoned, expired, orphans, assistantExchanges }
    } catch (err) {
      captureJobFailure('chantier-files-maintenance', err)
      throw err
    }
  }
)
