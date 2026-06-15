import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Avatar de GEO (§16.10) — orbe/boussole SVG sobre aux couleurs du brand
 * (dégradé indigo → violet). 3 tailles : sm (messages), md (header),
 * lg (bouton flottant). `pulse` : halo animé doux (« du nouveau » / streaming).
 */

export type GeoAvatarSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<GeoAvatarSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

interface GeoAvatarProps {
  size?: GeoAvatarSize
  pulse?: boolean
  className?: string
}

export function GeoAvatar({ size = 'md', pulse = false, className }: GeoAvatarProps) {
  const id = useId()
  const orbId = `geo-orb-${id}`
  const needleId = `geo-needle-${id}`

  return (
    <span className={cn('relative inline-flex shrink-0', SIZE_CLASSES[size], className)}>
      {pulse && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-indigo-500/40 [animation-duration:2s]"
        />
      )}
      <svg
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="GEO, l'assistant IA de GeoMind"
        className="relative h-full w-full"
      >
        <defs>
          <linearGradient id={orbId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#31649B" />
            <stop offset="100%" stopColor="#16304B" />
          </linearGradient>
          <linearGradient id={needleId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>
        </defs>

        {/* Orbe */}
        <circle cx="24" cy="24" r="22" fill={`url(#${orbId})`} />
        {/* Reflet haut-gauche */}
        <circle cx="17" cy="15" r="9" fill="#FFFFFF" opacity="0.12" />

        {/* Anneau orbital incliné */}
        <ellipse
          cx="24"
          cy="24"
          rx="18.5"
          ry="7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          opacity="0.45"
          transform="rotate(-24 24 24)"
        />
        {/* Satellite sur l'orbite */}
        <circle cx="38.5" cy="16.5" r="2" fill="#FFFFFF" opacity="0.9" />

        {/* Aiguille de boussole — étoile 4 pointes */}
        <path
          d="M24 10.5 L27 21 L37.5 24 L27 27 L24 37.5 L21 27 L10.5 24 L21 21 Z"
          fill={`url(#${needleId})`}
        />
        {/* Pivot central */}
        <circle cx="24" cy="24" r="2.4" fill="#31649B" />
        <circle cx="24" cy="24" r="1" fill="#FFFFFF" />
      </svg>
    </span>
  )
}
