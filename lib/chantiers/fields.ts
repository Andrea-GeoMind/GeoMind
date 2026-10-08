import { z } from 'zod'
import type { ChantierEstablishmentOptions, ChantierOptions } from '@/lib/db/schema'

/**
 * Catalogue des champs de l'espace client de chantier.
 *
 * Les champs ne sont pas en base : chaque réponse est une ligne de
 * chantier_answers (fieldKey + valeur JSON) validée par le schéma Zod de son
 * type. Ajouter un champ ne demande donc aucune migration. Les clés sont
 * stables : renommer une clé fait perdre les réponses déjà saisies.
 *
 * Les champs `extra` n'apparaissent que sur les chantiers qui les activent
 * (options.extraFields du chantier ou de l'établissement).
 *
 * Tous les textes des champs sont ici (ceux des pages dans copy.ts), pour être
 * relus d'un bloc. [ADRESSE] est remplacé à l'affichage par fillCopy().
 */

export type EstablishmentKind = 'venue' | 'rental'
export type FieldSection = 'access' | 'info' | 'files' | 'decisions'
export type FieldScope = 'chantier' | 'establishment'
export type FileCategory = 'photo' | 'logo' | 'document' | 'personal_data'
export type AcceptedFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic'
  | 'application/pdf'
  | 'text/csv'

export const IMAGE_OR_PDF: readonly AcceptedFileType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]
export const IMAGES_ONLY: readonly AcceptedFileType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]

/** Choix « autre » de l'adresse officielle, toujours proposé en plus de la liste. */
export const ADDRESS_OTHER = '__other__'

export const PROVIDER_CATEGORIES = [
  { id: 'photographe', label: 'Photographe' },
  { id: 'dj', label: 'DJ' },
  { id: 'traiteur', label: 'Traiteur' },
  { id: 'planner', label: 'Wedding planner' },
  { id: 'autre', label: 'Autre' },
] as const

interface BaseField {
  key: string
  label: string
  help?: string
  section: FieldSection
  scope: FieldScope
  /** Types d'établissement concernés (scope establishment). Absent = tous. */
  kinds?: readonly EstablishmentKind[]
  /** Compté comme manquant tant qu'il n'est pas rempli */
  required: boolean
  /** Sans lui, GeoMind ne peut pas démarrer le chantier */
  blocking?: boolean
  /** N'apparaît que si le chantier ou l'établissement l'active */
  extra?: boolean
}

/**
 * Deuxième réponse possible à un accès, à côté de « C'est fait ».
 * - resolves : la réponse vaut champ rempli (et lève le blocage) ;
 * - alert : GeoMind est prévenu dans le mail groupé (le client a besoin d'aide).
 */
export interface AccessAlternative {
  value: 'absent' | 'unsure'
  label: string
  resolves: boolean
  alert: boolean
}

const NOT_AVAILABLE: AccessAlternative = {
  value: 'absent',
  label: 'Je n’ai pas cet outil ou je ne sais pas',
  resolves: true,
  alert: false,
}

export interface DecisionOption {
  id: string
  label: string
}

export type FieldDef = BaseField &
  (
    | { type: 'access'; alternative: AccessAlternative }
    | { type: 'text'; multiline: boolean; maxLength: number; placeholder?: string }
    | { type: 'integer'; unit?: string }
    | { type: 'euros' }
    | { type: 'yesNoDetail'; detailLabel: string }
    | { type: 'list'; itemLabel: string }
    | { type: 'priceList' }
    | { type: 'faq' }
    | { type: 'contact' }
    | { type: 'contacts'; withCategory: boolean }
    | { type: 'reference' }
    | { type: 'decision'; explanation: string; options: readonly DecisionOption[] }
    | { type: 'address'; explanation: string }
    | {
        type: 'agreement'
        explanation: string
        agreementText: string
        agreementVersion: string
      }
    | {
        /** Case à cocher horodatée par le serveur, comme l'accord d'avis */
        type: 'attestation'
        attestationText: string
        attestationVersion: string
      }
    | {
        type: 'file'
        category: FileCategory
        multiple: boolean
        accept: readonly AcceptedFileType[]
        /** Suppression automatique N jours après le dépôt */
        retentionDays?: number
        /** Mention affichée à côté du champ (ex. RGPD) */
        notice?: string
        /** Le client ne peut plus rouvrir le fichier après dépôt */
        ownerOnlyDownload?: boolean
        /** Attestation (champ du chantier) à signer avant le premier dépôt */
        requiresAttestation?: string
      }
  )

