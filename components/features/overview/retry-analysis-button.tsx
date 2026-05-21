'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'

interface RetryAnalysisButtonProps {
  siteId: string
}

export function RetryAnalysisButton({ siteId }: RetryAnalysisButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRetry() {
    startTransition(async () => {
      await runAnalysisAction(siteId)
      router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRetry} disabled={isPending} className="shrink-0 gap-1.5">
      <RefreshCw size={13} className={isPending ? 'animate-spin' : ''} />
      Recommencer
    </Button>
  )
}
