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


/**
 * Motifs d'URL trahissant une tête de réseau.
 *
 * Le dry-run du 19/09 a laissé passer « Morel - Cuisines » sur
 * `cuisines-morel.com/point_de_vente/...` et « Notes de Styles » sur
 * `notesdestyles.com/nos-agences/...` : le nom ne dit rien, mais le chemin
 * révèle une page d'agence dans un site national. Le gérant local n'a pas la
 * main dessus — c'est exactement ce qu'on veut écarter.
 */
const NETWORK_URL_PATTERNS = [
  /\/point[_-]?de[_-]?vente/i,
  /\/nos[_-]agences/i,
  /\/agences?\//i,
  /\/magasins?\//i,
  /\/showrooms?\//i,
  /\/franchise/i,
  /\/nos[_-]magasins/i,
]

/**
 * Motifs de dépannage d'urgence, cherchés dans le nom ET dans l'URL.
 *
 * Le dry-run a retenu « Atelier 2 Créqui » sur
 * `depannage-electricien-lyon.fr` et « D24 » sur `depannage24.com` : le nom
 * est neutre, le domaine ne l'est pas. Métier et discours différents.
 */
const EMERGENCY_PATTERNS = [
  /d[ée]pannage/i,
  /24\s*h/i,
  /24\/7/i,
  /urgence/i,
  /\ballo\b/i,
  /\bsos\b/i,
]

/** Vrai si le nom ou l'URL trahit une activité de dépannage d'urgence. */
export function isEmergencyService(name: string, website: string | null): boolean {
  const haystack = `${name} ${website ?? ''}`
  return EMERGENCY_PATTERNS.some((re) => re.test(haystack))
}

export function isFranchise(name: string, website: string | null): boolean {
  const n = normalise(name)
  if (FRANCHISE_NAMES.some((f) => n.includes(normalise(f)))) return true

  if (website) {
    try {
      const u = new URL(website)
      const host = u.hostname.replace(/^www\./, '').toLowerCase()
      if (FRANCHISE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return true
      // Page d'agence dans un site national : le nom ne dit rien, le chemin si.
      if (NETWORK_URL_PATTERNS.some((re) => re.test(u.pathname))) return true
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
