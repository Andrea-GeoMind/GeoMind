import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuditDocumentSchema, type AuditDocument } from '@/lib/prospect-audit/types'

/**
 * Stockage des audits prospects : un document JSON figé par audit, dans un
 * bucket privé, sans policy, nommé par l'empreinte du lien (jamais le lien).
 *
 * Un document plutôt qu'une table : l'audit est un instantané qu'on ne
 * modifie jamais, lu en entier par une seule page. Seul module de l'audit à
 * utiliser la clé service_role (tests/unit/chantiers/service-role-boundary.test.ts) ;
 * l'appelant a validé la forme du lien avant de l'appeler (règle CLAUDE.md §11).
 */

export const AUDIT_BUCKET = 'prospect-audits'
const HASH_PATTERN = /^[a-f0-9]{64}$/

function objectPath(hash: string): string {
  if (!HASH_PATTERN.test(hash)) throw new Error('Empreinte de lien invalide')
  return `${hash}.json`
}

function bucket() {
  return createAdminClient().storage.from(AUDIT_BUCKET)
}

/** Crée le bucket privé s'il n'existe pas (script admin, une fois). */
export async function ensureAuditBucket(): Promise<void> {
  const client = createAdminClient()
  const { data } = await client.storage.getBucket(AUDIT_BUCKET)
  if (data) {
    if (data.public) throw new Error(`Le bucket ${AUDIT_BUCKET} est public : à corriger avant tout envoi`)
    return
  }
  const { error } = await client.storage.createBucket(AUDIT_BUCKET, {
    public: false,
    fileSizeLimit: '1MB',
    allowedMimeTypes: ['application/json'],
  })
  if (error) throw new Error(`Création du bucket ${AUDIT_BUCKET} impossible : ${error.message}`)
}

export async function saveAuditDocument(hash: string, document: AuditDocument): Promise<void> {
  const body = JSON.stringify(AuditDocumentSchema.parse(document))
  const { error } = await bucket().upload(objectPath(hash), body, {
    contentType: 'application/json',
    upsert: false,
  })
  if (error) throw new Error(`Enregistrement de l'audit impossible : ${error.message}`)
}

/** Document de l'audit, ou null s'il n'existe pas ou n'est pas lisible. */
export async function loadAuditDocument(hash: string): Promise<AuditDocument | null> {
  const { data, error } = await bucket().download(objectPath(hash))
  if (error || !data) return null
  const parsed = AuditDocumentSchema.safeParse(JSON.parse(await data.text()))
  if (!parsed.success) throw new Error(`Audit ${hash.slice(0, 8)}… illisible : ${parsed.error.message}`)
  return parsed.data
}

export async function deleteAuditDocument(hash: string): Promise<void> {
  const { error } = await bucket().remove([objectPath(hash)])
  if (error) throw new Error(`Suppression de l'audit impossible : ${error.message}`)
}
