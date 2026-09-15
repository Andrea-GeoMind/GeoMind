import { describe, it, expect } from 'vitest'
import { analysablePages, wasScrapedSuccessfully } from '@/lib/analysis/page-health'

describe('wasScrapedSuccessfully', () => {
  it('accepte un 200', () => expect(wasScrapedSuccessfully({ statusCode: 200 })).toBe(true))
  it('accepte un statut inconnu', () => {
    expect(wasScrapedSuccessfully({ statusCode: null })).toBe(true)
    expect(wasScrapedSuccessfully({})).toBe(true)
  })
  it('écarte un 5xx (échec transitoire de scrape)', () =>
    expect(wasScrapedSuccessfully({ statusCode: 500 })).toBe(false))
  it('écarte un 404 et une redirection', () => {
    expect(wasScrapedSuccessfully({ statusCode: 404 })).toBe(false)
    expect(wasScrapedSuccessfully({ statusCode: 301 })).toBe(false)
  })
})

describe('analysablePages', () => {
  it('ne garde que les pages réellement lues', () => {
    const pages = [
      { url: 'a', statusCode: 200 },
      { url: 'b', statusCode: 500 },
      { url: 'c', statusCode: null },
      { url: 'd', statusCode: 404 },
    ]
    expect(analysablePages(pages).map((p) => p.url)).toEqual(['a', 'c'])
  })
})
