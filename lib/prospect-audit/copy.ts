/**
 * Textes fixes de l'audit prospect (page et feuille A4). Le prix vient de
 * lib/plans.ts, le lien de rendez-vous de l'environnement (AUDIT_BOOKING_URL).
 */

import { LOCAL_VISIBILITY_SERVICE } from '@/lib/plans'

export const AUDIT_CONTACT = {
  name: 'Andrea Schwertz',
  phone: '07 66 08 70 99',
  phoneHref: 'tel:+33766087099',
  email: 'andrea@geomind.fr',
  site: 'geomind.fr',
} as const

export const OFFER_TITLE = `Visibilité locale : ${LOCAL_VISIBILITY_SERVICE.price} €, payés à la livraison, en une semaine`

/** Ce que comprend la prestation ; la page du site dépend de ce qui existe. */
export function offerItems(hasOwnSite: boolean): string[] {
  return [
    'Votre fiche Google complétée et corrigée : catégorie, description, horaires, prestations, photos.',
    "Vos avis : un QR code pour le comptoir et un message type à envoyer à vos clients après leur passage.",
    '2 à 3 annuaires de votre secteur, créés ou complétés.',
    hasOwnSite
      ? 'Une page de votre site optimisée : vos prestations, vos prix, votre quartier, lisibles par Google et les IA.'
      : 'Une page web à votre nom, avec vos prestations et vos prix, reliée à votre fiche Google.',
    'Les mêmes informations partout sur le web : nom, adresse, téléphone, horaires.',
    'Votre présence dans les sources que lisent les IA : annuaires et sites de référence de votre métier.',
  ]
}

export const HOW_IT_WORKS = [
  '15 minutes ensemble pour faire le point.',
  "Je m'occupe de tout dans la semaine.",
  'Vous payez à la livraison, une fois que vous avez vu le résultat.',
] as const

/** Date au format JJ/MM/AAAA, heure de Paris. */
export function formatAuditDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function honestyNotice(createdAt: string): string {
  return `Réponses obtenues le ${formatAuditDate(createdAt)} via les IA ; elles varient d'une recherche à l'autre. Aucun résultat n'est garanti.`
}

/** « 1er », « 2e », « 3e »… pour un rang dans une liste. */
export function ordinal(n: number): string {
  return n === 1 ? '1er' : `${n}e`
}

/** Espaces insécables de la typographie française (« ? » jamais seul en début de ligne). */
export function frenchSpacing(text: string): string {
  return text.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0')
}
