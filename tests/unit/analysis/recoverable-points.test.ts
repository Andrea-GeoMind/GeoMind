import { describe, it, expect } from 'vitest'
import { recoverablePoints, computeIssuesScore } from '@/lib/analysis/scoring'

/**
 * Régression du 23/09/2026 : l'interface affichait la somme brute des
 * pénalités à côté de la note. « 12 points faibles · −45 pts » pour une note de
 * 87, et « encore 108 points de pénalité à récupérer » pour un gain réel de 29.
 */
describe('points réellement récupérables', () => {
  it('est l’écart entre la note et 100', () => {
    expect(recoverablePoints(87)).toBe(13)
    expect(recoverablePoints(84)).toBe(16)
    expect(recoverablePoints(100)).toBe(0)
  })

  it('renvoie null quand le pilier n’est pas noté', () => {
    expect(recoverablePoints(null)).toBeNull()
  })

  it('ne descend jamais sous zéro', () => {
    expect(recoverablePoints(120)).toBe(0)
  })

  it('correspond au gain d’une correction complète', () => {
    // Somme brute très au-dessus de l'écart réel : le plafond de 30 points par
    // catégorie écrête, et c'est l'écrêté qui se voit dans la note.
    const issues = Array.from({ length: 9 }, (_, i) => ({
      ruleKey: `regle-${i}`,
      category: 'structure',
      penalty: 10,
    }))
    const score = computeIssuesScore(issues, 1)
    const brut = issues.reduce((s, i) => s + i.penalty, 0)

    expect(brut).toBe(90)
    expect(recoverablePoints(score)).toBe(100 - score)
    expect(recoverablePoints(score)!).toBeLessThan(brut)
    // Tout corriger ramène bien à 100.
    expect(score + recoverablePoints(score)!).toBe(100)
  })
})
