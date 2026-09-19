/**
 * Exclusion des franchises et réseaux.
 *
 * Une franchise a un site national géré par le siège : le gérant local n'a pas
 * la main dessus, donc l'audit ne lui sert à rien et l'argumentaire tombe à
 * plat. On écarte sur le nom commercial, et sur le domaine quand plusieurs
 * établissements partagent le même site.
 */

const FRANCHISE_NAMES = [
  // Cuisinistes
  "socoo'c", 'socooc', 'schmidt', 'aviva', 'cuisinella', 'ixina', 'mobalpa',
  'lapeyre', 'darty cuisine', 'but cuisine', 'conforama', 'ikea',
  // Santé
  'dentego', 'dentexia', 'addentis', 'sourire', 'jean coutu',
  // Bâtiment / rénovation
  'camif habitat', 'illico travaux', 'maisons france confort', 'technitoit',
  'harmonie renovation', 'la maison des travaux', 'renovation man',
  'hexa renov', 'costulec', 'proxi renov',
  // Déménagement
  'demeco', 'les gentlemen du demenagement', 'demenagements bernard',
  'agediss', 'demenageurs bretons',
  // Dépannage / réseaux plomberie-élec
  'depann', 'allo depannage', 'sos plomberie', 'aquarelle depannage',
  'engie home services', 'proxiserve', 'savelys',
  // Photo / événementiel
  'studio harcourt', 'photobox',
  // Paysage
  'daniel moquet', 'jardins de france', "o'jardin", 'paysagiste conseil',
]

/** Domaines de tête de réseau : plusieurs établissements, un seul site. */
const FRANCHISE_DOMAINS = [
  'socooc.fr', 'cuisines-schmidt.com', 'aviva-cuisines.com', 'cuisinella.com',
  'ixina.fr', 'mobalpa.fr', 'lapeyre.fr', 'dentego.fr', 'demeco.fr',
  'engie-homeservices.fr', 'proxiserve.fr', 'danielmoquet.com',
  'illico-travaux.com', 'lamaisondestravaux.com',
]

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isFranchise(name: string, website: string | null): boolean {
  const n = normalise(name)
  if (FRANCHISE_NAMES.some((f) => n.includes(normalise(f)))) return true

  if (website) {
    try {
      const host = new URL(website).hostname.replace(/^www\./, '').toLowerCase()
      if (FRANCHISE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return true
    } catch {
      // URL illisible : on ne conclut pas à une franchise pour autant.
    }
  }
  return false
}

/**
 * Plusieurs établissements partageant un domaine trahissent un réseau que la
 * liste de noms ne couvre pas. Renvoie les domaines apparaissant plus de
 * `threshold` fois.
 */
export function detectSharedDomains(
  websites: (string | null)[],
  threshold = 2
): Set<string> {
  const counts = new Map<string, number>()
  for (const w of websites) {
    if (!w) continue
    try {
      const host = new URL(w).hostname.replace(/^www\./, '').toLowerCase()
      counts.set(host, (counts.get(host) ?? 0) + 1)
    } catch {
      continue
    }
  }
  return new Set([...counts.entries()].filter(([, c]) => c > threshold).map(([h]) => h))
}
