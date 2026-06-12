'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSuggestions, type CoachPage, type CoachSiteState } from '@/lib/ai/coach-suggestions'
import { useCoach, type CoachBoundSite } from '@/components/features/coach/coach-provider'
import { GeoAvatar } from '@/components/features/coach/geo-avatar'
import { CoachPanel } from '@/components/features/coach/coach-panel'

const WELCOME_FLOATING =
  "Salut, moi c'est GEO 👋 Je connais ton site et ses analyses par cœur. Dis-moi ce qui t'amène !"

const SITE_PAGES: readonly CoachPage[] = [
  'overview',
  'authority',
  'technical',
  'content',
  'publishers',
  'coach',
]

/** Déduit la page courante depuis le pathname pour les chips contextuelles (§16.6). */
function derivePage(pathname: string): CoachPage {
  const segment = pathname.split('/')[3] ?? ''
  return (SITE_PAGES as readonly string[]).includes(segment) ? (segment as CoachPage) : 'floating'
}

function deriveSiteState(site: CoachBoundSite, page: CoachPage): CoachSiteState {
  // Approximation côté client : un score de pilier < 100 implique au moins
  // une issue détectée (le détail exact vit côté serveur).
  const issueCount =
    page === 'technical'
      ? site.technicalScore !== null && site.technicalScore < 100
        ? 1
        : 0
      : page === 'content'
        ? site.contentScore !== null && site.contentScore < 100
          ? 1
          : 0
        : 0

  return {
    hasAnalysis: site.hasAnalysis,
    globalScore: site.globalScore,
    issueCount,
    cited: null,
  }
}

/**
 * Drawer flottant de GEO (§16.5.A, §16.10) — 400 px à droite sur desktop,
 * plein écran < 640 px. Reste monté tant qu'un site est lié : l'état de la
 * conversation persiste pendant la navigation.
 */
export function CoachFloatingPanel() {
  const { isOpen, closePanel, site, focusedIssue, clearFocusedIssue } = useCoach()
  const pathname = usePathname()

  // Échap ferme le panel
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closePanel])

  if (!site) return null

  const page = derivePage(pathname)
  const suggestions = getSuggestions(
    page === 'coach' ? 'floating' : page,
    deriveSiteState(site, page)
  )

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="GEO — assistant IA"
      aria-hidden={!isOpen}
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-[400px]',
        isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <GeoAvatar size="md" />
          <div>
            <p className="text-sm font-bold leading-tight">GEO</p>
            <p className="text-xs text-muted-foreground">Ton assistant visibilité IA</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Fermer GEO"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={16} />
        </button>
      </div>

      {/* Conversation — remontée à neuf quand on change de site */}
      <CoachPanel
        key={site.siteId}
        siteId={site.siteId}
        analysisId={null}
        initialMessages={[]}
        remainingMessages={null}
        suggestions={suggestions}
        welcomeMessage={WELCOME_FLOATING}
        focusedIssue={focusedIssue}
        onFocusedIssueConsumed={clearFocusedIssue}
      />
    </div>
  )
}
