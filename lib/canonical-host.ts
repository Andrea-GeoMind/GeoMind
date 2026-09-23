/**
 * lib/canonical-host.ts
 *
 * Hôte canonique du site : geomind.fr, sans « www ».
 *
 * Les cookies posés par Supabase sont liés à l'hôte (pas de `domain`
 * explicite) : une session ouverte sur geomind.fr n'est pas envoyée à
 * www.geomind.fr. Tant que les deux hôtes répondent, un lien vers le mauvais
 * déconnecte l'utilisateur en apparence.
 *
 * Au moment d'écrire ceci, www.geomind.fr ne résout pas — la redirection ne se
 * déclenchera donc jamais en production. Elle est posée en garde : le jour où
 * le sous-domaine est activé chez le registrar ou chez Vercel, le
 * comportement est déjà bon, et il n'y a pas de fenêtre pendant laquelle les
 * deux hôtes servent l'application avec deux jeux de cookies distincts.
 *
 * Fonction pure, testée — le middleware ne fait que l'appliquer.
 */

/** Renvoie l'URL de redirection si l'hôte demandé n'est pas canonique, sinon null. */
export function canonicalRedirectUrl(requestUrl: string): string | null {
  let url: URL
  try {
    url = new URL(requestUrl)
  } catch {
    return null
  }

  // `hostname` exclut le port : on le conserve tel quel pour le développement
  // local (localhost:3000 n'est pas concerné, il n'a pas de « www. »).
  if (!url.hostname.startsWith('www.')) return null

  const target = new URL(url)
  target.hostname = url.hostname.slice('www.'.length)
  return target.toString()
}
