import { describe, it, expect } from 'vitest'
import { isFaqPage, hasFaqContent, faqPages } from '@/lib/analysis/faq-detection'
import { completeTechnicalOpportunities } from '@/lib/analysis/opportunities'
import type { TechnicalIssue } from '@/lib/analysis/technical/types'

const page = (url: string, markdown = '') => ({ url, markdown })

describe('isFaqPage', () => {
  it('reconnaît une page /faq même sans marqueur', () => {
    expect(isFaqPage(page('https://a.fr/faq'))).toBe(true)
    expect(isFaqPage(page('https://a.fr/faq/'))).toBe(true)
  })

  it('reconnaît trois titres interrogatifs', () => {
    const md = '## Quel prix ?\n## Quel délai ?\n## Quelle garantie ?'
    expect(isFaqPage(page('https://a.fr/services', md))).toBe(true)
  })

  it('reconnaît les questions en gras et les lignes « Q : »', () => {
    expect(
      isFaqPage(page('https://a.fr/a', '**Quel prix ?**\n**Quel délai ?**\n**Quelle garantie ?**'))
    ).toBe(true)
    expect(isFaqPage(page('https://a.fr/b', 'Q : un\nQ : deux\nQ : trois'))).toBe(true)
  })

  it('ne confond pas une page ordinaire avec une FAQ', () => {
    expect(isFaqPage(page('https://a.fr/services', '## Nos services\nDu texte.'))).toBe(false)
    expect(isFaqPage(page('https://a.fr/faquestions-diverses'))).toBe(false)
  })
})

describe('hasFaqContent', () => {
  it('vrai dès qu’une page FAQ existe', () => {
    expect(hasFaqContent([page('https://a.fr/'), page('https://a.fr/faq')])).toBe(true)
  })

  it('vrai si les titres interrogatifs cumulés atteignent le seuil', () => {
    const pages = [
      page('https://a.fr/a', '## Quel prix ?'),
      page('https://a.fr/b', '## Quel délai ?'),
      page('https://a.fr/c', '## Quelle garantie ?'),
    ]
    expect(hasFaqContent(pages)).toBe(true)
  })

  it('faux sur un site sans aucune question', () => {
    expect(hasFaqContent([page('https://a.fr/', '## Accueil\nDu texte.')])).toBe(false)
  })
})

describe('faqPages', () => {
  it('ne renvoie que les pages FAQ', () => {
    const pages = [page('https://a.fr/'), page('https://a.fr/faq'), page('https://a.fr/tarifs')]
    expect(faqPages(pages).map((p) => p.url)).toEqual(['https://a.fr/faq'])
  })
})

// La contradiction rapportée : « aucune FAQ détectée » sur une carte et
// « votre FAQ schema est en place — bravo » sur la suivante. La règle
// schema_org_faq ne tire pas dans deux cas opposés : FAQ balisée, ou pas de
// FAQ du tout. L'opportunité ne peut pas les distinguer sans preuve positive.
describe('opportunité « FAQ en place » — exige une preuve positive', () => {
  const detected: TechnicalIssue[] = []
  const faqOpportunity = (issues: TechnicalIssue[]) =>
    issues.find((i) => i.ruleKey === 'opportunity_howto_schema')

  it('reste muette quand le site n’a aucune FAQ', () => {
    const issues = completeTechnicalOpportunities(detected, { faqExists: false })
    expect(faqOpportunity(issues)).toBeUndefined()
  })

  it('reste muette quand la preuve n’est pas fournie', () => {
    const issues = completeTechnicalOpportunities(detected)
    expect(faqOpportunity(issues)).toBeUndefined()
  })

  it('félicite seulement quand une FAQ existe vraiment et est balisée', () => {
    const issues = completeTechnicalOpportunities(detected, { faqExists: true })
    expect(faqOpportunity(issues)).toBeDefined()
    expect(faqOpportunity(issues)?.description).toContain('FAQ schema est en place')
  })

  it('reste muette si la règle schema_org_faq a tiré (FAQ non balisée)', () => {
    const withIssue: TechnicalIssue[] = [
      {
        ruleKey: 'schema_org_faq',
        category: 'schema_org',
        title: 'Schema FAQPage manquant',
        description: '',
        sampleUrls: [],
        severity: 'moderate',
        effort: 2,
        impact: 3,
      },
    ]
    const issues = completeTechnicalOpportunities(withIssue, { faqExists: true })
    expect(faqOpportunity(issues)).toBeUndefined()
  })
})
