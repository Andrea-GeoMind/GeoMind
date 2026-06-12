'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { captureCoachEvent } from '@/components/features/coach/coach-analytics'

/**
 * Contexte global de GEO (§16.5) — état ouvert/fermé du panel flottant,
 * issue pré-injectée (« Demander à GEO ») et site courant.
 *
 * Le layout app ne connaît pas le siteId (route param plus bas) : c'est
 * `CoachSiteBinding`, rendu par le layout du site, qui enregistre le site
 * courant (+ son état d'analyse pour les chips contextuelles §16.6).
 */

export type CoachOpenSource = 'floating' | 'tab' | 'issue' | 'auto'

export interface CoachFocusedIssue {
  title: string
  description: string
}

export interface CoachBoundSite {
  siteId: string
  hasAnalysis: boolean
  globalScore: number | null
  technicalScore: number | null
  contentScore: number | null
}

interface CoachContextValue {
  isOpen: boolean
  openPanel: (source: CoachOpenSource) => void
  closePanel: () => void
  openWithIssue: (issue: CoachFocusedIssue) => void
  focusedIssue: CoachFocusedIssue | null
  clearFocusedIssue: () => void
  site: CoachBoundSite | null
  bindSite: (site: CoachBoundSite) => void
  unbindSite: (siteId: string) => void
}

const CoachContext = createContext<CoachContextValue>({
  isOpen: false,
  openPanel: () => {},
  closePanel: () => {},
  openWithIssue: () => {},
  focusedIssue: null,
  clearFocusedIssue: () => {},
  site: null,
  bindSite: () => {},
  unbindSite: () => {},
})

export function useCoach(): CoachContextValue {
  return useContext(CoachContext)
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIssue, setFocusedIssue] = useState<CoachFocusedIssue | null>(null)
  const [site, setSite] = useState<CoachBoundSite | null>(null)

  const openPanel = useCallback((source: CoachOpenSource) => {
    setIsOpen(true)
    captureCoachEvent('coach_opened', { source })
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openWithIssue = useCallback((issue: CoachFocusedIssue) => {
    setFocusedIssue(issue)
    setIsOpen(true)
    captureCoachEvent('coach_opened', { source: 'issue' })
  }, [])

  const clearFocusedIssue = useCallback(() => {
    setFocusedIssue(null)
  }, [])

  const bindSite = useCallback((next: CoachBoundSite) => {
    setSite(next)
  }, [])

  const unbindSite = useCallback((siteId: string) => {
    setSite((current) => (current?.siteId === siteId ? null : current))
  }, [])

  const value = useMemo<CoachContextValue>(
    () => ({
      isOpen,
      openPanel,
      closePanel,
      openWithIssue,
      focusedIssue,
      clearFocusedIssue,
      site,
      bindSite,
      unbindSite,
    }),
    [
      isOpen,
      openPanel,
      closePanel,
      openWithIssue,
      focusedIssue,
      clearFocusedIssue,
      site,
      bindSite,
      unbindSite,
    ]
  )

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>
}
