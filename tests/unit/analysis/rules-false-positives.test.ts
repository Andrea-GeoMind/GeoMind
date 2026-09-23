import { describe, it, expect } from 'vitest'
import { checkNoindexOnKeyPages } from '@/lib/analysis/technical/rules/noindex-on-key-pages'
import { checkNoConclusionOrSummary } from '@/lib/analysis/content/rules/no-conclusion-or-summary'
import { checkHeadingsTooShort } from '@/lib/analysis/content/rules/headings-too-short'
import { checkNoTableOfContents } from '@/lib/analysis/content/rules/no-table-of-contents'

const input = { pages: [], siteUrl: 'https://x.fr' }
const filler = (n: number) => Array.from({ length: n }, (_, i) => `mot${i}`).join(' ')

describe('checkNoindexOnKeyPages', () => {
  // `robotsHtml` = ce qu'on a extrait du HTML brut nous-mêmes. Le champ
  // `robots` de Firecrawl est volontairement ignoré depuis le 23/09.
  const page = (url: string) => ({
    url,
    markdown: '# T',
    statusCode: 200,
    metadata: { robots: 'noindex, nofollow', robotsHtml: ['noindex, nofollow'] },
  })

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

describe('checkNoTableOfContents', () => {
  const long = (toc: string) => ({
    url: 'https://x.fr/blog/guide',
    statusCode: 200,
    markdown: `# Guide\n\n${toc}\n\n${filler(1600)}`,
  })

  it('reconnaît un sommaire en ancres relatives', async () => {
    expect(await checkNoTableOfContents(long('1. [Partie A](#partie-a)\n2. [Partie B](#partie-b)'), input)).toBeNull()
  })

  it('reconnaît un sommaire dont les ancres ont été résolues en URLs absolues', async () => {
    // C'est ce que produit Firecrawl : la page avait bien un sommaire, et la
    // règle le déclarait absent.
    const toc =
      '1. [Partie A](https://x.fr/blog/guide#partie-a)\n2. [Partie B](https://x.fr/blog/guide#partie-b)'
    expect(await checkNoTableOfContents(long(toc), input)).toBeNull()
  })

  it('signale une page très longue réellement sans sommaire', async () => {
    const page = long('Un paragraphe d introduction, et [un lien](https://ailleurs.fr/page).')
    expect((await checkNoTableOfContents(page, input))?.ruleKey).toBe('no_table_of_contents')
  })

  it('ne compte pas un lien vers une ancre d une AUTRE page', async () => {
    const toc = '[Voir ailleurs](https://x.fr/blog/autre#section)'
    expect((await checkNoTableOfContents(long(toc), input))?.ruleKey).toBe('no_table_of_contents')
  })
})
