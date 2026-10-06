import type { ChantierEstablishmentOptions, ChantierOptions } from '@/lib/db/schema'
import type { EstablishmentKind } from '@/lib/chantiers/fields'

/**
 * Deux premiers chantiers, créés par scripts/chantiers/seed-oravis-hse.ts.
 *
 * Adresses proposées : Oravis et Hameau fournies par Andrea le 06/10/2026 ;
 * Florette et Clos du Tuilier relevées le même jour sur leur site (une seule
 * adresse, l'actuelle) ; Barattes : adresse du pied de page commun aux quatre
 * sites, simplifiée par Andrea — Fabrice choisira. « Autre » est toujours
 * ajouté par l'interface.
 */

export interface ChantierSeed {
  clientName: string
  options: ChantierOptions
  establishments: {
    kind: EstablishmentKind
    name: string
    website: string
    options: ChantierEstablishmentOptions
  }[]
}

const ORAVIS_ADDRESSES = [
  '1679 route du Thor, 84470 Châteauneuf-de-Gadagne',
  '1615 route du Thor, 84470 Châteauneuf-de-Gadagne',
  '5388 chemin des Châteaux, 84300 Cavaillon',
  '703 route du Thor, 84300 Cavaillon',
]

export const CHANTIER_SEEDS: readonly ChantierSeed[] = [
  {
    clientName: 'Oravis',
    options: { extraFields: ['oravis.fiche_entrepot'] },
    establishments: [
      {
        kind: 'rental',
        name: 'Oravis',
        website: 'https://oravis.com',
        options: { addressOptions: ORAVIS_ADDRESSES },
      },
      {
        kind: 'rental',
        name: 'Location de carrousel',
        website: 'https://carrousel-location.com',
        options: { addressOptions: ORAVIS_ADDRESSES },
      },
    ],
  },
  {
    clientName: 'Home Sweet Event',
    options: { extraFields: ['hse.liste_maries'] },
    establishments: [
      {
        kind: 'venue',
        name: 'Bastide des Barattes',
        website: 'https://bastidedesbarattes.com',
        options: { addressOptions: ['5388 chemin des Châteaux, 84300 Cavaillon'] },
      },
      {
        kind: 'venue',
        name: 'Mas de Florette',
        website: 'https://masdeflorette.com',
        options: { addressOptions: ['La Verrerie, Quartier Font Verger, 84220 Lioux'] },
      },
      {
        kind: 'venue',
        name: 'Clos du Tuilier',
        website: 'https://closdutuilier.com',
        options: { addressOptions: ['1697 route de Vachères, 04110 Oppedette'] },
      },
      {
        kind: 'venue',
        name: 'Hameau de l’Esperelle',
        website: 'https://hameaudelesperelle.com',
        options: {
          addressOptions: [
            'Combe du Pommier, 84400 Gignac',
            '112 Combe du Pommier, 04150 Simiane-la-Rotonde',
          ],
          extraFields: ['hameau.figaro_reference', 'hameau.figaro_file'],
        },
      },
    ],
  },
]

/** Entrée de création (à valider par chantierInputSchema). */
export function seedToInput(seed: ChantierSeed, geomindAddress: string): unknown {
  return {
    clientName: seed.clientName,
    contactEmail: '',
    geomindAddress,
    extraFields: seed.options.extraFields ?? [],
    establishments: seed.establishments.map((e) => ({
      name: e.name,
      kind: e.kind,
      website: e.website,
      addressOptions: e.options.addressOptions ?? [],
      extraFields: e.options.extraFields ?? [],
    })),
  }
}
