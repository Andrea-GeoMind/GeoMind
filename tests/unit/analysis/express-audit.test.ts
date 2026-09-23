import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  normalizePublicUrl,
  runExpressAudit,
  effectivelyBlockedAiBots,
  computeExpressScore,
  EXPRESS_UNKNOWNS,
  EXPRESS_PILLARS_COVERED,
  EXPRESS_CHECK_COUNT,
  DEFAULT_CHECK_WEIGHT,
  AI_BOTS_BLOCK_WEIGHT,
  PILLAR_COUNT,
  type ExpressCheck,
} from '@/lib/analysis/express-audit'
import { AI_BOTS } from '@/lib/analysis/robots-parser'

describe('normalizePublicUrl (anti-SSRF)', () => {
  it('normalise un domaine nu en https racine', () => {
    expect(normalizePublicUrl('exemple.fr')?.href).toBe('https://exemple.fr/')
    expect(normalizePublicUrl('https://www.exemple.fr/page?x=1')?.href).toBe(
      'https://www.exemple.fr/'
    )
  })

  it('rejette localhost et les hôtes sans TLD', () => {
    expect(normalizePublicUrl('localhost')).toBeNull()
    expect(normalizePublicUrl('http://localhost:3000')).toBeNull()
    expect(normalizePublicUrl('intranet')).toBeNull()
  })

  it('rejette les IP littérales et plages privées', () => {
    expect(normalizePublicUrl('127.0.0.1')).toBeNull()
    expect(normalizePublicUrl('http://10.0.0.5')).toBeNull()
    expect(normalizePublicUrl('http://192.168.1.1')).toBeNull()
    expect(normalizePublicUrl('http://172.20.3.4')).toBeNull()
    expect(normalizePublicUrl('http://169.254.169.254')).toBeNull() // metadata cloud
    expect(normalizePublicUrl('http://8.8.8.8')).toBeNull() // IP publique aussi : domaine requis
  })

  it('rejette les schémas et ports exotiques', () => {
    expect(normalizePublicUrl('ftp://exemple.fr')).toBeNull()
    expect(normalizePublicUrl('https://exemple.fr:8080')).toBeNull()
    expect(normalizePublicUrl('https://user:pass@exemple.fr')).toBeNull()
  })

  it('rejette les entrées vides ou démesurées', () => {
    expect(normalizePublicUrl('')).toBeNull()
    expect(normalizePublicUrl('a'.repeat(3000))).toBeNull()
  })
})

describe('effectivelyBlockedAiBots', () => {
  it('détecte un blocage explicite et nommé de GPTBot', () => {
    expect(effectivelyBlockedAiBots('User-agent: GPTBot\nDisallow: /')).toEqual(['GPTBot'])
  })

  it('renvoie les 5 bots IA quand le groupe générique bloque tout', () => {
    const blocked = effectivelyBlockedAiBots('User-agent: *\nDisallow: /')
    expect(blocked).toHaveLength(AI_BOTS.length)
    expect(blocked).toEqual(expect.arrayContaining(AI_BOTS))
  })

  it('ne signale rien pour un robots.txt ouvert', () => {
    expect(effectivelyBlockedAiBots('User-agent: *\nDisallow:')).toEqual([])
    expect(effectivelyBlockedAiBots('User-agent: *\nDisallow: /admin/')).toEqual([])
  })

  it('ne signale pas le blocage d’un bot non-IA', () => {
    expect(effectivelyBlockedAiBots('User-agent: BadBot\nDisallow: /')).toEqual([])
  })

  it('gère plusieurs groupes et cumule les bots nommés bloqués', () => {
    const txt = 'User-agent: *\nDisallow: /admin/\n\nUser-agent: ClaudeBot\nDisallow: /'
    expect(effectivelyBlockedAiBots(txt)).toEqual(['ClaudeBot'])
  })
})

