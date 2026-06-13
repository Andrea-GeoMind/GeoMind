/**
 * lib/analysis/agent-ready.ts
 *
 * Score Agent-Ready (PLAN item 33) — l'onglet « deux ans d'avance ». En 2026 les
 * IA n'informent plus seulement, elles AGISSENT (réservent, contactent, achètent).
 * La question : un agent IA peut-il vous trouver, comprendre vos infos clés, et
 * vous contacter/réserver SANS humain ?
 *
 * On évalue ça à partir des pages déjà crawlées (markdown + metadata Firecrawl) —
 * fonctions PURES et déterministes, aucun appel externe, testables.
 */

export interface CrawledPageLite {
  url: string
  markdown: string | null
  /** metadata Firecrawl (peut contenir le HTML brut sous metadata.rawHtml selon config) */
  html?: string | null
}

export type AgentCheckStatus = 'pass' | 'warn' | 'fail'

export interface AgentCheck {
  key: string
  label: string
  /** Ce qu'un agent IA cherche */
  what: string
  status: AgentCheckStatus
  /** Poids dans le score (somme = 100) */
  weight: number
  /** Conseil si pas 'pass' */
  fix: string
}

export interface AgentReadyResult {
  score: number
  checks: AgentCheck[]
}

// ─── Détecteurs (sur le markdown + html agrégés de toutes les pages) ──────────

function has(re: RegExp, hay: string): boolean {
  return re.test(hay)
}

/**
 * Calcule le score Agent-Ready à partir des pages crawlées.
 * Chaque check vaut un poids ; score = somme des poids des 'pass'
 * + moitié pour les 'warn'.
 */
export function computeAgentReady(pages: CrawledPageLite[]): AgentReadyResult {
  const md = pages
    .map((p) => p.markdown ?? '')
    .join('\n')
    .toLowerCase()
  const html = pages
    .map((p) => p.html ?? '')
    .join('\n')
    .toLowerCase()
  const hay = `${md}\n${html}`

  const checks: Omit<AgentCheck, 'status'>[] = [
    {
      key: 'phone-clickable',
      label: 'Téléphone cliquable (tel:)',
      what: 'Un agent doit pouvoir déclencher un appel sans deviner le numéro.',
      weight: 20,
      fix: 'Rendez votre numéro cliquable : <a href="tel:+33...">. Un numéro en image ou en texte brut n’est pas actionnable.',
    },
    {
      key: 'email-clickable',
      label: 'Email cliquable (mailto:)',
      what: 'Permet à un agent d’ouvrir un message pré-adressé.',
      weight: 12,
      fix: 'Ajoutez un lien mailto: sur votre adresse email plutôt qu’un texte simple.',
    },
    {
      key: 'contact-form',
      label: 'Formulaire de contact',
      what: 'Un agent peut soumettre une demande structurée.',
      weight: 16,
      fix: 'Proposez un formulaire de contact HTML standard (champs nom, email, message).',
    },
    {
      key: 'booking-link',
      label: 'Prise de rendez-vous en ligne',
      what: 'Le summum de l’actionnable : réserver sans humain.',
      weight: 16,
      fix: 'Ajoutez un lien de réservation (Calendly, cal.com, Doctolib…) bien visible.',
    },
    {
      key: 'hours-schema',
      label: 'Horaires en données structurées',
      what: 'Un agent lit openingHours de façon fiable plutôt que d’interpréter du texte.',
      weight: 14,
      fix: 'Déclarez vos horaires via Schema.org LocalBusiness (openingHours) — voir l’onglet Studio.',
    },
    {
      key: 'address-schema',
      label: 'Adresse en données structurées',
      what: 'Permet la géolocalisation et l’itinéraire automatiques.',
      weight: 12,
      fix: 'Déclarez votre adresse via Schema.org PostalAddress (bloc LocalBusiness du Studio).',
    },
    {
      key: 'organization-schema',
      label: 'Identité d’entreprise structurée',
      what: 'Un agent identifie qui vous êtes sans ambiguïté.',
      weight: 10,
      fix: 'Ajoutez un JSON-LD Organization (généré dans l’onglet Studio).',
    },
  ]

  const detect: Record<string, AgentCheckStatus> = {
    'phone-clickable': has(/tel:\+?\d|href=["']tel:/, hay) ? 'pass' : 'fail',
    'email-clickable': has(/mailto:[^"'\s)]+@/, hay) ? 'pass' : 'fail',
    'contact-form': has(/<form|\/contact|contactez|formulaire/, hay) ? 'pass' : 'warn',
    'booking-link': has(/calendly|cal\.com|doctolib|réserv|reserv|prendre rendez|booking/, hay)
      ? 'pass'
      : 'fail',
    'hours-schema': has(/openinghours|opening_hours/, hay) ? 'pass' : 'fail',
    'address-schema': has(/postaladdress|streetaddress/, hay) ? 'pass' : 'fail',
    'organization-schema': has(/"@type"\s*:\s*"(organization|localbusiness)"/, hay)
      ? 'pass'
      : 'fail',
  }

  const full: AgentCheck[] = checks.map((c) => ({ ...c, status: detect[c.key] ?? 'fail' }))

  const score = Math.round(
    full.reduce((sum, c) => sum + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight / 2 : 0), 0)
  )

  return { score, checks: full }
}

/** Libellé de maturité Agent-Ready pour l'affichage. */
export function agentReadyLabel(score: number): string {
  if (score >= 80) return 'Prêt pour les agents IA'
  if (score >= 50) return 'Partiellement actionnable'
  if (score >= 25) return 'Peu actionnable'
  return 'Invisible aux agents'
}
