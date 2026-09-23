import { describe, it, expect } from 'vitest'
import {
  stripYearMentions,
  NEUTRAL_PROMPTS_SYSTEM_PROMPT,
  NEUTRAL_PROMPTS_COUNT,
} from '@/lib/ai/prompts/neutral-prompts'

describe('stripYearMentions', () => {
  it('retire « en 2024 » sans casser la phrase', () => {
    expect(stripYearMentions('Quels sont les meilleurs plombiers à Lyon en 2024 ?')).toBe(
      'Quels sont les meilleurs plombiers à Lyon ?'
    )
  })

  it('retire n’importe quelle année, passée ou future', () => {
    for (const year of ['2019', '2024', '2025', '2026', '2030']) {
      expect(stripYearMentions(`Meilleurs outils GEO en ${year} ?`)).toBe('Meilleurs outils GEO ?')
    }
  })

  it('gère les autres formulations datées', () => {
    expect(stripYearMentions('Comparatif des CRM pour 2025')).toBe('Comparatif des CRM')
    expect(stripYearMentions('Les tendances SEO (2024)')).toBe('Les tendances SEO')
    expect(stripYearMentions('Quels outils cette année ?')).toBe('Quels outils ?')
    expect(stripYearMentions('Meilleures agences 2024-2025 ?')).toBe('Meilleures agences ?')
  })

  it('laisse intacts les nombres qui ne sont pas des années', () => {
    expect(stripYearMentions('Donne-moi une liste de 10 plombiers avec leurs sites')).toBe(
      'Donne-moi une liste de 10 plombiers avec leurs sites'
    )
    expect(stripYearMentions('Quel budget pour 1500 euros de travaux ?')).toBe(
      'Quel budget pour 1500 euros de travaux ?'
    )
  })

  it('est idempotente — repasser dessus ne change plus rien', () => {
    const once = stripYearMentions('Meilleurs plombiers à Lyon en 2024 ?')
    expect(stripYearMentions(once)).toBe(once)
  })

  // L'espace avant « ? » est correct en français : la fonction ne doit pas le
  // supprimer sous prétexte de faire le ménage.
  it('préserve l’espace français avant le point d’interrogation', () => {
    expect(stripYearMentions('Top 10 des agences en 2024 ?')).toBe('Top 10 des agences ?')
    expect(stripYearMentions('Quel budget pour 1500 euros de travaux ?')).toBe(
      'Quel budget pour 1500 euros de travaux ?'
    )
  })
})

describe('NEUTRAL_PROMPTS_SYSTEM_PROMPT', () => {
  it('interdit explicitement les années', () => {
    expect(NEUTRAL_PROMPTS_SYSTEM_PROMPT).toMatch(/AUCUNE année/)
  })

  it('ne contient lui-même aucune année en dur', () => {
    expect(NEUTRAL_PROMPTS_SYSTEM_PROMPT.replace(/« en 20\d{2} »|« en 2024 »|2024|2025/g, (m) => m))
    const hardcoded = NEUTRAL_PROMPTS_SYSTEM_PROMPT.match(/(?:19|20)\d{2}/g) ?? []
    // Les seules occurrences admises sont celles de la consigne d'interdiction.
    for (const year of hardcoded) {
      const idx = NEUTRAL_PROMPTS_SYSTEM_PROMPT.indexOf(year)
      const context = NEUTRAL_PROMPTS_SYSTEM_PROMPT.slice(Math.max(0, idx - 80), idx)
      expect(context).toMatch(/AUCUNE année|ni « en/)
    }
  })

  it('annonce le bon nombre de prompts', () => {
    expect(NEUTRAL_PROMPTS_SYSTEM_PROMPT).toContain(String(NEUTRAL_PROMPTS_COUNT))
  })
})
