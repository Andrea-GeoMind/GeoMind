'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { env } from '@/lib/env'
import { createChantier, issueChantierLink } from '@/lib/db/queries/chantiers'
import { chantierInputSchema } from '@/lib/chantiers/validation'
import { clientIpFromHeaders, truncateIp } from '@/lib/chantiers/ip'
import { captureChantierFailure } from '@/lib/monitoring'
import { fileDownloadUrlForOwner, purgeChantierFiles } from '@/lib/chantiers/file-service'

export async function createChantierAction(
  input: unknown
): Promise<{ id: string } | { error: string }> {
  const admin = await requireAdmin()

  const parsed = chantierInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }
  }

  try {
    const id = await createChantier(admin.id, parsed.data)
    revalidatePath('/dashboard/chantiers')
    return { id }
  } catch (err) {
    captureChantierFailure('create', err)
    return { error: 'Création impossible. Réessayez.' }
  }
}

/**
 * Émet le lien du chantier (premier lien ou régénération). Le lien en clair
 * n'est renvoyé qu'ici : la base n'en garde que l'empreinte.
 */
export async function issueChantierLinkAction(
  chantierId: string
): Promise<{ url: string } | { error: string }> {
  const admin = await requireAdmin()
  const id = z.uuid().safeParse(chantierId)
  if (!id.success) return { error: 'Chantier introuvable.' }

  try {
    const ip = truncateIp(clientIpFromHeaders(await headers()))
    const token = await issueChantierLink(admin.id, id.data, ip)
    if (!token) return { error: 'Chantier introuvable ou clos.' }
    revalidatePath('/dashboard/chantiers')
    return { url: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/chantier/${token}` }
  } catch (err) {
    captureChantierFailure('issue_link', err, { chantierId: id.data })
    return { error: 'Émission du lien impossible. Réessayez.' }
  }
}

/**
 * Téléchargement d'un fichier déposé : adresse signée de 60 s, servie en
 * pièce jointe. Aucun fichier n'est jamais affiché dans une page.
 */
export async function getChantierFileDownloadAction(
  fileId: string
): Promise<{ url: string } | { error: string }> {
  const admin = await requireAdmin()
  const id = z.uuid().safeParse(fileId)
  if (!id.success) return { error: 'Fichier introuvable.' }

  try {
    const url = await fileDownloadUrlForOwner(admin.id, id.data)
    return url ? { url } : { error: 'Fichier introuvable ou supprimé.' }
  } catch (err) {
    captureChantierFailure('download', err, { fileId: id.data })
    return { error: 'Téléchargement impossible. Réessayez.' }
  }
}

/** « Purger les fichiers » : le stockage est vidé, les réponses saisies restent. */
export async function purgeChantierFilesAction(
  chantierId: string
): Promise<{ count: number; bytes: number } | { error: string }> {
  const admin = await requireAdmin()
  const id = z.uuid().safeParse(chantierId)
  if (!id.success) return { error: 'Chantier introuvable.' }

  try {
    const result = await purgeChantierFiles(admin.id, id.data)
    if (!result) return { error: 'Chantier introuvable.' }
    revalidatePath(`/dashboard/chantiers/${id.data}`)
    return result
  } catch (err) {
    captureChantierFailure('purge', err, { chantierId: id.data })
    return { error: 'Purge impossible. Réessayez.' }
  }
}
