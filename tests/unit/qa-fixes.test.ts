import { describe, it, expect } from 'vitest'
import { coverageCounts } from '@/lib/analysis/offsite-platforms'
import { analysisSummary } from '@/lib/analysis/site-summary'

/**
 * Régressions issues de la QA du 23/09/2026 — points moyens et mineurs.
 */

describe('couverture des plateformes off-site', () => {
  it('ne compte pas les plateformes non vérifiées au dénominateur', () => {
    // Le cas relevé : 12 plateformes, 3 « à vérifier », affichage « 0 / 12 ».
    const statuses = [
      ...Array<'absent'>(9).fill('absent'),
      ...Array<'unknown'>(3).fill('unknown'),
    ]
    expect(coverageCounts(statuses)).toEqual({ present: 0, unknown: 3, measured: 9 })
  })

  it('compte les présentes correctement', () => {
    expect(coverageCounts(['present', 'present', 'absent', 'unknown'])).toEqual({
      present: 2,
      unknown: 1,
      measured: 3,
    })
  })

  it('gère une liste vide et une liste entièrement inconnue', () => {
    expect(coverageCounts([])).toEqual({ present: 0, unknown: 0, measured: 0 })
    expect(coverageCounts(['unknown', 'unknown'])).toEqual({
      present: 0,
      unknown: 2,
      measured: 0,
    })
  })
})

describe('résumé d’un site sur le tableau de bord', () => {
  const date = new Date('2026-09-15T13:12:56Z')

  it('annonce la note et la date quand l’analyse a réussi', () => {
    const s = analysisSummary({ status: 'success', globalScore: 71, createdAt: date })
    expect(s).toContain('Score 71/100')
    expect(s).toContain('15 sept. 2026')
  })

  it('distingue le site jamais analysé', () => {
    expect(analysisSummary(null)).toBe('Jamais analysé')
  })

  it('dit quand l’analyse est en cours ou en échec', () => {
    expect(analysisSummary({ status: 'running', globalScore: null, createdAt: date })).toMatch(
      /en cours/
    )
    expect(analysisSummary({ status: 'pending', globalScore: null, createdAt: date })).toMatch(
      /en cours/
    )
    expect(analysisSummary({ status: 'error', globalScore: null, createdAt: date })).toMatch(
      /échec/
    )
  })

  it('ne prétend pas à une note quand elle manque', () => {
    const s = analysisSummary({ status: 'success', globalScore: null, createdAt: date })
    expect(s).toMatch(/score non disponible/)
    expect(s).not.toMatch(/\d+\/100/)
  })
})