export type FieldType = FieldDef['type']

const YES_NO: readonly DecisionOption[] = [
  { id: 'yes', label: 'Oui' },
  { id: 'no', label: 'Non' },
]

// ─── Catalogue ────────────────────────────────────────────────────────────────

const ACCESS_FIELDS: FieldDef[] = [
  {
    key: 'access.gbp',
    label: 'Fiche Google : GeoMind ajouté comme administrateur',
    help: 'Sur votre fiche Google, ouvrez « Paramètres » puis « Personnes et accès », et ajoutez [ADRESSE] avec le rôle « Administrateur ».',
    section: 'access',
    scope: 'establishment',
    required: true,
    blocking: true,
    type: 'access',
    // Pas d'échappatoire : sans cet accès, rien ne démarre. Le client qui
    // bloque le dit, et GeoMind l'aide.
    alternative: {
      value: 'unsure',
      label: 'Je ne sais pas comment faire',
      resolves: false,
      alert: true,
    },
  },
  {
    key: 'access.wordpress',
    label: 'WordPress : compte administrateur créé pour GeoMind',
    help: 'Dans WordPress, « Comptes » puis « Ajouter », avec [ADRESSE] et le rôle « Administrateur ». WordPress envoie lui-même l’invitation : vous n’avez aucun mot de passe à nous transmettre.',
    section: 'access',
    scope: 'establishment',
    required: true,
    blocking: true,
    type: 'access',
    alternative: {
      value: 'absent',
      label: 'Mon site n’est pas sur WordPress',
      resolves: true,
      alert: false,
    },
  },
  {
    key: 'access.search_console',
    label: 'Google Search Console : accès ajouté',
    help: 'Dans Search Console, « Paramètres » puis « Utilisateurs et autorisations » : ajoutez [ADRESSE] avec le droit « Total ».',
    section: 'access',
    scope: 'establishment',
    required: true,
    type: 'access',
    alternative: NOT_AVAILABLE,
  },
  {
    key: 'access.analytics',
    label: 'Google Analytics : accès ajouté',
    help: 'Dans Analytics, « Administration » puis « Gestion des accès à la propriété » : ajoutez [ADRESSE] avec le rôle « Lecteur ».',
    section: 'access',
    scope: 'establishment',
    required: true,
    type: 'access',
    alternative: NOT_AVAILABLE,
  },
  {
    key: 'access.hosting',
    label: 'Hébergeur du site : accès délégué ou contact technique transmis',
    help: 'La plupart des hébergeurs (OVH, o2switch, Ionos…) permettent d’ajouter [ADRESSE] comme contact technique, sans partager votre compte.',
    section: 'access',
    scope: 'establishment',
    required: true,
    type: 'access',
    alternative: {
      value: 'absent',
      label: 'Je ne sais pas qui héberge le site',
      resolves: true,
      alert: false,
    },
  },
  {
    key: 'access.webmaster',
    label: 'Contact de votre webmaster',
    help: 'La personne ou l’agence qui s’occupe de vos sites. Laissez vide si vous les gérez vous-même.',
    section: 'access',
    scope: 'chantier',
    required: false,
    type: 'contact',
  },
]