describe('computeExpressScore', () => {
  const check = (ok: boolean, weight?: number): ExpressCheck => ({
    key: 'x',
    label: '',
    ok,
    hint: '',
    ...(weight !== undefined ? { weight } : {}),
  })

  it('note à 100 quand tout passe, quels que soient les poids', () => {
    expect(computeExpressScore([check(true), check(true, AI_BOTS_BLOCK_WEIGHT)])).toBe(100)
  })

  it('note à 0 quand tout échoue', () => {
    expect(computeExpressScore([check(false), check(false, AI_BOTS_BLOCK_WEIGHT)])).toBe(0)
  })

  it('un échec ordinaire ne coûte que le poids par défaut', () => {
    const checks = [check(false), check(true), check(true)]
    expect(computeExpressScore(checks)).toBe(Math.round((2 / 3) * 100))
  })

  it('un robots.txt qui bloque les IA plafonne le score même si tout le reste passe — rédhibitoire', () => {
    const ordinary = Array.from({ length: 11 }, () => check(true))
    const checks = [...ordinary, check(false, AI_BOTS_BLOCK_WEIGHT)]
    const ceiling = Math.round(
      ((11 * DEFAULT_CHECK_WEIGHT) / (11 * DEFAULT_CHECK_WEIGHT + AI_BOTS_BLOCK_WEIGHT)) * 100
    )
    expect(computeExpressScore(checks)).toBe(ceiling)
    // Le plafond doit rester net : la moitié du score ou moins, pas un
    // simple malus cosmétique comme avant ce correctif.
    expect(computeExpressScore(checks)).toBeLessThanOrEqual(60)
  })

  it('le même blocage ne coûte presque rien s’il était pondéré comme les autres — la régression qu’on corrige', () => {
    const ordinary = Array.from({ length: 11 }, () => check(true))
    const uniformlyWeighted = [...ordinary, check(false)] // sans poids fort
    const weighted = [...ordinary, check(false, AI_BOTS_BLOCK_WEIGHT)]
    expect(computeExpressScore(weighted)).toBeLessThan(computeExpressScore(uniformlyWeighted))
  })
})

describe('runExpressAudit — intégration avec un fetch simulé', () => {
  afterEach(() => vi.unstubAllGlobals())

  const GOOD_HTML = `<!doctype html><html lang="fr"><head>
    <title>Exemple — Plombier à Lyon</title>
    <meta name="description" content="Plombier certifié RGE à Lyon, dépannage 7j/7.">
    <meta property="og:title" content="Exemple">
    <script type="application/ld+json">{"@type":"LocalBusiness"}</script>
  </head><body><h1>Bienvenue</h1></body></html>`

  function mockFetchWithRobots(robotsTxt: string | null) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input)
        if (url.includes('/robots.txt')) {
          if (robotsTxt === null) return { status: 404, text: async () => '' }
          return { status: 200, text: async () => robotsTxt }
        }
        if (url.includes('/sitemap.xml')) return { status: 200, text: async () => '<urlset/>' }
        if (url.includes('/llms.txt')) return { status: 200, text: async () => '# Exemple' }
        return { status: 200, text: async () => GOOD_HTML }
      })
    )
  }

  it('construit exactement EXPRESS_CHECK_COUNT checks', async () => {
    mockFetchWithRobots('User-agent: *\nDisallow:')
    const result = await runExpressAudit(new URL('https://exemple.fr/'))
    expect(result?.checks).toHaveLength(EXPRESS_CHECK_COUNT)
  })

  it('note un site propre et ouvert près de 100', async () => {
    mockFetchWithRobots('User-agent: *\nDisallow:')
    const result = await runExpressAudit(new URL('https://exemple.fr/'))
    expect(result?.checks.find((c) => c.key === 'robots-ai-bots')?.ok).toBe(true)
    expect(result?.score).toBeGreaterThanOrEqual(90)
  })

  it('plafonne le score d’un site par ailleurs parfait mais qui bloque GPTBot', async () => {
    mockFetchWithRobots('User-agent: GPTBot\nDisallow: /')
    const result = await runExpressAudit(new URL('https://exemple.fr/'))
    const gate = result?.checks.find((c) => c.key === 'robots-ai-bots')
    expect(gate?.ok).toBe(false)
    expect(gate?.hint).toContain('GPTBot')
    expect(result?.score).toBeLessThanOrEqual(60)
  })

  it('ne pénalise pas l’absence de robots.txt sur le check des bots IA — rien ne bloque par défaut', async () => {
    mockFetchWithRobots(null)
    const result = await runExpressAudit(new URL('https://exemple.fr/'))
    expect(result?.checks.find((c) => c.key === 'robots-present')?.ok).toBe(false)
    expect(result?.checks.find((c) => c.key === 'robots-ai-bots')?.ok).toBe(true)
  })
})

describe('périmètre de l’audit express', () => {
  it('déclare les trois inconnues attendues, dans l’ordre du tunnel', () => {
    expect(EXPRESS_UNKNOWNS.map((u) => u.key)).toEqual(['citations', 'competitors', 'reputation'])
  })

  it('ne couvre qu’un pilier sur trois — c’est ce qui justifie le bloc « ce qu’on ne sait pas encore »', () => {
    expect(EXPRESS_PILLARS_COVERED).toBe(1)
    expect(PILLAR_COUNT).toBe(3)
    expect(PILLAR_COUNT - EXPRESS_PILLARS_COVERED).toBe(2)
  })

  it('dit « non mesuré » et jamais « 0 » — convention de scoring du produit', () => {
    for (const u of EXPRESS_UNKNOWNS) {
      expect(u.detail.toLowerCase()).toContain('non mesuré')
      expect(u.question.endsWith('?')).toBe(true)
    }
  })
})
