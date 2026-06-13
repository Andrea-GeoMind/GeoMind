'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { ensurePixelKey } from '@/lib/db/queries/pixel'

/** Active le Pixel pour un site (génère sa clé). Ownership vérifié (règle n°11). */
export async function activatePixelAction(
  siteId: string
): Promise<{ error: string } | { pixelKey: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  try {
    const pixelKey = await ensurePixelKey(siteId)
    revalidatePath(`/sites/${siteId}/pixel`)
    return { pixelKey }
  } catch {
    return { error: 'Impossible d’activer le pixel. Réessayez.' }
  }
}
