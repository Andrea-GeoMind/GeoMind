import { describe, it, expect } from 'vitest'
import { checkFirstParagraphNoAnswer } from '@/lib/analysis/content/rules/first-paragraph-no-answer'
import { checkNoAuthorBio } from '@/lib/analysis/content/rules/no-author-bio'
import { checkHeadingsTooShort } from '@/lib/analysis/content/rules/headings-too-short'
import { checkPoorSentenceLength } from '@/lib/analysis/content/rules/poor-sentence-length'
import { checkKeywordNotInHeadings } from '@/lib/analysis/content/rules/keyword-not-in-headings'
import { checkNoConclusionOrSummary } from '@/lib/analysis/content/rules/no-conclusion-or-summary'
import { checkNoTableOfContents } from '@/lib/analysis/content/rules/no-table-of-contents'
import type { FirecrawlPage, RuleInput } from '@/lib/analysis/content/types'

const SITE_URL = 'https://example.com'
const EMPTY_INPUT: RuleInput = { pages: [], siteUrl: SITE_URL }

// ─── checkFirstParagraphNoAnswer ──────────────────────────────────────────────

describe('checkFirstParagraphNoAnswer', () => {
  it('detects a first paragraph that is too short', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: '# Comment choisir son logiciel de facturation ?\n\nBonjour et bienvenue.\n\nSuite du contenu.',
    }
    const result = await checkFirstParagraphNoAnswer(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('first_paragraph_no_answer')
    expect(result!.category).toBe('readability')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(3)
    expect(result!.sampleUrls).toEqual([page.url])
  })

  it('detects a long first paragraph that shares no significant word with the H1', async () => {
    const filler = 'aujourd\'hui nous parlons de sujets variés concernant la vie quotidienne des gens et leurs habitudes alimentaires pendant les vacances scolaires en montagne avec des amis proches venus de loin'
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: `# Comment choisir son logiciel de facturation ?\n\n${filler}\n\nSuite.`,
    }
    const result = await checkFirstParagraphNoAnswer(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('first_paragraph_no_answer')
  })

  it('returns null when the first paragraph answers the title', async () => {
    const answer =
      'Pour choisir un logiciel de facturation adapté à votre entreprise, commencez par lister vos besoins réels : nombre de factures mensuelles, conformité légale, intégrations bancaires et budget disponible chaque mois.'
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: `# Comment choisir son logiciel de facturation ?\n\n${answer}`,
    }
    expect(await checkFirstParagraphNoAnswer(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null when the page has no H1', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: 'Du texte sans titre principal.',
    }
    expect(await checkFirstParagraphNoAnswer(page, EMPTY_INPUT)).toBeNull()
  })
})

// ─── checkNoAuthorBio ─────────────────────────────────────────────────────────

describe('checkNoAuthorBio', () => {
  it('detects an article without author', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/blog/mon-article',
      markdown: '# Mon article\n\nVoici un texte sur la hauteur des arbres, par exemple en forêt.',
    }
    const result = await checkNoAuthorBio(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_author_bio')
    expect(result!.category).toBe('readability')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
  })

  it('returns null when the article is signed ("Rédigé par Marie Dupont")', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/blog/mon-article',
      markdown: '# Mon article\n\nContenu.\n\nRédigé par Marie Dupont.',
    }
    expect(await checkNoAuthorBio(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null for non-article pages', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/services',
      markdown: 'Nos services sans auteur mentionné.',
    }
    expect(await checkNoAuthorBio(page, EMPTY_INPUT)).toBeNull()
  })
})

// ─── checkHeadingsTooShort ────────────────────────────────────────────────────

describe('checkHeadingsTooShort', () => {
  it('detects when more than half of the H2 are under 30 characters', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      metadata: { h2: ['Services', 'Infos', 'Comment bien choisir son prestataire local ?'] },
    }
    const result = await checkHeadingsTooShort(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('headings_too_short')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(1)
    expect(result!.impact).toBe(1)
  })

  it('returns null when the H2 are descriptive', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      metadata: {
        h2: [
          'Comment bien choisir son prestataire local ?',
          'Les critères qui comptent vraiment pour votre budget',
        ],
      },
    }
    expect(await checkHeadingsTooShort(page, EMPTY_INPUT)).toBeNull()
  })

  it('falls back to markdown H2 parsing and returns null with fewer than 2 H2', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: '# Titre\n\n## Court\n\nContenu.',
    }
    expect(await checkHeadingsTooShort(page, EMPTY_INPUT)).toBeNull()
  })

  it('detects short H2 parsed from markdown', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: '# Titre\n\n## Court\n\nContenu.\n\n## Bref\n\nContenu.',
    }
    expect(await checkHeadingsTooShort(page, EMPTY_INPUT)).not.toBeNull()
  })
})

