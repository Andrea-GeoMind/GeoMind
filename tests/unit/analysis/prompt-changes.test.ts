import { describe, it, expect } from 'vitest'
import { promptsChangedSince } from '@/lib/analysis/prompt-changes'

const at = (iso: string) => ({ createdAt: new Date(iso) })
const PREVIOUS = new Date('2026-09-10T10:00:00Z')

describe('promptsChangedSince', () => {
  it('faux quand toutes les questions préexistaient à l’analyse de référence', () => {
    expect(
      promptsChangedSince(PREVIOUS, [at('2026-09-01T10:00:00Z'), at('2026-09-05T10:00:00Z')])
    ).toBe(false)
  })

  it('vrai dès qu’une question a été ajoutée après', () => {
    expect(
      promptsChangedSince(PREVIOUS, [at('2026-09-01T10:00:00Z'), at('2026-09-12T10:00:00Z')])
    ).toBe(true)
  })

  it('vrai après une nouvelle découverte, qui réécrit tout le jeu', () => {
    const rewritten = [at('2026-09-15T08:00:00Z'), at('2026-09-15T08:00:00Z')]
    expect(promptsChangedSince(PREVIOUS, rewritten)).toBe(true)
  })

  it('faux sans analyse précédente — il n’y a rien à comparer', () => {
    expect(promptsChangedSince(null, [at('2026-09-12T10:00:00Z')])).toBe(false)
  })

  it('faux sur un site sans question', () => {
    expect(promptsChangedSince(PREVIOUS, [])).toBe(false)
  })

  it('une question créée exactement à l’instant de l’analyse ne compte pas', () => {
    expect(promptsChangedSince(PREVIOUS, [at('2026-09-10T10:00:00Z')])).toBe(false)
  })
})
