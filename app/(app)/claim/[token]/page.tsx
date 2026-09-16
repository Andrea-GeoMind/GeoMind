import { redirect } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { publicAudits } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createSite, getSitesByUserId } from '@/lib/db/queries/sites'
import { canAddSite } from '@/lib/quotas'

/**
 * /claim/<token> — atterrissage du lien magique envoyé en fin d'audit express.
 *
 * Le compte vient d'être créé par Supabase (signInWithOtp), la session est
 * ouverte : il reste à rattacher l'audit et à créer le site pour que l'utilisateur
 * arrive directement dessus, sans repasser par l'onboarding.
 *
 * Sécurité : le jeton seul ne suffit pas. On exige que l'email enregistré sur
 * l'audit corresponde à celui du compte connecté — sinon un jeton récupéré
 * ailleurs permettrait de s'approprier l'audit de quelqu'un d'autre.
 */
export const dynamic = 'force-dynamic'

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [audit] = await db
    .select()
    .from(publicAudits)
    .where(eq(publicAudits.claimToken, token))
    .limit(1)

  // Jeton inconnu, ou audit déjà rattaché à quelqu'un d'autre : on ne dit rien
  // de plus que « rien à voir ici », et on renvoie sur le parcours normal.
  if (!audit) redirect('/onboarding')
  if (audit.claimedByUserId && audit.claimedByUserId !== user.id) redirect('/dashboard')

  // L'email de l'audit doit être celui du compte connecté.
  if (audit.email && user.email && audit.email.toLowerCase() !== user.email.toLowerCase()) {
    redirect('/dashboard')
  }

  // Déjà rattaché par cet utilisateur : on le renvoie sur son site.
  const existing = await getSitesByUserId(user.id)
  const match = existing.find((s) => normalizeDomain(s.url) === audit.domain)
  if (match) {
    if (!audit.claimedByUserId) await markClaimed(audit.id, user.id)
    redirect(`/sites/${match.id}/overview`)
  }

  // Quota serveur (règle métier 2) — un compte déjà au plafond de sites
  // récupère l'audit mais gère l'ajout depuis l'onboarding.
  if (!(await canAddSite(user.id))) {
    await markClaimed(audit.id, user.id)
    redirect('/onboarding')
  }

  const site = await createSite({
    userId: user.id,
    name: audit.domain,
    url: `https://${audit.domain}`,
  })
  await markClaimed(audit.id, user.id)

  redirect(`/sites/${site.id}/overview`)
}

function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

async function markClaimed(auditId: string, userId: string) {
  await db
    .update(publicAudits)
    .set({ claimedByUserId: userId, claimedAt: new Date() })
    .where(and(eq(publicAudits.id, auditId), isNull(publicAudits.claimedByUserId)))
}
