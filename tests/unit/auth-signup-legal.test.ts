import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Régression du 23/09/2026 : le formulaire d'inscription ne renvoyait vers
 * aucun texte contractuel. Seul lien présent dans la page : la bannière
 * cookies. Un test de rendu React serait plus fidèle, mais le composant est
 * un client component à formulaire ; on vérifie ici le contrat minimal, qui
 * est que les deux liens existent et pointent vers des pages réelles.
 */
const source = readFileSync(
  join(process.cwd(), 'components/features/auth/signup-form.tsx'),
  'utf8'
)

describe('mentions légales à l’inscription', () => {
  it('annonce l’acceptation à la création du compte', () => {
    expect(source).toContain('En créant un compte, vous acceptez')
  })

  it('renvoie aux conditions générales et à la politique de confidentialité', () => {
    expect(source).toContain('href="/legal/cgv"')
    expect(source).toContain('href="/legal/privacy"')
  })

  it('pointe vers des pages qui existent', () => {
    for (const route of ['cgv', 'privacy']) {
      expect(() =>
        readFileSync(join(process.cwd(), `app/(marketing)/legal/${route}/page.tsx`), 'utf8')
      ).not.toThrow()
    }
  })
})
