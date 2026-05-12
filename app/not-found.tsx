import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page introuvable — GEOMIND',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Page introuvable
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
