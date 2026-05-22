'use client'

import { createContext, useContext } from 'react'

export type AnalysisLockState = {
  locked: boolean
  analysisId: string | null
  siteId: string | null
  siteName: string | null
  lockAnalysis: (analysisId: string, siteId: string, siteName: string) => void
  unlockAnalysis: () => void
}

export const AnalysisLockContext = createContext<AnalysisLockState>({
  locked: false,
  analysisId: null,
  siteId: null,
  siteName: null,
  lockAnalysis: () => {},
  unlockAnalysis: () => {},
})

export function useAnalysisLock() {
  return useContext(AnalysisLockContext)
}
