/**
 * Textes de l'espace client de chantier, hors champs (ceux-ci sont dans
 * fields.ts). Tout ce que lit le client est ici ou là-bas, pour être relu d'un
 * bloc et corrigé sans toucher aux composants.
 *
 * Repères remplacés à l'affichage par fillCopy() :
 *   [CLIENT] [ETABLISSEMENT] [ADRESSE] [CONTACT] [DATE] [POURCENT]
 *   [UTILISE] [DEPOT] [SUPPRESSION] [NOM] [FORMATS]
 */

import type { ChantierOptions } from '@/lib/db/schema'

/** Adresse GeoMind par défaut, réglable par chantier (options.geomindAddress). */
export const DEFAULT_GEOMIND_ADDRESS = 'andrea.schwertz2008@gmail.com'

/** Valeur de [ADRESSE] et de [CONTACT] pour un chantier. */
export function geomindAddressFor(options: ChantierOptions): string {
  return options.geomindAddress?.trim() || DEFAULT_GEOMIND_ADDRESS
}

export const COPY_PLACEHOLDERS = [
  '[CLIENT]',
  '[ETABLISSEMENT]',
  '[ADRESSE]',
  '[CONTACT]',
  '[DATE]',
  '[POURCENT]',
  '[UTILISE]',
  '[DEPOT]',
  '[SUPPRESSION]',
  '[NOM]',
  '[FORMATS]',
] as const

export type CopyPlaceholder = (typeof COPY_PLACEHOLDERS)[number]

export function fillCopy(text: string, values: Partial<Record<CopyPlaceholder, string>>): string {
  return Object.entries(values).reduce((t, [key, value]) => t.split(key).join(value ?? ''), text)
}

