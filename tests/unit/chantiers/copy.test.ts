import { describe, it, expect } from 'vitest'
import {
  CHANTIER_COPY,
  COPY_PLACEHOLDERS,
  DEFAULT_GEOMIND_ADDRESS,
  fillCopy,
  geomindAddressFor,
} from '@/lib/chantiers/copy'
import { FIELD_CATALOG } from '@/lib/chantiers/fields'
import { UPLOAD_ERROR_MESSAGES } from '@/lib/chantiers/files'

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

const allTexts = [...strings(CHANTIER_COPY), ...strings(FIELD_CATALOG), ...strings(UPLOAD_ERROR_MESSAGES)]

describe('textes du client', () => {
  it('tous les repères [XXX] sont connus de fillCopy', () => {
    const known = new Set<string>(COPY_PLACEHOLDERS)
    const found = new Set(allTexts.flatMap((t) => t.match(/\[[A-Z_]+\]/g) ?? []))
    expect([...found].filter((p) => !known.has(p))).toEqual([])
  })

  it('la phrase sur les mots de passe est présente dans la section Accès', () => {
    expect(CHANTIER_COPY.access.noPassword).toMatch(/jamais de mot de passe/)
  })

  it('[ADRESSE] et [CONTACT] : l’adresse Gmail par défaut, réglable par chantier', () => {
    expect(DEFAULT_GEOMIND_ADDRESS).toBe('andrea.schwertz2008@gmail.com')
    expect(geomindAddressFor({})).toBe('andrea.schwertz2008@gmail.com')
    expect(geomindAddressFor({ geomindAddress: '  ' })).toBe('andrea.schwertz2008@gmail.com')
    expect(geomindAddressFor({ geomindAddress: 'autre@exemple.fr' })).toBe('autre@exemple.fr')
  })

  it('fillCopy remplace toutes les occurrences', () => {
    expect(fillCopy('[ADRESSE] puis [ADRESSE] et [CLIENT]', { '[ADRESSE]': 'a@b.fr', '[CLIENT]': 'Oravis' })).toBe(
      'a@b.fr puis a@b.fr et Oravis'
    )
  })

  it('pas d’apostrophe droite dans les textes (typographie homogène)', () => {
    const offenders = allTexts.filter((t) => t.includes("'"))
    expect(offenders).toEqual([])
  })
})