const VENUE_FIELDS: FieldDef[] = [
  {
    key: 'venue.unique',
    label: 'Ce qui rend ce lieu unique',
    help: 'En deux ou trois phrases, ce que vous diriez à des mariés qui hésitent avec un autre domaine.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'text',
    multiline: true,
    maxLength: 1000,
  },
  {
    key: 'venue.capacite_assise',
    label: 'Capacité en repas assis',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'integer',
    unit: 'invités',
  },
  {
    key: 'venue.capacite_debout',
    label: 'Capacité en cocktail debout',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'integer',
    unit: 'invités',
  },
  {
    key: 'venue.chambres',
    label: 'Chambres sur place',
    help: 'Indiquez 0 s’il n’y en a pas.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'integer',
    unit: 'chambres',
  },
  {
    key: 'venue.gites',
    label: 'Gîtes',
    help: 'Indiquez 0 s’il n’y en a pas.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'integer',
    unit: 'gîtes',
  },
  {
    key: 'venue.couchages',
    label: 'Couchages au total',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'integer',
    unit: 'couchages',
  },
  {
    key: 'venue.piscine',
    label: 'Piscine',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'yesNoDetail',
    detailLabel: 'Dimensions, accès des invités, horaires',
  },
  {
    key: 'venue.salle',
    label: 'Salle de réception couverte',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'yesNoDetail',
    detailLabel: 'Surface, capacité, équipements',
  },
  {
    key: 'venue.plan_b_pluie',
    label: 'Plan B en cas de pluie',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'text',
    multiline: true,
    maxLength: 2000,
  },
  {
    key: 'venue.acces',
    label: 'Accès',
    help: 'Distance de la gare TGV d’Avignon et de l’aéroport le plus proche, parking.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'text',
    multiline: true,
    maxLength: 1000,
  },
  {
    key: 'venue.formule',
    label: 'Formule proposée',
    help: 'Ce qui est inclus : durée de location, exclusivité, mobilier, ménage, horaires de fin…',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'text',
    multiline: true,
    maxLength: 4000,
  },
  {
    key: 'venue.prix_basse_saison',
    label: 'Prix de départ en basse saison',
    help: 'Le prix « à partir de » que vous acceptez d’afficher publiquement.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'euros',
  },
  {
    key: 'venue.prix_haute_saison',
    label: 'Prix de départ en haute saison',
    help: 'Le prix « à partir de » que vous acceptez d’afficher publiquement.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'euros',
  },
  {
    key: 'venue.seminaire',
    label: 'Accueil de séminaires',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: true,
    type: 'yesNoDetail',
    detailLabel: 'Capacité en réunion, équipements, formules',
  },
  {
    key: 'venue.prestataires',
    label: 'Prestataires recommandés',
    help: 'Photographes, DJ, traiteurs, wedding planners avec qui vous travaillez.',
    section: 'info',
    scope: 'establishment',
    kinds: ['venue'],
    required: false,
    type: 'contacts',
    withCategory: true,
  },
]

const RENTAL_FIELDS: FieldDef[] = [
  {
    key: 'rental.zones_livraison',
    label: 'Zones de livraison',
    section: 'info',
    scope: 'establishment',
    kinds: ['rental'],
    required: true,
    type: 'list',
    itemLabel: 'Commune, département ou rayon (ex. « 50 km autour de Cavaillon »)',
  },
  {
    key: 'rental.prestations',
    label: 'Prestations et prix indicatifs',
    section: 'info',
    scope: 'establishment',
    kinds: ['rental'],
    required: true,
    type: 'priceList',
  },
  {
    key: 'rental.convives_max',
    label: 'Nombre maximal de convives que vous pouvez équiper',
    section: 'info',
    scope: 'establishment',
    kinds: ['rental'],
    required: true,
    type: 'integer',
    unit: 'convives',
  },
  {
    key: 'rental.faq',
    label: 'Questions fréquentes de vos clients',
    help: 'Les questions qu’on vous pose le plus, avec la réponse que vous donnez.',
    section: 'info',
    scope: 'establishment',
    kinds: ['rental'],
    required: true,
    type: 'faq',
  },
]

const COMMON_FIELDS: FieldDef[] = [
  {
    key: 'common.partenaires',
    label: 'Partenaires',
    help: 'Lieux, prestataires ou marques avec qui vous travaillez régulièrement.',
    section: 'info',
    scope: 'establishment',
    required: false,
    type: 'contacts',
    withCategory: false,
  },
]

