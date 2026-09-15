import { describe, it, expect } from 'vitest'
import {
  isTableRow,
  isTableSeparator,
  isHorizontalRule,
  splitCells,
} from '@/components/features/coach/coach-markdown'

// GEO structure spontanément ses réponses en tableaux ; sans ces règles, les
// pipes et les tirets s'affichaient en texte brut dans l'interface (QA 15/09).

describe('détection des tableaux', () => {
  it('reconnaît une ligne de cellules', () => {
    expect(isTableRow('| Priorité | Action | Impact |')).toBe(true)
    expect(isTableRow('  | a | b |  ')).toBe(true)
  })

  it('ignore une ligne qui n’est pas encadrée de pipes', () => {
    expect(isTableRow('Priorité | Action')).toBe(false)
    expect(isTableRow('texte normal')).toBe(false)
  })

  it('reconnaît la ligne de séparation, y compris alignée', () => {
    expect(isTableSeparator('|---|---|')).toBe(true)
    expect(isTableSeparator('| --- | --- |')).toBe(true)
    expect(isTableSeparator('|:---|---:|:--:|')).toBe(true)
  })

  it('ne confond pas une ligne de données avec une séparation', () => {
    expect(isTableSeparator('| 1 | Créer une page |')).toBe(false)
    expect(isTableSeparator('|   |   |')).toBe(false)
  })

  it('découpe les cellules sans les pipes de bord', () => {
    expect(splitCells('| Priorité | Action | Impact |')).toEqual([
      'Priorité',
      'Action',
      'Impact',
    ])
    expect(splitCells('| 🥇 1 | Créer une page "À propos" | Fort |')).toEqual([
      '🥇 1',
      'Créer une page "À propos"',
      'Fort',
    ])
  })
})

describe('règles horizontales', () => {
  it('reconnaît les trois notations', () => {
    expect(isHorizontalRule('---')).toBe(true)
    expect(isHorizontalRule('***')).toBe(true)
    expect(isHorizontalRule('___')).toBe(true)
    expect(isHorizontalRule('-----')).toBe(true)
  })

  it('ne prend pas une puce pour une règle', () => {
    expect(isHorizontalRule('- item')).toBe(false)
    expect(isHorizontalRule('-- deux')).toBe(false)
    expect(isHorizontalRule('texte --- milieu')).toBe(false)
  })
})
