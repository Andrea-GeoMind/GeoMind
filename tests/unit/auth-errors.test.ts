import { describe, it, expect } from 'vitest'
import { humanizeAuthError, SERVICE_UNAVAILABLE } from '@/lib/auth-errors'

describe('humanizeAuthError', () => {
  it('traduit les codes GoTrue connus', () => {
    expect(humanizeAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'Email ou mot de passe incorrect.'
    )
    expect(humanizeAuthError({ code: 'user_already_exists', message: 'User already registered' })).toBe(
      'Un compte existe déjà avec cet email. Connectez-vous.'
    )
    expect(humanizeAuthError({ code: 'over_email_send_rate_limit', message: 'rate limit' })).toBe(
      'Trop d’emails envoyés. Réessayez dans quelques minutes.'
    )
  })

  it('ne montre jamais « fetch failed » brut (panne réseau/DB)', () => {
    expect(humanizeAuthError({ message: 'fetch failed' })).toBe(SERVICE_UNAVAILABLE)
    expect(humanizeAuthError({ message: 'TypeError: fetch failed' })).toBe(SERVICE_UNAVAILABLE)
    expect(humanizeAuthError({ message: 'getaddrinfo ENOTFOUND xyz.supabase.co' })).toBe(
      SERVICE_UNAVAILABLE
    )
    expect(humanizeAuthError({ message: 'connect ECONNREFUSED 127.0.0.1:5432' })).toBe(
      SERVICE_UNAVAILABLE
    )
  })

  it('mappe par contenu de message quand le code est absent', () => {
    expect(humanizeAuthError({ message: 'Invalid login credentials' })).toBe(
      'Email ou mot de passe incorrect.'
    )
    expect(humanizeAuthError({ message: 'Email not confirmed' })).toBe(
      'Confirmez votre email avant de vous connecter (vérifiez vos spams).'
    )
    expect(humanizeAuthError({ message: 'Password should be at least 6 characters' })).toBe(
      'Mot de passe trop faible : utilisez au moins 8 caractères.'
    )
  })

  it('retombe sur un message générique français pour l’inconnu', () => {
    const out = humanizeAuthError({ message: 'Some unexpected internal thing' })
    expect(out).toBe('Une erreur est survenue. Veuillez réessayer.')
  })
})
