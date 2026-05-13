'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type AnalysisStatus = 'pending' | 'running' | 'success' | 'error'

interface OverviewPollingProps {
  status: AnalysisStatus
}

export function OverviewPolling({ status }: OverviewPollingProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status !== 'pending' && status !== 'running') {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => router.refresh(), 5000)
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [status, router])

  return null
}