const FILE_FIELDS: FieldDef[] = [
  {
    key: 'files.photos_rights',
    label: 'Droits sur les photos',
    section: 'files',
    scope: 'chantier',
    required: true,
    type: 'attestation',
    attestationText:
      'Je confirme avoir le droit d’utiliser ces photos sur mes sites et mes fiches (photos prises par moi, ou avec l’accord du photographe).',
    attestationVersion: 'photos-2026-10',
  },
  {
    key: 'files.logo',
    label: 'Logo',
    help: 'En PNG ou en PDF de préférence. Les fichiers SVG, AI et EPS ne sont pas acceptés : exportez-les en PDF.',
    section: 'files',
    scope: 'establishment',
    required: true,
    type: 'file',
    category: 'logo',
    multiple: true,
    accept: IMAGE_OR_PDF,
  },
  {
    key: 'files.photos',
    label: 'Photos',
    help: 'Les plus belles, en pleine résolution. Indiquez le nom du photographe dans le nom du fichier si vous le connaissez.',
    section: 'files',
    scope: 'establishment',
    required: true,
    type: 'file',
    category: 'photo',
    multiple: true,
    accept: IMAGES_ONLY,
    requiresAttestation: 'files.photos_rights',
  },
  {
    key: 'files.documents',
    label: 'Documents',
    help: 'Plaquette, grille tarifaire, plan d’accès…',
    section: 'files',
    scope: 'establishment',
    required: false,
    type: 'file',
    category: 'document',
    multiple: true,
    accept: IMAGE_OR_PDF,
  },
]

const DECISION_FIELDS: FieldDef[] = [
  {
    key: 'decision.adresse',
    label: 'Adresse officielle',
    section: 'decisions',
    scope: 'establishment',
    required: true,
    blocking: true,
    type: 'address',
    explanation:
      'C’est l’adresse que Google, les annuaires et les IA doivent tous afficher à l’identique. Une adresse qui varie d’une source à l’autre fait douter les moteurs de l’existence même de l’établissement. Choisissez celle où vous recevez vos clients.',
  },
  {
    key: 'decision.robots_ia',
    label: 'Robots des IA',
    section: 'decisions',
    scope: 'establishment',
    required: true,
    blocking: true,
    type: 'decision',
    explanation:
      'ChatGPT, Perplexity, Claude ou Gemini envoient des robots lire les sites. Bloqués, ils ne peuvent ni lire ni citer vos pages. Les autoriser ne leur ouvre que ce qui est déjà public sur votre site.',
    options: [
      { id: 'yes', label: 'Oui, autoriser les robots des IA' },
      { id: 'no', label: 'Non, les bloquer' },
    ],
  },
  {
    key: 'decision.etude_de_cas',
    label: 'Étude de cas',
    section: 'decisions',
    scope: 'chantier',
    required: true,
    type: 'decision',
    explanation:
      'Nous autorisez-vous à présenter ce chantier comme étude de cas sur geomind.fr (nom des établissements, actions menées, résultats chiffrés) ? Vous relirez le texte avant toute publication et pourrez retirer votre accord à tout moment.',
    options: YES_NO,
  },
  {
    key: 'decision.avis',
    label: 'Démarche d’avis',
    section: 'decisions',
    scope: 'chantier',
    required: true,
    type: 'agreement',
    explanation:
      'Quand ChatGPT recommande un lieu, il affiche sa note et son nombre d’avis Google : nous l’avons constaté dans nos tests. Nous vous proposons de solliciter vos clients des deux dernières saisons, avec des messages que vous validez. Aucun avis n’est rédigé, acheté ou filtré : chacun reste libre d’écrire ce qu’il pense.',
    agreementText:
      'J’accepte que GeoMind mette en place avec moi une démarche de demande d’avis auprès de mes clients, selon les conditions décrites ci-dessus. Chaque message sera validé par moi avant envoi.',
    agreementVersion: 'avis-2026-10',
  },
]

