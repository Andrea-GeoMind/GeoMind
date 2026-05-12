import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tableau de bord — GEOMIND',
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      <p className="mt-2 text-muted-foreground">Vos analyses apparaîtront ici.</p>
    </div>
  )
}
