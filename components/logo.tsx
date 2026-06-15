import Image from 'next/image'
import { cn } from '@/lib/utils'

/* Dimensions intrinsèques du PNG détouré (public/logo-mark.png) */
const MARK_W = 621
const MARK_H = 590

type LogoMarkProps = {
  /** Hauteur en pixels du logo (défaut 32) */
  size?: number
  className?: string
  title?: string
}

/**
 * Logo officiel GEOMIND — la marque robot seule (sans wordmark).
 * Utilise directement le fichier officiel détouré `public/logo-mark.png`
 * (fond transparent), aucune retouche.
 */
export function LogoMark({ size = 32, className, title = 'GEOMIND' }: LogoMarkProps) {
  const width = Math.round((size * MARK_W) / MARK_H)
  return (
    <Image
      src="/logo-mark.png"
      alt={title}
      width={width}
      height={size}
      className={cn('shrink-0 select-none', className)}
      priority
    />
  )
}

type LogoProps = {
  size?: number
  className?: string
  wordmarkClassName?: string
}

/**
 * Logo complet : marque robot officielle + wordmark « GEOMIND »
 * (typo du site, Plus Jakarta Sans extrabold).
 */
export function Logo({ size = 32, className, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span
        className={cn(
          'text-xl font-extrabold tracking-tight leading-none',
          wordmarkClassName
        )}
      >
        <span className="text-primary">GEO</span>
        <span className="text-foreground">MIND</span>
      </span>
    </span>
  )
}
