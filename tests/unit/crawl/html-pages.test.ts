import { describe, it, expect } from 'vitest'
import {
  isHtmlCandidateUrl,
  isHtmlContentType,
  isAnalyzablePage,
} from '@/lib/crawl/html-pages'

/**
 * Régression du 2026-10-03 : le crawl avalait les sitemaps et les passait au
 * moteur de règles comme des pages. 79 des 251 constats techniques en base
 * portaient sur des fichiers non-HTML — 42 sur un seul rapport client.
 */
describe('URL candidates à l’analyse', () => {
  it('écarte les sitemaps et les fichiers de données', () => {
    for (const u of [
      'https://x.fr/sitemap_index.xml',
      'https://x.fr/page-sitemap.xml',
      'https://x.fr/post-sitemap.xml',
      'https://x.fr/feed.rss',
      'https://x.fr/llms.txt',
      'https://x.fr/robots.txt',
      'https://x.fr/data.json',
    ]) {
      expect(isHtmlCandidateUrl(u)).toBe(false)
    }
  })

  it('écarte les médias et les ressources', () => {
    for (const u of [
      'https://x.fr/logo.png',
      'https://x.fr/doc.pdf',
      'https://x.fr/style.css',
      'https://x.fr/app.js',
      'https://x.fr/font.woff2',
    ]) {
      expect(isHtmlCandidateUrl(u)).toBe(false)
    }
  })

  it('garde les pages, avec ou sans extension', () => {
    for (const u of [
      'https://x.fr/',
      'https://x.fr/implants-dentaires/',
      'https://x.fr/blog',
      'https://x.fr/a-propos.html',
      'https://x.fr/recherche?q=sitemap.xml',
    ]) {
      expect(isHtmlCandidateUrl(u)).toBe(true)
    }
  })

  it('ne juge que le chemin, pas la query', () => {
    // `?q=sitemap.xml` ne fait pas de la page un sitemap.
    expect(isHtmlCandidateUrl('https://x.fr/page?file=a.pdf')).toBe(true)
  })

  it('écarte une URL illisible', () => {
    expect(isHtmlCandidateUrl('pas une url')).toBe(false)
  })
})

describe('content-type', () => {
  it('accepte le HTML', () => {
    expect(isHtmlContentType('text/html')).toBe(true)
    expect(isHtmlContentType('text/html; charset=UTF-8')).toBe(true)
    expect(isHtmlContentType('application/xhtml+xml')).toBe(true)
  })

  it('écarte le reste', () => {
    for (const t of ['application/xml', 'text/xml', 'application/json', 'application/pdf']) {
      expect(isHtmlContentType(t)).toBe(false)
    }
  })

  it('reste permissif quand l’en-tête manque', () => {
    // Beaucoup de réponses ne l'exposent pas à ce stade : écarter par défaut
    // ferait perdre des pages valides.
    expect(isHtmlContentType(null)).toBe(true)
    expect(isHtmlContentType(undefined)).toBe(true)
  })
})

describe('les deux filtres ensemble', () => {
  it('attrape un sitemap servi sans extension', () => {
    expect(isAnalyzablePage('https://x.fr/sitemap', 'application/xml')).toBe(false)
  })

  it('attrape un sitemap servi en text/html', () => {
    // L'extension tranche là où le content-type ment.
    expect(isAnalyzablePage('https://x.fr/sitemap.xml', 'text/html')).toBe(false)
  })

  it('laisse passer une vraie page', () => {
    expect(isAnalyzablePage('https://x.fr/implants/', 'text/html; charset=UTF-8')).toBe(true)
  })
})
