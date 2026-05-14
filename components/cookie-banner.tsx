'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Consent = 'all' | 'essential'

function dispatch(value: Consent) {
  window.dispatchEvent(new CustomEvent<Consent>('cookie-consent', { detail: value }))
  localStorage.setItem('cookie-consent', value)
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setVisible(true)
  }, [])

  const accept = () => {
    dispatch('all')
    setVisible(false)
  }

  const decline = () => {
    dispatch('essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Nous utilisons des cookies analytiques (PostHog) pour améliorer le produit.{' '}
          <Link href="/legal/cookies" className="underline underline-offset-4 hover:text-foreground">
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            Essentiels uniquement
          </Button>
          <Button size="sm" onClick={accept}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  )
}
