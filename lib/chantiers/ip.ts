import { isIPv4, isIPv6 } from 'net'

/**
 * IP tronquée pour le journal des accès et la limitation de débit de l'espace
 * client : IPv4 au /24 (dernier octet à 0), IPv6 au /48. Assez pour repérer un
 * abus ou une provenance, pas assez pour identifier une personne (RGPD :
 * minimisation).
 */

export const UNKNOWN_IP = 'inconnue'

export function truncateIp(raw: string | null | undefined): string {
  if (!raw) return UNKNOWN_IP
  let ip = raw.trim()

  // IPv4 encapsulée dans IPv6 (::ffff:1.2.3.4) : traitée comme IPv4
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  if (mapped?.[1]) ip = mapped[1]

  if (isIPv4(ip)) {
    const [a, b, c] = ip.split('.')
    return `${a}.${b}.${c}.0`
  }

  if (isIPv6(ip)) {
    const hextets = expandIpv6(ip).slice(0, 3).map((h) => h.replace(/^0+(?=.)/, ''))
    return `${hextets.join(':')}::/48`
  }

  return UNKNOWN_IP
}

/** Développe une IPv6 valide en ses 8 groupes (« :: » remplacé par des zéros). */
function expandIpv6(ip: string): string[] {
  const [head = '', tail] = ip.toLowerCase().split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const missing = 8 - left.length - right.length
  return [...left, ...Array.from({ length: tail === undefined ? 0 : missing }, () => '0'), ...right]
}

/** IP du client derrière le proxy Vercel, même logique que /api/public-audit. */
export function clientIpFromHeaders(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null
  )
}
