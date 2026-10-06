import type { Metadata } from 'next'
import { CHANTIER_COPY } from '@/lib/chantiers/copy'

export const metadata: Metadata = {
  title: { absolute: CHANTIER_COPY.pageTitle },
  robots: { index: false, follow: false, nocache: true },
  // Pas de lien canonique : ces pages ne doivent exister pour aucun moteur
  alternates: { canonical: null },
}

export default function ChantierLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>
}
