import type { Business, BusinessSource } from '../types'

/**
 * Source Google Places API (New) — Text Search.
 *
 * Seule source légitime donnant le nombre d'avis, dont dépend le filtre
 * 20–250. Scraper Google Maps est contraire à ses conditions d'utilisation, et
 * casserait au premier changement de balisage.
 *
 * Le masque de champs demande `websiteUri` et `nationalPhoneNumber`, qui
 * placent la requête dans le palier Enterprise (~35 $ / 1 000 requêtes, jusqu'à
 * 20 établissements chacune). Ne demander que ce qui sert : chaque champ
 * supplémentaire peut changer de palier tarifaire.
 */

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'nextPageToken',
].join(',')

/** Lyon centre ; 15 km couvrent Villeurbanne, Bron, Vénissieux, Caluire, Écully. */
export const LYON = { latitude: 45.764043, longitude: 4.835659 }
export const DEFAULT_RADIUS_M = 15_000

/** Maximum documenté par Google pour Text Search : 3 pages, 60 résultats. */
export const MAX_PAGES_PER_CATEGORY = 3

interface PlacesResponse {
  places?: {
    id?: string
    displayName?: { text?: string }
    formattedAddress?: string
    rating?: number
    userRatingCount?: number
    websiteUri?: string
    nationalPhoneNumber?: string
  }[]
  nextPageToken?: string
  error?: { message?: string; status?: string }
}

export class PlacesSource implements BusinessSource {
  readonly name = 'google-places'
  private readonly apiKey: string
  private readonly radiusM: number
  /** Compte les requêtes facturées, pour rendre la dépense visible. */
  public requestCount = 0

  constructor(apiKey: string, radiusM = DEFAULT_RADIUS_M) {
    this.apiKey = apiKey
    this.radiusM = radiusM
  }

  async search(category: string, area: string, limit: number): Promise<Business[]> {
    const out: Business[] = []
    const seenIds = new Set<string>()
    let pageToken: string | undefined
    let pages = 0

    // Plafond dur de pages. Sans lui, la boucle suit les `nextPageToken` tant
    // que Google en renvoie : lors du premier essai, 32 pages par catégorie au
    // lieu d'une, 294 requêtes facturées au lieu de 27. Google documente 3
    // pages maximum (60 résultats) pour Text Search ; au-delà les jetons ne
    // rapportent plus rien de neuf.
    while (out.length < limit && pages < MAX_PAGES_PER_CATEGORY) {
      const body: Record<string, unknown> = {
        textQuery: `${category} ${area}`,
        languageCode: 'fr',
        regionCode: 'FR',
        pageSize: Math.min(20, limit - out.length),
        locationBias: {
          circle: { center: LYON, radius: this.radiusM },
        },
      }
      if (pageToken) body.pageToken = pageToken

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      })
      this.requestCount++
      pages++

      const json = (await res.json()) as PlacesResponse
      if (!res.ok || json.error) {
        throw new Error(
          `Places API ${res.status} : ${json.error?.message ?? 'erreur inconnue'}`
        )
      }

      let added = 0
      for (const p of json.places ?? []) {
        const id = p.id ?? `${category}:${p.displayName?.text ?? ''}`
        if (seenIds.has(id)) continue
        seenIds.add(id)
        added++
        out.push({
          name: p.displayName?.text ?? '(sans nom)',
          category,
          phone: p.nationalPhoneNumber ?? null,
          address: p.formattedAddress ?? null,
          website: p.websiteUri ?? null,
          reviewCount: p.userRatingCount ?? null,
          rating: p.rating ?? null,
          sourceId: id,
        })
      }

      // Une page qui n'apporte rien de neuf signale que le filon est épuisé :
      // continuer ne ferait que facturer des requêtes.
      if (added === 0) break

      pageToken = json.nextPageToken
      if (!pageToken) break
      // Google exige un court délai avant d'accepter un pageToken.
      await new Promise((r) => setTimeout(r, 2_000))
    }

    return out.slice(0, limit)
  }
}
