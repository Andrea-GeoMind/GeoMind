'use client'

import { useState, useCallback } from 'react'
import { AnalysisLockContext } from './analysis-lock-context'
import { AnalysisLoadingOverlay } from './analysis-loading-overlay'

export function AnalysisLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [siteName, setSiteName] = useState<string | null>(null)

  const lockAnalysis = useCallback((id: string, sid: string, name: string) => {
    setAnalysisId(id)
    setSiteId(sid)
    setSiteName(name)
    setLocked(true)
  }, [])

  const unlockAnalysis = useCallback(() => {
    setLocked(false)
    setAnalysisId(null)
    setSiteId(null)
    setSiteName(null)
  }, [])

  return (
    <AnalysisLockContext.Provider
      value={{ locked, analysisId, siteId, siteName, lockAnalysis, unlockAnalysis }}
    >
      {locked && <AnalysisLoadingOverlay siteName={siteName} />}
      {children}
    </AnalysisLockContext.Provider>
  )
}
