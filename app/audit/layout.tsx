import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Votre audit de visibilité en ligne — GeoMind' },
  robots: { index: false, follow: false, nocache: true },
  // Pas de lien canonique : ces pages ne doivent exister pour aucun moteur
  alternates: { canonical: null },
}

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>
}
