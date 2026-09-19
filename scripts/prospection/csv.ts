import { writeFileSync } from 'node:fs'
import type { Prospect } from './types'

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
        p.platform ?? '',
        p.topIssues[0], p.topIssues[1], p.topIssues[2], p.error ?? '',
      ]
        .map(cell)
        .join(';')
    )
  }
  return '﻿' + lines.join('\n') + '\n'
}

/** Les plus faibles d'abord : ce sont les prospects les plus convaincants. */
export function sortByScore(prospects: Prospect[]): Prospect[] {
  return [...prospects].sort((a, b) => {
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
