'use client'

import { useEffect } from 'react'
import { useAnalysisLock } from './analysis-lock-context'

type Props = {
  analysisId: string
  siteId: string
  siteName: string
}

export function AnalysisLockInit({ analysisId, siteId, siteName }: Props) {
  const { lockAnalysis } = useAnalysisLock()

  useEffect(() => {
    lockAnalysis(analysisId, siteId, siteName)
  }, [analysisId, siteId, siteName, lockAnalysis])

  return null
}