export const CHANTIER_COPY = {
  pageTitle: 'Espace chantier · GeoMind',

  header: {
    eyebrow: 'Espace chantier GeoMind',
    title: '[CLIENT] : les informations dont nous avons besoin',
    intro:
      'Cet espace remplace les échanges de mails. Tout ce que vous saisissez est enregistré au fur et à mesure : vous pouvez vous arrêter et revenir quand vous voulez avec ce même lien. Rien n’est publié sans votre accord.',
    privateLink:
      'Ce lien est personnel : ne le transmettez qu’aux personnes qui remplissent cet espace avec vous. Il est valable jusqu’au [DATE].',
    progress: '[POURCENT] % rempli',
  },

  nav: {
    sections: 'Sections',
    establishment: 'Établissement',
    short: { access: 'Accès', info: 'Infos', files: 'Fichiers', decisions: 'Décisions', recap: 'Récap' },
    allEstablishments: 'Pour l’ensemble de vos établissements',
  },

  autosave: {
    saving: 'Enregistrement…',
    saved: 'Enregistré',
    error: 'Non enregistré. Vérifiez votre connexion : nous réessayons automatiquement.',
    errorShort: 'Non enregistré',
    invalid: 'Cette valeur n’est pas valide.',
  },

  access: {
    title: '1. Accès',
    intro:
      'Pour travailler sur vos sites et vos fiches, nous avons besoin d’y être invités. Chaque outil permet d’ajouter une personne sans partager votre compte.',
    noPassword:
      'Nous ne vous demanderons jamais de mot de passe. Un mot de passe envoyé par écrit peut fuiter et donne un accès total ; une invitation se limite à ce dont nous avons besoin, et vous la retirez en un clic, quand vous voulez.',
    inviteAddress: 'Adresse à inviter : [ADRESSE]',
    given: 'C’est fait',
    contactName: 'Nom ou agence',
    contactEmail: 'E-mail',
    contactPhone: 'Téléphone',
  },

  info: {
    title: '2. Informations',
    intro:
      'Ces informations nourriront vos pages, votre fiche Google et ce que les IA disent de vous. Écrivez-les comme vous les diriez à un client : nous les mettrons en forme, et vous relirez avant toute publication.',
    yes: 'Oui',
    no: 'Non',
    euroSuffix: '€',
    addZone: 'Ajouter une zone',
    addService: 'Ajouter une prestation',
    serviceLabel: 'Prestation',
    servicePrice: 'Prix indicatif',
    addQuestion: 'Ajouter une question',
    question: 'Question',
    answer: 'Réponse',
    addContact: 'Ajouter un contact',
    contactCategory: 'Catégorie',
    contactName: 'Nom',
    contactWebsite: 'Site',
    contactDetails: 'Contact (téléphone ou e-mail)',
    referenceDate: 'Date de parution',
    referenceTitle: 'Titre',
    referenceUrl: 'Lien',
    remove: 'Retirer',
  },

  files: {
    title: '3. Fichiers',
    intro: 'Photos, logos et documents. Ils restent privés : seule GeoMind peut les voir.',
    limits: '20 Mo au plus par fichier. Formats acceptés ici : [FORMATS].',
    dropzone: 'Glissez vos fichiers ici, ou cliquez pour les choisir',
    uploading: 'Envoi en cours…',
    checking: 'Vérification…',
    uploaded: 'Reçu',
    delete: 'Supprimer',
    confirmDelete: 'Supprimer ce fichier ? Il sera effacé définitivement.',
    quota: '[UTILISE] Mo utilisés sur 300 Mo',
    ownerOnly:
      'Déposé le [DEPOT]. Consultable par GeoMind uniquement, supprimé automatiquement le [SUPPRESSION].',
  },

  decisions: {
    title: '4. Décisions',
    intro:
      'Quelques choix qui vous reviennent. Chacun est expliqué ; en cas de doute, laissez un commentaire et nous en parlerons.',
    comment: 'Commentaire (facultatif)',
    addressOther: 'Autre adresse',
    addressOtherPlaceholder: 'Adresse complète',
    signerName: 'Vos nom et prénom',
    signerNameRequired: 'Indiquez vos nom et prénom pour valider votre accord.',
    signed: 'Accord donné par [NOM] le [DATE].',
  },

  recap: {
    title: '5. Récapitulatif',
    blockingTitle: 'Indispensable pour démarrer',
    blockingIntro: 'Sans ces éléments, nous ne pouvons pas commencer.',
    helpTitle: 'Nous allons vous aider',
    helpIntro: 'Vous nous avez signalé une difficulté pour :',
    missingTitle: 'Encore à compléter',
    complete: 'Tout est rempli. Merci !',
    finishButton: 'J’ai terminé',
    finishHint: 'Nous serons prévenus. Vous pourrez encore modifier vos réponses ensuite.',
    confirmIncomplete:
      'Certains éléments manquent encore (voir ci-dessus). Nous prévenir quand même ?',
    confirmYes: 'Oui, prévenir GeoMind',
    confirmNo: 'Continuer à remplir',
    done: 'Merci, nous avons été prévenus le [DATE]. Vous pouvez encore modifier vos réponses : nous verrons les changements.',
  },

  linkStates: {
    unknown: {
      title: 'Lien introuvable',
      body: 'Ce lien n’existe pas ou n’est plus valable. Vérifiez qu’il a été copié en entier, ou écrivez-nous à [CONTACT] pour en recevoir un nouveau.',
    },
    expired: {
      title: 'Lien expiré',
      body: 'Ce lien a expiré le [DATE]. Écrivez-nous à [CONTACT] pour en recevoir un nouveau : vos réponses sont conservées.',
    },
    revoked: {
      title: 'Lien désactivé',
      body: 'Ce lien a été remplacé ou désactivé. Utilisez le dernier lien que nous vous avons envoyé, ou écrivez-nous à [CONTACT].',
    },
    closed: {
      title: 'Espace fermé',
      body: 'Cet espace est fermé. Merci pour votre collaboration ! Pour toute question, écrivez-nous à [CONTACT].',
    },
    rateLimited: {
      title: 'Trop de tentatives',
      body: 'Réessayez dans quelques minutes.',
    },
  },

  footer: 'GeoMind · Espace privé, accessible uniquement par ce lien et non référencé par les moteurs de recherche.',
} as const
