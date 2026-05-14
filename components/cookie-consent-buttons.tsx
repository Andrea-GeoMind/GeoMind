'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Consent = 'all' | 'essential'

function dispatch(value: Consent) {
  localStorage.setItem('cookie-consent', value)
  window.dispatchEvent(new CustomEvent<Consent>('cookie-consent', { detail: value }))
}

export function CookieConsentButtons() {
  const [current, setCurrent] = useState<Consent | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent') as Consent | null
    setCurrent(stored)
  }, [])

  const set = (value: Consent) => {
    dispatch(value)
    setCurrent(value)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        variant={current === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => set('all')}
      >
        {current === 'all' ? 'Analytiques activés' : 'Activer les analytiques'}
      </Button>
      <Button
        variant={current === 'essential' ? 'default' : 'outline'}
        size="sm"
        onClick={() => set('essential')}
      >
        {current === 'essential' ? 'Essentiels uniquement (actuel)' : 'Essentiels uniquement'}
      </Button>
    </div>
  )
}