/** Champs propres à certains chantiers, activés par options.extraFields. */
const EXTRA_FIELDS: FieldDef[] = [
  {
    key: 'oravis.fiche_entrepot',
    label: 'Fiche Google « Oravis, Entrepôt »',
    section: 'decisions',
    scope: 'chantier',
    required: true,
    extra: true,
    type: 'decision',
    explanation:
      'Une seconde fiche Google existe au nom d’« Oravis, Entrepôt ». Deux fiches pour une même entreprise dispersent les avis et brouillent l’adresse. Soit vous la revendiquez et nous la faisons supprimer, soit nous la signalons à Google comme doublon. Dans les deux cas, les avis éventuels de cette fiche seront perdus.',
    options: [
      { id: 'claim', label: 'Je la revendique, puis vous la faites supprimer' },
      { id: 'duplicate', label: 'Vous la signalez à Google comme doublon' },
    ],
  },
  {
    key: 'hameau.figaro_reference',
    label: 'Article du Figaro Magazine',
    help: 'Date de parution, titre et lien si l’article est en ligne.',
    section: 'info',
    scope: 'establishment',
    required: true,
    extra: true,
    type: 'reference',
  },
  {
    key: 'hameau.figaro_file',
    label: 'Article du Figaro Magazine (scan ou PDF)',
    help: 'Facultatif, si l’article n’est pas en ligne.',
    section: 'files',
    scope: 'establishment',
    required: false,
    extra: true,
    type: 'file',
    category: 'document',
    multiple: false,
    accept: IMAGE_OR_PDF,
  },
  {
    key: 'hse.liste_maries',
    label: 'Liste des mariés des deux dernières saisons',
    help: 'Nom, adresse e-mail et date de l’événement suffisent. En CSV (export de tableur) ou en PDF.',
    section: 'files',
    scope: 'chantier',
    required: false,
    extra: true,
    type: 'file',
    category: 'personal_data',
    multiple: false,
    accept: ['text/csv', 'application/pdf'],
    retentionDays: 30,
    ownerOnlyDownload: true,
    notice:
      'Données personnelles. Home Sweet Event est responsable du traitement de cette liste. GeoMind agit en sous-traitant, pour votre compte et pour la seule démarche d’avis. Une fois déposée, la liste n’est plus consultable depuis cet espace : seule GeoMind peut la télécharger. Elle est supprimée automatiquement 30 jours après le dépôt, et vous pouvez la supprimer vous-même avant. Chaque marié pourra se désinscrire depuis le message qu’il recevra. N’y mettez que le nom, l’adresse e-mail et la date de l’événement.',
  },
]

export const FIELD_CATALOG: readonly FieldDef[] = [
  ...ACCESS_FIELDS,
  ...VENUE_FIELDS,
  ...RENTAL_FIELDS,
  ...COMMON_FIELDS,
  ...FILE_FIELDS,
  ...DECISION_FIELDS,
  ...EXTRA_FIELDS,
]

const BY_KEY = new Map(FIELD_CATALOG.map((f) => [f.key, f]))

export function getField(key: string): FieldDef | undefined {
  return BY_KEY.get(key)
}

/**
 * Le client a-t-il choisi une réponse qui demande l'intervention de GeoMind
 * (ex. « Je ne sais pas comment faire » pour la fiche Google) ?
 */
export function needsHelp(field: FieldDef, value: unknown): boolean {
  return field.type === 'access' && field.alternative.alert && value === field.alternative.value
}

/** Champs du chantier entier (scope chantier), extras activés compris. */
export function chantierFields(options: ChantierOptions): FieldDef[] {
  const extras = new Set(options.extraFields ?? [])
  return FIELD_CATALOG.filter(
    (f) => f.scope === 'chantier' && (!f.extra || extras.has(f.key))
  )
}

/** Champs d'un établissement selon son type, extras activés compris. */
export function establishmentFields(
  kind: EstablishmentKind,
  options: ChantierEstablishmentOptions
): FieldDef[] {
  const extras = new Set(options.extraFields ?? [])
  return FIELD_CATALOG.filter(
    (f) =>
      f.scope === 'establishment' &&
      (!f.kinds || f.kinds.includes(kind)) &&
      (!f.extra || extras.has(f.key))
  )
}

/**
 * Extras demandés qui n'existent pas, ou pas à ce niveau. Sert à valider la
 * création d'un chantier : une faute de frappe dans extraFields ferait
 * disparaître le champ sans bruit.
 */
export function invalidExtraFields(keys: readonly string[], scope: FieldScope): string[] {
  return keys.filter((k) => {
    const f = BY_KEY.get(k)
    return !f || !f.extra || f.scope !== scope
  })
}

// ─── Valeurs ──────────────────────────────────────────────────────────────────

const shortText = z.string().trim().max(300)
const mediumText = z.string().trim().max(2000)

const contactSchema = z.object({
  name: shortText,
  email: z.union([z.literal(''), z.email().max(254)]),
  phone: z.string().trim().max(40),
})

