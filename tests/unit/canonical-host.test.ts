import { describe, it, expect } from 'vitest'
import { canonicalRedirectUrl } from '@/lib/canonical-host'

describe('canonicalRedirectUrl', () => {
  it('redirige www vers l’apex en conservant chemin et requête', () => {
    expect(canonicalRedirectUrl('https://www.geomind.fr/blog/geo-vs-seo?utm=x')).toBe(
      'https://geomind.fr/blog/geo-vs-seo?utm=x'
    )
  })

  it('conserve le fragment et le protocole', () => {
    expect(canonicalRedirectUrl('http://www.geomind.fr/pricing#plans')).toBe(
      'http://geomind.fr/pricing#plans'
    )
  })

  it('ne touche pas à l’apex', () => {
    expect(canonicalRedirectUrl('https://geomind.fr/dashboard')).toBeNull()
  })

  it('ne touche pas au développement local', () => {
    expect(canonicalRedirectUrl('http://localhost:3000/dashboard')).toBeNull()
    expect(canonicalRedirectUrl('http://127.0.0.1:3000/')).toBeNull()
  })

  it('ne redirige pas un hôte qui contient « www » sans en être un sous-domaine', () => {
    expect(canonicalRedirectUrl('https://wwwgeomind.fr/')).toBeNull()
    expect(canonicalRedirectUrl('https://my-www.geomind.fr/')).toBeNull()
  })

  it('ne retire qu’un seul niveau « www. »', () => {
    expect(canonicalRedirectUrl('https://www.www.geomind.fr/')).toBe('https://www.geomind.fr/')
  })

  it('renvoie null sur une entrée qui n’est pas une URL', () => {
    expect(canonicalRedirectUrl('pas une url')).toBeNull()
  })
})
