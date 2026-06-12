import type { TechnicalPageRuleFn } from '../types'

/** Scope page : l'attribut de langue (html lang) est absent ou vide. */
export const checkHtmlLangMissing: TechnicalPageRuleFn = async (page) => {
  if (!page.metadata) return null
  const language = page.metadata.language
  if (typeof language === 'string' && language.trim() !== '') return null
  return {
    ruleKey: 'html_lang_missing',
    category: 'accessibility',
    title: 'Langue de la page non déclarée',
    description:
      "Cette page ne déclare pas sa langue (attribut lang du HTML). Les IA s'en servent pour servir votre contenu aux bonnes requêtes : sans lui, une page en français peut être mal classée et ne jamais ressortir face à une question posée en français à ChatGPT ou Perplexity.",
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 1,
    impact: 2,
  }
}