const contactsItemSchema = z.object({
  category: z.enum(PROVIDER_CATEGORIES.map((c) => c.id) as [string, ...string[]]).optional(),
  name: shortText,
  website: z.string().trim().max(500),
  contact: shortText,
})

const decisionInputSchema = (options: readonly DecisionOption[]) =>
  z.object({
    choice: z.enum(options.map((o) => o.id) as [string, ...string[]]).nullable(),
    comment: mediumText,
  })

const agreementInputSchema = z.object({
  choice: z.enum(['yes', 'no']).nullable(),
  comment: mediumText,
  signerName: shortText,
})

const attestationInputSchema = z.object({ accepted: z.boolean() })

/** Horodatage posé par le serveur, jamais fourni par le client */
export interface ServerSignature {
  textVersion: string
  signedAt: string
  ipTruncated: string
}

const signatureSchema = z
  .object({ textVersion: z.string(), signedAt: z.string(), ipTruncated: z.string() })
  .nullable()

/** Accord tel qu'il est conservé : la saisie, plus l'horodatage posé par le serveur. */
export interface StoredAgreement {
  choice: 'yes' | 'no' | null
  comment: string
  signerName: string
  signature: ServerSignature | null
}

/** Attestation telle qu'elle est conservée. */
export interface StoredAttestation {
  accepted: boolean
  signature: ServerSignature | null
}

/**
 * Schéma Zod de la saisie du client pour un champ. Les fichiers n'ont pas de
 * valeur : ils passent par chantier_files.
 */
export function inputSchemaFor(
  field: FieldDef,
  establishmentOptions: ChantierEstablishmentOptions = {}
): z.ZodType | null {
  switch (field.type) {
    case 'access':
      return z.enum(['given', field.alternative.value]).nullable()
    case 'text':
      return z.string().trim().max(field.maxLength)
    case 'integer':
      return z.number().int().min(0).max(100_000).nullable()
    case 'euros':
      return z.number().int().min(0).max(1_000_000).nullable()
    case 'yesNoDetail':
      return z.object({ value: z.boolean().nullable(), detail: mediumText })
    case 'list':
      return z.array(shortText).max(50)
    case 'priceList':
      return z.array(z.object({ label: shortText, price: z.string().trim().max(100) })).max(100)
    case 'faq':
      return z.array(z.object({ question: shortText, answer: mediumText })).max(50)
    case 'contact':
      return contactSchema
    case 'contacts':
      return z.array(contactsItemSchema).max(100)
    case 'reference':
      return z.object({
        date: z.union([z.literal(''), z.iso.date()]),
        title: shortText,
        url: z.union([z.literal(''), z.url({ protocol: /^https?$/ }).max(1000)]),
      })
    case 'decision':
      return decisionInputSchema(field.options)
    case 'address': {
      const allowed = [...(establishmentOptions.addressOptions ?? []), ADDRESS_OTHER]
      return z.object({
        choice: z.enum(allowed as [string, ...string[]]).nullable(),
        otherText: shortText,
        comment: mediumText,
      })
    }
    case 'agreement':
      return agreementInputSchema
    case 'attestation':
      return attestationInputSchema
    case 'file':
      return null
  }
}

function serverSignature(textVersion: string, ctx: { now: Date; ipTruncated: string }): ServerSignature {
  return { textVersion, signedAt: ctx.now.toISOString(), ipTruncated: ctx.ipTruncated }
}

/**
 * Valeur à enregistrer à partir d'une saisie déjà validée. L'accord écrit et
 * les attestations sont transformés : le serveur y appose la version du texte
 * accepté, la date et l'IP tronquée, ou retire la signature si l'accord n'est
 * plus donné. Une signature envoyée par le client est toujours ignorée.
 */
