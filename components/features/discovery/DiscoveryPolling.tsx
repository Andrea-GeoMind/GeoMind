'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function DiscoveryPolling() {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5_000)
    return () => clearInterval(id)
  }, [router])
  return null
}
