/**
 * lib/crawl/json-ld.ts
 *
 * Extraction des blocs JSON-LD (`<script type="application/ld+json">`) du HTML
 * d'une page crawlée.
 *
 * Pourquoi ce fichier existe : les 7 règles `schema_org_*` du moteur d'analyse
 * lisent `page.metadata.schemaOrgs`, un champ que Firecrawl ne renvoie jamais et
 * que rien ne remplissait. Elles se déclenchaient donc systématiquement, sur
 * tous les sites, y compris ceux dont le balisage est parfait. Le crawl demande
 * désormais le format `html` à Firecrawl et alimente `schemaOrgs` via ce module.
 *
 * Le HTML brut n'est jamais persisté : seuls les objets Schema.org extraits le sont.
 */

/** Taille max de HTML analysée — borne de sécurité contre une page anormale. */
const MAX_HTML_LENGTH = 5_000_000

const SCRIPT_RE =
  /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Aplatit un bloc JSON-LD en la liste des entités qu'il contient.
 * Gère les trois formes rencontrées en production : objet unique, tableau
 * d'objets, et `@graph` (la forme que produit Next.js sur geomind.fr).
 */
function flattenNode(node: unknown, depth = 0): Array<Record<string, unknown>> {
  if (depth > 6) return []
  if (Array.isArray(node)) return node.flatMap((n) => flattenNode(n, depth + 1))
  if (!isPlainObject(node)) return []

  const out: Array<Record<string, unknown>> = []
  if (node['@type'] !== undefined) out.push(node)

  const graph = node['@graph']
  if (graph !== undefined) out.push(...flattenNode(graph, depth + 1))

  return out
}

/**
 * Nettoie le contenu d'un `<script>` avant `JSON.parse` : commentaires HTML
 * enveloppants et sections CDATA, tous deux courants sur les sites WordPress.
 */
function cleanScriptContent(raw: string): string {
  return raw
    .replace(/^\s*<!--/, '')
    .replace(/-->\s*$/, '')
    .replace(/^\s*\/\/\s*<!\[CDATA\[/, '')
    .replace(/\/\/\s*\]\]>\s*$/, '')
    .replace(/^\s*<!\[CDATA\[/, '')
    .replace(/\]\]>\s*$/, '')
    .trim()
}

/**
 * Extrait toutes les entités Schema.org déclarées en JSON-LD dans une page.
 * Ne lève jamais : un bloc illisible est ignoré, les autres sont conservés —
 * un site avec un JSON-LD cassé ne doit pas faire échouer son analyse.
 */
export function extractJsonLd(html: string | null | undefined): Array<Record<string, unknown>> {
  if (!html || html.length > MAX_HTML_LENGTH) return []

  const entities: Array<Record<string, unknown>> = []
  for (const match of html.matchAll(SCRIPT_RE)) {
    const content = cleanScriptContent(match[1] ?? '')
    if (content === '') continue
    try {
      entities.push(...flattenNode(JSON.parse(content) as unknown))
    } catch {
      // Bloc JSON-LD invalide sur le site audité — ignoré, les autres comptent.
    }
  }
  return entities
}
