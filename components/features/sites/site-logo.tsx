'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** URL du site client (ex: https://www.dopamine-tech.com/) */
  url: string
  /** Nom du site (utilisé pour l'alt de l'image) */
  name: string
  /** Classes du conteneur carré arrondi */
  className?: string
  /** Classes de l'icône Globe affichée en fallback */
  iconClassName?: string
}

/**
 * Affiche le logo/favicon du site client à la place de l'icône Globe générique.
 * Source : service favicon Google (sz=128), sans clé API ni stockage.
 * Fallback automatique sur l'icône Globe si le domaine n'expose pas de favicon
 * ou si le chargement échoue.
 */
export function SiteLogo({ url, name, className, iconClassName }: Props) {
  const [failed, setFailed] = useState(false)

  const domain = extractDomain(url)
  const showImage = domain !== null && !failed

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/15',
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- favicon externe, pas d'optimisation Next utile
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt={`Logo ${name}`}
          width={128}
          height={128}
          className="h-full w-full rounded-xl object-contain p-1.5"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Globe className={cn('h-4 w-4 text-primary', iconClassName)} />
      )}
    </div>
  )
}

function extractDomain(url: string): string | null {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    return new URL(normalized).hostname
  } catch {
    return null
  }
}
