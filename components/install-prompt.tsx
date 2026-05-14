'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after 30 seconds of usage
      setTimeout(() => setVisible(true), 30_000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setVisible(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
    setDismissed(true)
    setVisible(false)
  }

  if (!visible || dismissed || !deferredPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-border bg-background p-4 shadow-lg sm:left-auto sm:right-4 sm:w-80"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Download className="size-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Installer GEOMIND
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {"Accédez à vos audits directement depuis l'écran d'accueil."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleInstall}>
              Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Plus tard
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
