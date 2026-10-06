import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHANTIER_BUCKET } from '@/lib/chantiers/files'

/**
 * Seul module de l'espace client de chantier à utiliser la clé service_role
 * (tests/unit/chantiers/service-role-boundary.test.ts y veille). Le bucket est
 * privé et sans policy : tout accès passe par ici, sous forme d'adresses
 * signées de courte durée.
 *
 * Aucune fonction ne vérifie elle-même le droit d'accès : l'appelant doit avoir
 * validé le lien du chantier (ou la session admin) ET l'appartenance du chemin
 * à ce chantier avant de l'appeler (règle CLAUDE.md n°11).
 */

/** Durée de validité d'une adresse de téléchargement : elle sert aussitôt */
const DOWNLOAD_URL_TTL_SECONDS = 60
/** Lot maximal accepté par storage.remove */
const REMOVE_BATCH = 100

function bucket() {
  return createAdminClient().storage.from(CHANTIER_BUCKET)
}

/** Adresse d'envoi signée (valable 2 h côté Supabase), pour un chemin précis. */
export async function createSignedUpload(path: string): Promise<{ signedUrl: string }> {
  const { data, error } = await bucket().createSignedUploadUrl(path)
  if (error || !data) throw new Error(`createSignedUploadUrl a échoué : ${error?.message ?? 'aucune donnée'}`)
  return { signedUrl: data.signedUrl }
}

/**
 * Premiers octets et taille réelle d'un objet stocké, par une requête Range
 * sur une adresse signée. Renvoie null si l'objet n'existe pas. Si le serveur
 * ignore le Range, la lecture s'arrête quand même aux `bytes` premiers octets.
 */
export async function readObjectHead(
  path: string,
  bytes: number
): Promise<{ head: Uint8Array; totalSize: number } | null> {
  const { data, error } = await bucket().createSignedUrl(path, 60)
  if (error || !data) return null

  const res = await fetch(data.signedUrl, { headers: { Range: `bytes=0-${bytes - 1}` } })
  if (res.status === 404 || res.status === 400) return null
  if (!res.ok || !res.body) throw new Error(`Lecture de l'objet impossible (HTTP ${res.status})`)

  const total = /\/(\d+)$/.exec(res.headers.get('content-range') ?? '')?.[1]
  const totalSize = Number(total ?? res.headers.get('content-length') ?? NaN)

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  while (received < bytes) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
  }
  await reader.cancel()

  const head = new Uint8Array(Math.min(received, bytes))
  let offset = 0
  for (const chunk of chunks) {
    const part = chunk.subarray(0, head.length - offset)
    head.set(part, offset)
    offset += part.length
    if (offset >= head.length) break
  }

  if (!Number.isFinite(totalSize)) throw new Error('Taille de l’objet inconnue')
  return { head, totalSize }
}

/**
 * Adresse de téléchargement signée, en pièce jointe sous son nom d'origine
 * (Content-Disposition: attachment) : le fichier n'est jamais affiché par le
 * navigateur, seulement enregistré.
 */
export async function createDownloadUrl(path: string, downloadName: string): Promise<string> {
  const { data, error } = await bucket().createSignedUrl(path, DOWNLOAD_URL_TTL_SECONDS, {
    download: downloadName,
  })
  if (error || !data) throw new Error(`createSignedUrl a échoué : ${error?.message ?? 'aucune donnée'}`)
  return data.signedUrl
}

export async function removeObjects(paths: readonly string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const { error } = await bucket().remove(paths.slice(i, i + REMOVE_BATCH))
    if (error) throw new Error(`Suppression Storage impossible : ${error.message}`)
  }
}
