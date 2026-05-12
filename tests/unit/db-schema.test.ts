import { describe, it, expect } from 'vitest'
import { profiles, subscriptions, sites } from '@/lib/db/schema'
import { getTableColumns } from 'drizzle-orm'

describe('Schema: profiles', () => {
  it('a les colonnes obligatoires', () => {
    const cols = Object.keys(getTableColumns(profiles))
    expect(cols).toContain('id')
    expect(cols).toContain('email')
    expect(cols).toContain('createdAt')
  })
})

describe('Schema: subscriptions', () => {
  it('a les colonnes obligatoires', () => {
    const cols = Object.keys(getTableColumns(subscriptions))
    expect(cols).toContain('id')
    expect(cols).toContain('userId')
    expect(cols).toContain('plan')
    expect(cols).toContain('status')
  })
})

describe('Schema: sites', () => {
  it('a les colonnes obligatoires', () => {
    const cols = Object.keys(getTableColumns(sites))
    expect(cols).toContain('id')
    expect(cols).toContain('userId')
    expect(cols).toContain('name')
    expect(cols).toContain('url')
    expect(cols).toContain('language')
    expect(cols).toContain('country')
  })
})
