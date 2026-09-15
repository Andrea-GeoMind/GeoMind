/** Forme minimale commune aux pages des deux piliers. */
interface PageWithSchemas {
  metadata?: { schemaOrgs?: unknown } | null
}

/**
 * Helpers de lecture du JSON-LD extrait au crawl (`metadata.schemaOrgs`).
 *
 * Deux formes très répandues piégeaient les règles `schema_org_*` et les
 * faisaient conclure à une absence de balisage sur des sites correctement
 * balisés :
 *  - `"@type": ["WebPage", "FAQPage"]` — un type peut être un tableau ;
 *  - `"author": { "@id": "…#author" }` — une entité peut être référencée par
 *    `@id` plutôt qu'imbriquée (patron WordPress/Yoast, très courant).
 */

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** Types déclarés par une entité — `@type` accepte une chaîne ou un tableau. */
export function typesOf(entity: unknown): string[] {
  const record = asRecord(entity)
  if (!record) return []
  const type = record['@type']
  if (typeof type === 'string') return [type]
  if (Array.isArray(type)) return type.filter((t): t is string => typeof t === 'string')
  return []
}

/** Toutes les entités Schema.org déclarées sur la page. */
export function getSchemaEntities(page: PageWithSchemas): Array<Record<string, unknown>> {
  const schemas = page.metadata?.schemaOrgs
  if (!Array.isArray(schemas)) return []
  return schemas.flatMap((s) => {
    const record = asRecord(s)
    return record ? [record] : []
  })
}

/** Tous les types Schema.org déclarés sur la page, tableaux aplatis. */
export function getSchemaTypes(page: PageWithSchemas): string[] {
  return getSchemaEntities(page).flatMap(typesOf)
}

/**
 * Résout une valeur de propriété en entités concrètes : objet imbriqué, tableau,
 * ou référence `{ "@id": … }` à résoudre dans le graphe de la page.
 */
export function resolveEntities(
  value: unknown,
  page: PageWithSchemas
): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.flatMap((v) => resolveEntities(v, page))
  const record = asRecord(value)
  if (!record) return []

  // Référence pure (`{ "@id": … }`) ou partielle : on ajoute l'entité pointée.
  const id = record['@id']
  if (typeof id === 'string') {
    const referenced = getSchemaEntities(page).filter((e) => e['@id'] === id && e !== record)
    if (referenced.length > 0) return [record, ...referenced]
  }
  return [record]
}

/** La propriété `key` de `entity` désigne-t-elle une entité de type `type` ? */
export function propertyHasType(
  entity: Record<string, unknown>,
  key: string,
  type: string,
  page: PageWithSchemas
): boolean {
  return resolveEntities(entity[key], page).some((e) => typesOf(e).includes(type))
}
