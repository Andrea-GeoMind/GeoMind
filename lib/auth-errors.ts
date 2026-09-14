/**
 * lib/auth-errors.ts
 *
 * Traduction des erreurs Supabase Auth (GoTrue) en messages français
 * affichables. Jamais de message technique brut (« fetch failed »,
 * « Invalid login credentials ») côté utilisateur : on mappe par code
 * d'erreur d'abord, par contenu du message ensuite, avec un fallback
 * générique. L'erreur d'origine est loggée côté serveur par l'appelant.
 */

interface AuthErrorLike {
  code?: string
  message: string
}

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: 'Confirmez votre email avant de vous connecter (vérifiez vos spams).',
  user_already_exists: 'Un compte existe déjà avec cet email. Connectez-vous.',
  email_exists: 'Un compte existe déjà avec cet email. Connectez-vous.',
  weak_password: 'Mot de passe trop faible : utilisez au moins 8 caractères.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  over_email_send_rate_limit: 'Trop d’emails envoyés. Réessayez dans quelques minutes.',
  signup_disabled: 'Les inscriptions sont temporairement fermées.',
  user_not_found: 'Aucun compte ne correspond à cet email.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  session_expired: 'Votre session a expiré. Reconnectez-vous.',
  validation_failed: 'Email invalide. Vérifiez la saisie.',
}

const NETWORK_PATTERNS = [
  'fetch failed',
  'network',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'timeout',
  'socket',
]

const GENERIC_ERROR = 'Une erreur est survenue. Veuillez réessayer.'
export const SERVICE_UNAVAILABLE =
  'Service momentanément indisponible. Réessayez dans un instant.'

export function humanizeAuthError(error: AuthErrorLike): string {
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code]

  const msg = error.message.toLowerCase()

  if (NETWORK_PATTERNS.some((p) => msg.includes(p.toLowerCase()))) {
    return SERVICE_UNAVAILABLE
  }
  if (msg.includes('invalid login credentials')) return BY_CODE.invalid_credentials
  if (msg.includes('email not confirmed')) return BY_CODE.email_not_confirmed
  if (msg.includes('already registered')) return BY_CODE.user_already_exists
  if (msg.includes('password should be at least')) return BY_CODE.weak_password
  if (msg.includes('rate limit')) return BY_CODE.over_request_rate_limit
  if (msg.includes('is invalid')) return BY_CODE.validation_failed

  return GENERIC_ERROR
}
