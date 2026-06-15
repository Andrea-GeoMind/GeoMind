import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Avatar de GEO (§16.10) — le robot officiel du logo (public/logo-mark.png),
 * marque autoportante (fond transparent). 3 tailles : sm (messages),
 * md (header), lg (bouton flottant). `pulse` : halo animé doux
 * (« du nouveau » / streaming).
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
  return (
    <span className={cn('relative inline-flex shrink-0', SIZE_CLASSES[size], className)}>
      {pulse && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2s]"
        />
      )}
      <Image
        src="/logo-mark.png"
        alt="GEO, l'assistant IA de GeoMind"
        width={88}
        height={84}
        className="relative h-full w-full select-none object-contain"
        priority
      />
    </span>
  )
}
