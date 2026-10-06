import { inngest } from '@/lib/inngest/client'
import { cleanupAbandonedUploads, deleteExpiredFiles } from '@/lib/chantiers/file-service'
import { captureJobFailure } from '@/lib/monitoring'

/**
 * Entretien des fichiers de l'espace chantier, toutes les heures :
 *   1. dépôts commencés jamais confirmés depuis plus de 2 h → retirés du
 *      stockage, ils ne comptent plus dans les 300 Mo ;
 *   2. fichiers arrivés à leur date de suppression (liste des mariés : dépôt
 *      + 30 jours) → retirés du stockage, pas seulement de la base.
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
      return { abandoned, expired }
    } catch (err) {
      captureJobFailure('chantier-files-maintenance', err)
      throw err
    }
  }
)
