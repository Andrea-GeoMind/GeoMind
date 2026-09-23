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

  // ── Série « commerces » ──────────────────────────────────────────────────
  // Coworking
  'wojo', 'regus', 'spaces', 'wework', 'morning coworking', 'deskeo',
  'startway', 'multiburo', 'hiptown', 'anticafe', 'newton offices',
  'ic lyon', 'la cordee',
  // Salles de sport et réseaux fitness
  'basic-fit', 'basic fit', 'fitness park', "l'orange bleue", 'orange bleue',
  'neoness', 'keepcool', 'keep cool', 'vita liberte', "l'appart fitness",
  'appart fitness', 'curves', 'magic form', 'cmg sports club', 'on air',
  'liberty gym', 'moving express', 'energie forme', 'wellness sport club',
  'interval', 'dynamo cycling', 'episod',
  // Yoga / pilates
  'tigre yoga', 'yuj yoga', 'qee', 'yoga village', 'club pilates',
  // Coiffure et barbiers
  'franck provost', 'jean louis david', 'jean-louis david', 'camille albane',
  'dessange', 'saint algue', "saint-algue", 'tchip', 'coiff&co', 'coiff and co',
  'fabio salsa', 'vog coiffure', 'barbershop company', 'the barber company',
  'hair coiffeur',
  // Beauté / esthétique
  'yves rocher', 'body minute', 'bodyminute', 'nocibe', 'marionnaud',
  'sephora', 'guinot', 'carlance', 'depil tech', 'depiltech', 'epil center',
  "l'onglerie", 'beauty success', 'esthetic center', 'point soleil',
  'bodysecret', 'body secret',
  // Caves — « Nicolas » n'est pas listé par le nom : trop de commerces
  // s'appellent « Chez Nicolas ». Le domaine et le partage de domaine suffisent.
  'le repaire de bacchus', 'v and b', 'cavavin', 'inter caves', 'intercaves',
  'la cave des sommeliers',
  // Épicerie fine et réseaux bio
  'comptoir de mathilde', 'biocoop', 'naturalia', 'la vie claire',
  'day by day', 'so bio', 'satoriz',
  // Restauration en réseau
  'del arte', 'hippopotamus', 'buffalo grill', 'courtepaille', 'la boucherie',
  'big fernand', 'burger king', 'mcdonald', 'subway', 'o tacos', 'tacos avenue',
  'chamas tacos', 'g la dalle', 'sushi shop', 'planet sushi', 'eat sushi',
  'cote sushi', 'pitaya', 'pokawa', 'columbus cafe', 'starbucks',
  'brioche doree', 'class croute', 'exki', 'la mie caline', 'factory & co',
  'les burgers de papa', 'kfc', 'domino', 'pizza hut', 'basilic & co',
  'la pataterie', 'au bureau', 'les 3 brasseurs', '3 brasseurs',
  'leon de bruxelles', 'flunch', 'vapiano', 'amorino', 'bistro regent',
  'la pizza de nico', 'pizza cosy', 'nachos', 'memphis coffee',
]

/** Domaines de tête de réseau : plusieurs établissements, un seul site. */
const FRANCHISE_DOMAINS = [
  'socooc.fr', 'cuisines-schmidt.com', 'aviva-cuisines.com', 'cuisinella.com',
  'ixina.fr', 'mobalpa.fr', 'lapeyre.fr', 'dentego.fr', 'demeco.fr',
  'engie-homeservices.fr', 'proxiserve.fr', 'danielmoquet.com',
  'illico-travaux.com', 'lamaisondestravaux.com',
  // Série « commerces »
  'nicolas.tm.fr', 'basic-fit.com', 'fitnesspark.fr', 'lorangebleue.fr',
  'keepcool.fr', 'neoness.fr', 'wojo.com', 'regus.com', 'spacesworks.com',
  'wework.com', 'lacordee.net', 'franck-provost.com', 'jeanlouisdavid.com',
  'dessange.com', 'yves-rocher.fr', 'body-minute.com', 'nocibe.fr',
  'marionnaud.fr', 'cavavin.fr', 'v-and-b.fr', 'repairedebacchus.com',
  'biocoop.fr', 'naturalia.fr', 'lavieclaire.com', 'delarte.fr',
  'hippopotamus.fr', 'buffalo-grill.fr', 'bigfernand.com', 'sushishop.fr',
  'pitaya.fr', 'pokawa.com', 'aubureau.fr', 'les3brasseurs.fr',
  // Relevés au dry-run du 23/09 : rien dans le nom ne les trahissait.
  'now-coworking.com', 'club-pilates.fr', 'rituel-sportclub.fr',
  // Sous-domaine d'enseigne : `institut-presquile-lyon.guinot.com`.
  'guinot.com', 'yvesrocher.fr', 'thenewmeparis.com',
  'blackboxparis.com', 'desire-barbershop.com',
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
  // Sélecteur d'établissement des CMS de franchise : `/location/lyon-foch`.
  /\/location\//i,
  // Chaînes de coiffure et de barbershops : `/salons/lyon-6-foch`.
  /\/salons?\//i,
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
