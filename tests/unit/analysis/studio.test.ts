import { describe, it, expect } from 'vitest'
import {
  siteOrigin,
  detectCms,
  buildLlmsTxt,
  buildRobotsTxt,
  buildOrganizationJsonLd,
  buildFaqJsonLd,
  buildHomeMeta,
  buildStudioFixes,
  cmsInstructions,
  seedFaqEntries,
  type StudioSite,
} from '@/lib/analysis/studio'

const SITE: StudioSite = {
  name: 'Boulangerie Dupont',
  url: 'https://www.dupont-boulangerie.fr/accueil',
  language: 'fr',
  country: 'FR',
  description: 'Boulangerie artisanale à Lyon, pains au levain et viennoiseries maison.',
  keywords: ['boulangerie lyon', 'pain au levain', 'viennoiserie'],
  email: 'contact@dupont-boulangerie.fr',
}

describe('siteOrigin', () => {
  it('réduit à l’origine https sans chemin ni www doublé', () => {
    expect(siteOrigin('https://www.dupont-boulangerie.fr/accueil')).toBe(
      'https://www.dupont-boulangerie.fr'
    )
    expect(siteOrigin('exemple.fr')).toBe('https://exemple.fr')
  })
})

describe('detectCms', () => {
  it('détecte les CMS courants depuis le generator', () => {
    expect(detectCms('WordPress 6.5')).toBe('wordpress')
    expect(detectCms('Wix.com Website Builder')).toBe('wix')
    expect(detectCms(null, '<link href="//cdn.shopify.com/x">')).toBe('shopify')
    expect(detectCms('Webflow')).toBe('webflow')
    expect(detectCms('Squarespace')).toBe('squarespace')
    expect(detectCms(null)).toBe('unknown')
  })
})

describe('buildLlmsTxt', () => {
  it('contient le nom, la description et le contact', () => {
    const out = buildLlmsTxt(SITE)
    expect(out).toContain('# Boulangerie Dupont')
    expect(out).toContain('pains au levain')
    expect(out).toContain('contact@dupont-boulangerie.fr')
    expect(out).toContain('https://www.dupont-boulangerie.fr')
  })
})

describe('buildRobotsTxt', () => {
  it('autorise les robots IA et déclare le sitemap', () => {
    const out = buildRobotsTxt(SITE)
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(out).toContain(`User-agent: ${bot}`)
    }
    expect(out).toContain('Sitemap: https://www.dupont-boulangerie.fr/sitemap.xml')
  })
})

describe('buildOrganizationJsonLd', () => {
  it('produit un JSON-LD Organization valide et parsable', () => {
    const parsed = JSON.parse(buildOrganizationJsonLd(SITE))
    expect(parsed['@type']).toBe('Organization')
    expect(parsed.name).toBe('Boulangerie Dupont')
    expect(parsed.url).toBe('https://www.dupont-boulangerie.fr')
    expect(parsed.email).toBe('contact@dupont-boulangerie.fr')
  })
})

describe('buildFaqJsonLd', () => {
  it('balise les questions/réponses et ignore les entrées vides', () => {
    const parsed = JSON.parse(
      buildFaqJsonLd([
        { question: 'Q1 ?', answer: 'R1.' },
        { question: '', answer: 'orpheline' },
      ])
    )
    expect(parsed['@type']).toBe('FAQPage')
    expect(parsed.mainEntity).toHaveLength(1)
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe('R1.')
  })
})

describe('buildHomeMeta', () => {
  it('respecte les longueurs title ≤60 et description ≤155', () => {
    const meta = buildHomeMeta(SITE)
    expect(meta.title.length).toBeLessThanOrEqual(60)
    expect(meta.description.length).toBeLessThanOrEqual(155)
  })
})

describe('buildStudioFixes', () => {
  it('produit les 6 correctifs attendus', () => {
    const fixes = buildStudioFixes(SITE, seedFaqEntries(SITE))
    const keys = fixes.map((f) => f.key)
    expect(keys).toEqual([
      'llms-txt',
      'robots-txt',
      'schema-organization',
      'schema-localbusiness',
      'schema-faq',
      'home-meta',
    ])
    // Les JSON-LD HTML sont bien enveloppés
    const faq = fixes.find((f) => f.key === 'schema-faq')!
    expect(faq.content).toContain('<script type="application/ld+json">')
  })
})

describe('cmsInstructions', () => {
  it('donne des instructions spécifiques au CMS', () => {
    const fixes = buildStudioFixes(SITE, seedFaqEntries(SITE))
    const robots = fixes.find((f) => f.key === 'robots-txt')!
    expect(cmsInstructions('wordpress', robots)).toMatch(/WordPress/)
    expect(cmsInstructions('shopify', robots)).toMatch(/Shopify/)
    expect(cmsInstructions('unknown', robots)).toMatch(/racine|webmaster/)
  })
})
