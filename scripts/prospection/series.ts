/**
 * Séries de prospection — un jeu de catégories et ses règles propres.
 *
 * La chaîne était écrite pour la première série (artisans du bâtiment à Lyon),
 * catégories en dur dans `index.ts`. Une deuxième série sur des commerces de
 * proximité ne peut pas réutiliser les mêmes filtres tels quels : le filtre
 * « dépannage d'urgence » écarte sur « 24h » et « SOS », ce qui est juste pour
 * un plombier et faux pour une salle de sport ouverte 24h/24.
 */

export interface Series {
  key: string
  label: string
  area: string
  /** Requêtes Places, une par catégorie. Le tourniquet répartit entre elles. */
  categories: string[]
  /**
   * Filtre dépannage d'urgence. Propre aux métiers du bâtiment : il écarte sur
   * « dépannage », « urgence », « 24h », « SOS ». Appliqué à un commerce, il
   * retirerait à tort une salle de sport ouverte 24h/24.
   */
  excludeEmergency: boolean
  /** Note libre affichée au lancement — sert à documenter les approximations. */
  note?: string
}

export const SERIES: Record<string, Series> = {
  artisans: {
    key: 'artisans',
    label: 'Artisans et métiers du bâtiment — Lyon',
    area: 'Lyon',
    categories: [
      'paysagiste',
      'cuisiniste',
      'électricien rénovation',
      "architecte d'intérieur",
      'photographe mariage',
      'déménageur',
      'menuisier',
      'carreleur',
      'plombier chauffagiste',
    ],
    excludeEmergency: true,
  },
  commerces: {
    key: 'commerces',
    label: 'Commerces et lieux de proximité — Lyon',
    area: 'Lyon',
    categories: [
      'espace de coworking',
      'salle de sport',
      'salle de crossfit',
      'studio de yoga',
      'studio de pilates',
      'barbier',
      'institut de beauté',
      'cave à vin',
      'épicerie fine',
      // Trois requêtes plutôt qu'un « restaurant » générique : au dry-run du
      // 23/09, « restaurant Lyon » ne remontait que des tables installées,
      // toutes au-dessus de 250 avis, et aucune n'a passé le filtre.
      'bistrot',
      'restaurant bistronomique',
      'nouveau restaurant',
    ],
    excludeEmergency: false,
    // Places ne renseigne pas la date d'ouverture : « récent » ne peut pas être
    // filtré directement. Le plafond de 250 avis en tient lieu — un restaurant
    // lyonnais ouvert depuis plusieurs années en dépasse largement le millier.
    // C'est une approximation, pas une mesure.
    note:
      "restaurants : Places ne donne pas la date d'ouverture — « récent » est approché par le plafond de 250 avis, " +
      'qu\'une table lyonnaise installée dépasse largement',
  },
}

export function getSeries(key: string): Series {
  const s = SERIES[key]
  if (!s) {
    throw new Error(
      `Série inconnue « ${key} ». Disponibles : ${Object.keys(SERIES).join(', ')}`
    )
  }
  return s
}
