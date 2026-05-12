import { describe, it, expect } from 'vitest'
import { isPromptNeutral } from '@/lib/analysis/neutrality'
import { buildDiscoveryUserMessage } from '@/lib/ai/prompts/discovery'
import { buildNeutralPromptsUserMessage } from '@/lib/ai/prompts/neutral-prompts'
import { DiscoveryOutputSchema, NeutralPromptsOutputSchema } from '@/lib/ai/schemas'

// ─── isPromptNeutral ──────────────────────────────────────────────────────────

describe('isPromptNeutral', () => {
  const siteUrl = 'https://www.geomind.fr'
  const siteName = 'GeoMind'

  it('retourne true pour un prompt sans mention de la marque', () => {
    expect(isPromptNeutral('Quel est le meilleur outil SEO pour PME ?', siteUrl, siteName)).toBe(
      true
    )
  })

  it('retourne false si le prompt contient le domaine exact', () => {
    expect(
      isPromptNeutral('Avis sur geomind.fr pour mon referencement', siteUrl, siteName)
    ).toBe(false)
  })

  it('retourne false si le prompt contient le sous-domaine sans www', () => {
    expect(isPromptNeutral('Que vaut geomind pour le GEO ?', siteUrl, siteName)).toBe(false)
  })

  it('retourne false si le prompt contient la marque (casse differente)', () => {
    expect(isPromptNeutral('Comparatif GeoMind vs concurrent', siteUrl, siteName)).toBe(false)
  })

  it('retourne false si le prompt contient la marque en minuscules', () => {
    expect(isPromptNeutral('Comment fonctionne geomind ?', siteUrl, siteName)).toBe(false)
  })

  it('retourne true pour un prompt neutre sur le meme secteur', () => {
    expect(
      isPromptNeutral(
        'Comment ameliorer la visibilite de mon site dans ChatGPT ?',
        siteUrl,
        siteName
      )
    ).toBe(true)
  })

  it('fonctionne avec une URL sans www', () => {
    expect(isPromptNeutral('Avis sur monsite.com', 'https://monsite.com', 'Mon Site')).toBe(false)
  })

  it('ignore les tokens trop courts (longueur <= 2)', () => {
    // Nom de site "AB" — token "ab" (2 chars) ne doit pas flaguer les prompts courants
    expect(isPromptNeutral('Quel outil AB testing choisir ?', 'https://ab.io', 'AB')).toBe(true)
  })
})

// ─── DiscoveryOutputSchema ────────────────────────────────────────────────────

describe('DiscoveryOutputSchema', () => {
  it('accepte une sortie valide avec concurrents', () => {
    const result = DiscoveryOutputSchema.safeParse({
      description: 'Un SaaS B2B qui audite la visibilite GEO.',
      keywords: ['GEO', 'audit IA', 'visibilite ChatGPT'],
      competitors: [{ url: 'https://concurrent.com', name: 'Concurrent' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepte competitors vide (default)', () => {
    const result = DiscoveryOutputSchema.safeParse({
      description: 'Description valide du business.',
      keywords: ['keyword'],
      competitors: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejette une description trop courte', () => {
    const result = DiscoveryOutputSchema.safeParse({
      description: 'Court',
      keywords: ['kw'],
      competitors: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejette keywords vide', () => {
    const result = DiscoveryOutputSchema.safeParse({
      description: 'Description valide du business ici.',
      keywords: [],
      competitors: [],
    })
    expect(result.success).toBe(false)
  })
})

// ─── NeutralPromptsOutputSchema ───────────────────────────────────────────────

describe('NeutralPromptsOutputSchema', () => {
  const twentyPrompts = Array.from({ length: 20 }, (_, i) => `Question neutre numero ${i + 1} ?`)

  it('accepte exactement 20 prompts', () => {
    const result = NeutralPromptsOutputSchema.safeParse({ prompts: twentyPrompts })
    expect(result.success).toBe(true)
  })

  it('rejette moins de 20 prompts', () => {
    const result = NeutralPromptsOutputSchema.safeParse({ prompts: twentyPrompts.slice(0, 19) })
    expect(result.success).toBe(false)
  })

  it('rejette plus de 20 prompts', () => {
    const result = NeutralPromptsOutputSchema.safeParse({
      prompts: [...twentyPrompts, 'Question 21 ?'],
    })
    expect(result.success).toBe(false)
  })
})

// ─── buildDiscoveryUserMessage ────────────────────────────────────────────────

describe('buildDiscoveryUserMessage', () => {
  it('inclut le contenu des pages', () => {
    const msg = buildDiscoveryUserMessage([
      { url: 'https://exemple.com', markdown: '# Titre\n\nContenu de la page.' },
    ])
    expect(msg).toContain('https://exemple.com')
    expect(msg).toContain('Contenu de la page.')
  })

  it('ignore les pages sans markdown', () => {
    const msg = buildDiscoveryUserMessage([
      { url: 'https://exemple.com/vide', markdown: null },
      { url: 'https://exemple.com/ok', markdown: 'Contenu present.' },
    ])
    expect(msg).not.toContain('https://exemple.com/vide')
    expect(msg).toContain('Contenu present.')
  })

  it('tronque le contenu au-dela de 12 000 caracteres', () => {
    const longMarkdown = 'x'.repeat(15_000)
    const msg = buildDiscoveryUserMessage([{ url: 'https://exemple.com', markdown: longMarkdown }])
    expect(msg).toContain('[... contenu tronqué]')
    expect(msg.length).toBeLessThan(13_500)
  })
})

// ─── buildNeutralPromptsUserMessage ───────────────────────────────────────────

describe('buildNeutralPromptsUserMessage', () => {
  it('inclut la description et les mots-cles', () => {
    const msg = buildNeutralPromptsUserMessage({
      description: "SaaS d'audit GEO.",
      keywords: ['audit IA', 'GEO', 'visibilite'],
      siteName: 'GeoMind',
      siteUrl: 'geomind.fr',
    })
    expect(msg).toContain('audit IA')
    expect(msg).toContain("SaaS d'audit GEO.")
  })

  it('mentionne explicitement les termes a eviter', () => {
    const msg = buildNeutralPromptsUserMessage({
      description: 'Un outil de test.',
      keywords: ['outil'],
      siteName: 'MonSite',
      siteUrl: 'monsite.fr',
    })
    expect(msg).toContain('MonSite')
    expect(msg).toContain('monsite.fr')
  })
})
