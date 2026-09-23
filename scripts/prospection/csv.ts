import { writeFileSync } from 'node:fs'
import type { Business, Prospect } from './types'

/**
 * Écriture de PROSPECTS.csv.
 *
 * Séparateur point-virgule et BOM UTF-8 : c'est ce qu'attend Excel en
 * configuration française, sinon les accents se cassent et tout atterrit dans
 * une seule colonne.
 */

const HEADERS = [
  'nom', 'categorie', 'telephone', 'email', 'site', 'avis', 'note',
  'score_express', 'score_technique', 'score_contenu', 'score_moyen',
  'score_negligence', 'signaux_negligence',
  'sous_domaine_plateforme', 'probleme_1', 'probleme_2', 'probleme_3', 'erreur',
]

function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Moyenne technique + contenu — le critère de tri. */
export function averageScore(p: Prospect): number | null {
  const parts = [p.technicalScore, p.contentScore].filter((n): n is number => n !== null)
  if (parts.length === 0) return null
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
}

export function toCsv(prospects: Prospect[]): string {
  const lines = [HEADERS.join(';')]
  for (const p of prospects) {
    lines.push(
      [
        p.name, p.category, p.phone, p.email, p.website, p.reviewCount, p.rating,
        p.expressScore, p.technicalScore, p.contentScore, averageScore(p),
        p.neglectScore ?? '', (p.neglectReasons ?? []).join(' · '),
        p.platform ?? '',
        p.topIssues[0], p.topIssues[1], p.topIssues[2], p.error ?? '',
      ]
        .map(cell)
        .join(';')
    )
  }
  return '﻿' + lines.join('\n') + '\n'
}

/**
 * Tri par score de négligence décroissant — les meilleurs prospects d'abord.
 *
 * Le tri par technique+contenu croissant ne séparait rien : médiane 80, deux
 * sites sous 70 sur 24. À score de négligence égal, le site le plus faible
 * passe devant.
 */
export function sortByScore(prospects: Prospect[]): Prospect[] {
  return [...prospects].sort((a, b) => {
    const na = a.neglectScore ?? -1
    const nb = b.neglectScore ?? -1
    if (na !== nb) return nb - na

    const sa = averageScore(a)
    const sb = averageScore(b)
    // Les audits en échec finissent en bas, ils ne sont pas exploitables.
    if (sa === null) return 1
    if (sb === null) return -1
    return sa - sb
  })
}

export interface Summary {
  total: number
  audited: number
  failed: number
  under70: number
  under60: number
  under50: number
  withEmail: number
  /** Sites sans domaine propre — prospects prioritaires. */
  onPlatform: number
}

export function summarise(prospects: Prospect[]): Summary {
  const scores = prospects
    .map(averageScore)
    .filter((n): n is number => n !== null)
  return {
    total: prospects.length,
    audited: scores.length,
    failed: prospects.length - scores.length,
    under70: scores.filter((s) => s < 70).length,
    under60: scores.filter((s) => s < 60).length,
    under50: scores.filter((s) => s < 50).length,
    withEmail: prospects.filter((p) => p.email).length,
    onPlatform: prospects.filter((p) => p.platform).length,
  }
}

export function writeCsv(path: string, prospects: Prospect[]): void {
  writeFileSync(path, toCsv(prospects), 'utf8')
}

/**
 * Entreprises sans site propre — leur seule adresse web est une fiche de
 * plateforme (Planity, Instagram, Facebook…).
 *
 * Elles sortent dans un fichier séparé parce que l'argumentaire n'est pas le
 * même : il n'y a pas de site à auditer, donc pas de score. Ce qui se discute
 * avec elles, ce sont les signaux que les moteurs lisent vraiment en local —
 * catégorie de la fiche Google, nombre d'avis, présence en annuaire. Les
 * colonnes ci-dessous sont exactement celles qu'il faut sous les yeux pour
 * mener cette conversation.
 */
const LISTING_HEADERS = [
  'nom', 'categorie_recherchee', 'avis_google', 'note_google',
  'plateforme', 'url_fiche', 'telephone', 'adresse',
]

export function toListingsCsv(
  rows: { business: Business; platform: string }[]
): string {
  const lines = [LISTING_HEADERS.join(';')]
  for (const { business: b, platform } of rows) {
    lines.push(
      [b.name, b.category, b.reviewCount, b.rating, platform, b.website, b.phone, b.address]
        .map(cell)
        .join(';')
    )
  }
  return '﻿' + lines.join('\n') + '\n'
}

/** Les mieux dotées en avis d'abord : c'est le levier le plus parlant. */
export function sortListings<T extends { business: Business }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (b.business.reviewCount ?? 0) - (a.business.reviewCount ?? 0))
}

export function writeListingsCsv(
  path: string,
  rows: { business: Business; platform: string }[]
): void {
  writeFileSync(path, toListingsCsv(sortListings(rows)), 'utf8')
}
