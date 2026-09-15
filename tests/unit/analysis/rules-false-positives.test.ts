import { describe, it, expect } from 'vitest'
import { checkNoindexOnKeyPages } from '@/lib/analysis/technical/rules/noindex-on-key-pages'
import { checkNoConclusionOrSummary } from '@/lib/analysis/content/rules/no-conclusion-or-summary'
import { checkHeadingsTooShort } from '@/lib/analysis/content/rules/headings-too-short'

const input = { pages: [], siteUrl: 'https://x.fr' }
const filler = (n: number) => Array.from({ length: n }, (_, i) => `mot${i}`).join(' ')

describe('checkNoindexOnKeyPages', () => {
  const page = (url: string) => ({ url, markdown: '# T', statusCode: 200, metadata: { robots: 'noindex, nofollow' } })

  it("ne reproche pas son noindex à une page de connexion — c'est la bonne pratique", async () => {
    for (const url of ['https://x.fr/login', 'https://x.fr/signup', 'https://x.fr/connexion/', 'https://x.fr/mon-compte']) {
      expect(await checkNoindexOnKeyPages(page(url), input)).toBeNull()
    }
  })

  it('signale un noindex sur une vraie page stratégique', async () => {
    expect((await checkNoindexOnKeyPages(page('https://x.fr/a-propos'), input))?.severity).toBe('major')
    expect((await checkNoindexOnKeyPages(page('https://x.fr/'), input))?.ruleKey).toBe('noindex_on_key_pages')
  })
})

describe('checkNoConclusionOrSummary', () => {
  const longPage = (tail: string) => ({
    url: 'https://x.fr/guide',
    statusCode: 200,
    markdown: `# Guide\n\n${filler(900)}\n\n${tail}`,
  })

  it('accepte une conclusion suivie de la bio et des articles liés', async () => {
    const page = longPage(
      '## À retenir\n\nLe point essentiel du guide.\n\n## Rédigé par A. Schwertz\n\nBio.\n\n## Continuer la lecture\n\n- Autre guide'
    )
    expect(await checkNoConclusionOrSummary(page, input)).toBeNull()
  })

  it('signale une page longue qui ne conclut nulle part', async () => {
    const page = longPage('## Un dernier point\n\nUne section de plus, sans synthèse.')
    expect((await checkNoConclusionOrSummary(page, input))?.ruleKey).toBe('no_conclusion_or_summary')
  })

  it('ne cherche pas de conclusion sur une page courte', async () => {
    expect(
      await checkNoConclusionOrSummary({ url: 'https://x.fr/a', statusCode: 200, markdown: `# A\n\n${filler(100)}` }, input)
    ).toBeNull()
  })
})

describe('checkHeadingsTooShort', () => {
  const short = ['llms.txt', 'GPTBot', 'E-E-A-T', 'Fraîcheur']

  it("n'exige pas de titres descriptifs sur un glossaire — ses titres sont des termes", async () => {
    const page = {
      url: 'https://x.fr/glossaire',
      statusCode: 200,
      markdown: short.map((h) => `## ${h}`).join('\n\n'),
      metadata: { schemaOrgs: [{ '@type': 'DefinedTermSet' }] },
    }
    expect(await checkHeadingsTooShort(page, input)).toBeNull()
  })

  it('signale des titres vagues sur une page ordinaire', async () => {
    const page = {
      url: 'https://x.fr/services',
      statusCode: 200,
      markdown: short.map((h) => `## ${h}`).join('\n\n'),
      metadata: { schemaOrgs: [] },
    }
    expect((await checkHeadingsTooShort(page, input))?.ruleKey).toBe('headings_too_short')
  })
})
