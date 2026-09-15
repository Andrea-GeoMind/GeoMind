'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Consent = 'all' | 'essential'

/**
 * Hauteur réelle du bandeau, publiée en variable CSS sur <html>.
 *
 * Le bandeau est en `position: fixed` : sans cette réservation d'espace, il
 * recouvre le bas de l'écran et rend incliquables les éléments qui s'y
 * trouvent — le bouton « Déconnexion » en pied de barre latérale et la zone
 * de saisie du coach (constaté en QA : Playwright refusait le clic,
 * « cookie dialog intercepts pointer events »).
 */
const HEIGHT_VAR = '--cookie-banner-h'

function dispatch(value: Consent) {
  window.dispatchEvent(new CustomEvent<Consent>('cookie-consent', { detail: value }))
  localStorage.setItem('cookie-consent', value)
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setVisible(true)
  }, [])

  // Publie la hauteur du bandeau tant qu'il est affiché, et la remet à zéro
  // dès qu'il disparaît. ResizeObserver couvre le passage en deux lignes sur
  // petit écran.
  useEffect(() => {
    const root = document.documentElement
    if (!visible || !bannerRef.current) {
      root.style.setProperty(HEIGHT_VAR, '0px')
      return
    }
    const el = bannerRef.current
    const sync = () => root.style.setProperty(HEIGHT_VAR, `${el.offsetHeight}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.setProperty(HEIGHT_VAR, '0px')
    }
  }, [visible])

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
      ref={bannerRef}
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