export function toStoredValue(
  field: FieldDef,
  input: unknown,
  ctx: { now: Date; ipTruncated: string; previous?: unknown }
): unknown {
  if (field.type === 'attestation') {
    const { accepted } = attestationInputSchema.parse(input)
    if (!accepted) return { accepted, signature: null } satisfies StoredAttestation
    const prev = storedAttestation(ctx.previous)
    const keep =
      prev?.accepted && prev.signature?.textVersion === field.attestationVersion ? prev.signature : null
    return {
      accepted,
      signature: keep ?? serverSignature(field.attestationVersion, ctx),
    } satisfies StoredAttestation
  }

  if (field.type !== 'agreement') return input
  const value = agreementInputSchema.parse(input)
  const signed = value.choice === 'yes' && value.signerName.length > 0
  if (!signed) return { ...value, signature: null } satisfies StoredAgreement

  // Même accord, même signataire : on garde la signature d'origine
  const prev = previous(ctx.previous)
  if (
    prev?.signature &&
    prev.choice === 'yes' &&
    prev.signerName === value.signerName &&
    prev.signature.textVersion === field.agreementVersion
  ) {
    return { ...value, signature: prev.signature } satisfies StoredAgreement
  }

  return {
    ...value,
    signature: serverSignature(field.agreementVersion, ctx),
  } satisfies StoredAgreement
}

function previous(value: unknown): StoredAgreement | null {
  const parsed = agreementInputSchema.extend({ signature: signatureSchema }).safeParse(value)
  return parsed.success ? parsed.data : null
}

function storedAttestation(value: unknown): StoredAttestation | null {
  const parsed = attestationInputSchema.extend({ signature: signatureSchema }).safeParse(value)
  return parsed.success ? parsed.data : null
}

/**
 * Attestation à signer avant un dépôt dans ce champ, ou null si rien ne
 * manque. `chantierAnswers` : réponses du chantier entier, par clé.
 */
export function missingAttestation(
  field: FieldDef,
  chantierAnswers: ReadonlyMap<string, unknown>
): FieldDef | null {
  if (field.type !== 'file' || !field.requiresAttestation) return null
  const attestation = getField(field.requiresAttestation)
  if (!attestation) return null
  return isFilled(attestation, chantierAnswers.get(attestation.key)) ? null : attestation
}

/**
 * Le champ est-il rempli ? Une valeur qui ne passe plus le schéma (catalogue
 * modifié depuis) compte comme non remplie plutôt que de faire planter le
 * récapitulatif. Les champs fichier sont évalués à part (completeness.ts).
 */
export function isFilled(
  field: FieldDef,
  value: unknown,
  establishmentOptions: ChantierEstablishmentOptions = {}
): boolean {
  if (value === undefined || field.type === 'file') return false
  if (field.type === 'agreement') {
    const v = previous(value)
    if (!v) return false
    return v.choice === 'no' || (v.choice === 'yes' && v.signature !== null)
  }
  if (field.type === 'attestation') {
    const v = storedAttestation(value)
    return v !== null && v.accepted && v.signature?.textVersion === field.attestationVersion
  }

  const schema = inputSchemaFor(field, establishmentOptions)
  const parsed = schema?.safeParse(value)
  if (!parsed?.success) return false
  const v: unknown = parsed.data

  switch (field.type) {
    case 'access':
      return v === 'given' || (v === field.alternative.value && field.alternative.resolves)
    case 'integer':
    case 'euros':
      return v !== null
    case 'text':
      return typeof v === 'string' && v.length > 0
    case 'yesNoDetail':
      return (v as { value: boolean | null }).value !== null
    case 'list':
      return (v as string[]).some((s) => s.length > 0)
    case 'priceList':
      return (v as { label: string }[]).some((i) => i.label.length > 0)
    case 'faq':
      return (v as { question: string; answer: string }[]).some(
        (i) => i.question.length > 0 && i.answer.length > 0
      )
    case 'contact': {
      const c = v as { name: string; email: string; phone: string }
      return c.name.length > 0 && (c.email.length > 0 || c.phone.length > 0)
    }
    case 'contacts':
      return (v as { name: string }[]).some((i) => i.name.length > 0)
    case 'reference': {
      const r = v as { date: string; title: string; url: string }
      return r.title.length > 0 && (r.date.length > 0 || r.url.length > 0)
    }
    case 'decision':
      return (v as { choice: string | null }).choice !== null
    case 'address': {
      const a = v as { choice: string | null; otherText: string }
      return a.choice !== null && (a.choice !== ADDRESS_OTHER || a.otherText.length > 0)
    }
  }
}
