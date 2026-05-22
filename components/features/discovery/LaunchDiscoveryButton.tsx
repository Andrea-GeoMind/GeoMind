'use client'

import { useState, useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { launchDiscoveryAction } from '@/app/(app)/sites/[siteId]/discovery/launch-action'

type Props = {
  siteId: string
}

export function LaunchDiscoveryButton({ siteId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await launchDiscoveryAction(siteId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleClick}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <RefreshCw size={14} />
        )}
        Relancer la découverte
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