// ─── checkPoorSentenceLength ──────────────────────────────────────────────────

describe('checkPoorSentenceLength', () => {
  it('detects sentences averaging more than 30 words', async () => {
    const longSentence = `${'mot '.repeat(35).trim()}. `
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: longSentence.repeat(12),
    }
    const result = await checkPoorSentenceLength(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('poor_sentence_length')
    expect(result!.category).toBe('readability')
    expect(result!.severity).toBe('minor')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
  })

  it('returns null when sentences are short', async () => {
    const shortSentence = `${'mot '.repeat(10).trim()}. `
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: shortSentence.repeat(12),
    }
    expect(await checkPoorSentenceLength(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null with fewer than 10 sentences', async () => {
    const longSentence = `${'mot '.repeat(40).trim()}. `
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: longSentence.repeat(3),
    }
    expect(await checkPoorSentenceLength(page, EMPTY_INPUT)).toBeNull()
  })
})

// ─── checkKeywordNotInHeadings ────────────────────────────────────────────────

describe('checkKeywordNotInHeadings', () => {
  const INPUT_WITH_KEYWORDS: RuleInput = {
    pages: [],
    siteUrl: SITE_URL,
    keywords: ['logiciel de facturation', 'devis'],
  }

  it('detects a page whose headings contain no target keyword', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: '# Nos services\n\nContenu.\n\n## Notre approche\n\nContenu.',
    }
    const result = await checkKeywordNotInHeadings(page, INPUT_WITH_KEYWORDS)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('keyword_not_in_headings')
    expect(result!.category).toBe('coverage')
    expect(result!.severity).toBe('moderate')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(2)
  })

  it('returns null when a keyword appears in a heading (case/accents-insensitive)', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: '# Le meilleur LOGICIEL DE FACTURATION pour TPE\n\nContenu.',
    }
    expect(await checkKeywordNotInHeadings(page, INPUT_WITH_KEYWORDS)).toBeNull()
  })

  it('returns null when the site has no keywords', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: '# Nos services',
    }
    expect(await checkKeywordNotInHeadings(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null when the page has no headings', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: 'Texte brut sans titres.',
    }
    expect(await checkKeywordNotInHeadings(page, INPUT_WITH_KEYWORDS)).toBeNull()
  })
})

// ─── checkNoConclusionOrSummary ───────────────────────────────────────────────

describe('checkNoConclusionOrSummary', () => {
  const longBody = 'mot '.repeat(900).trim()

  it('detects a long page without conclusion', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: `# Guide complet\n\n${longBody}\n\n## Détails supplémentaires\n\nEncore du contenu final.`,
    }
    const result = await checkNoConclusionOrSummary(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_conclusion_or_summary')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
  })

  it('returns null when the page ends with a conclusion section', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: `# Guide complet\n\n${longBody}\n\n## En bref\n\nVoici les points à retenir.`,
    }
    expect(await checkNoConclusionOrSummary(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null for short pages', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: '# Court\n\nUne page courte sans conclusion.',
    }
    expect(await checkNoConclusionOrSummary(page, EMPTY_INPUT)).toBeNull()
  })
})

// ─── checkNoTableOfContents ───────────────────────────────────────────────────

describe('checkNoTableOfContents', () => {
  const veryLongBody = 'mot '.repeat(1600).trim()

  it('detects a very long page without anchor links', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: `# Guide\n\n${veryLongBody}`,
    }
    const result = await checkNoTableOfContents(page, EMPTY_INPUT)
    expect(result).not.toBeNull()
    expect(result!.ruleKey).toBe('no_table_of_contents')
    expect(result!.category).toBe('structure')
    expect(result!.severity).toBe('opportunity')
    expect(result!.effort).toBe(2)
    expect(result!.impact).toBe(1)
  })

  it('returns null when the page has a table of contents', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/guide',
      markdown: `# Guide\n\n- [Section 1](#section-1)\n- [Section 2](#section-2)\n\n${veryLongBody}`,
    }
    expect(await checkNoTableOfContents(page, EMPTY_INPUT)).toBeNull()
  })

  it('returns null for pages under 1500 words', async () => {
    const page: FirecrawlPage = {
      url: 'https://example.com/page',
      markdown: `# Page\n\n${'mot '.repeat(500).trim()}`,
    }
    expect(await checkNoTableOfContents(page, EMPTY_INPUT)).toBeNull()
  })
})
