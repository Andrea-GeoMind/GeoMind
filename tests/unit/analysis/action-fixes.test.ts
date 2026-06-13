import { describe, it, expect } from 'vitest'
import { buildActionFixesByRule, RULE_TO_FIX } from '@/lib/analysis/action-fixes'
import { seedFaqEntries, type StudioSite } from '@/lib/analysis/studio'

const SITE: StudioSite = {
  name: 'Plomberie Dupont',
  url: 'https://plomberie-dupont.fr',
  language: 'fr',
  country: 'FR',
  description: 'Plombier à Lyon, dépannage 7j/7.',
  keywords: ['plombier lyon', 'dépannage'],
  email: 'contact@plomberie-dupont.fr',
}

describe('buildActionFixesByRule', () => {
  it('attache un correctif aux règles mappées', () => {
    const fixes = buildActionFixesByRule(SITE, seedFaqEntries(SITE), 'wordpress')

    // Chaque ruleKey du mapping doit produire un correctif
    for (const ruleKey of Object.keys(RULE_TO_FIX)) {
      expect(fixes[ruleKey], `correctif manquant pour ${ruleKey}`).toBeDefined()
      expect(fixes[ruleKey].content.length).toBeGreaterThan(0)
    }
  })

  it('pré-calcule l’instruction CMS pour la plateforme demandée', () => {
    const fixes = buildActionFixesByRule(SITE, seedFaqEntries(SITE), 'wordpress')
    expect(fixes.llms_txt_missing.cmsLabel).toBe('WordPress')
    expect(fixes.llms_txt_missing.cmsInstruction.toLowerCase()).toContain('wordpress')
  })

  it('fournit un template de code pour les règles à snippet (ex. H1)', () => {
    const fixes = buildActionFixesByRule(SITE, seedFaqEntries(SITE), 'wordpress')
    expect(fixes.h1_missing_or_duplicate).toBeDefined()
    expect(fixes.h1_missing_or_duplicate.content).toContain('<h1>')
    // Snippet générique : pas de plateforme CMS accolée
    expect(fixes.h1_missing_or_duplicate.cmsLabel).toBe('')
    expect(fixes.images_without_alt.content).toContain('alt=')
  })

  it('ne renvoie aucun correctif pour une règle sans fichier ni snippet', () => {
    const fixes = buildActionFixesByRule(SITE, seedFaqEntries(SITE), 'unknown')
    expect(fixes['thin_content']).toBeUndefined()
    expect(fixes['response_time_slow']).toBeUndefined()
  })

  it('mappe les 3 règles de meta vers le même correctif home-meta', () => {
    const fixes = buildActionFixesByRule(SITE, seedFaqEntries(SITE), 'unknown')
    expect(fixes.title_missing_or_short.format).toBe('meta')
    expect(fixes.meta_description_missing.label).toBe(fixes.title_missing_or_short.label)
  })
})
