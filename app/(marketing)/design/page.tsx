import { ScoreGauge } from '@/components/charts/score-gauge'
import { ScoreCard } from '@/components/features/analysis/score-card'
import { NeutralPromptBadge } from '@/components/features/discovery/neutral-prompt-badge'
import { IssueSeverityBadge } from '@/components/features/technical/issue-severity-badge'

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background p-10 space-y-16">
      <header>
        <h1 className="text-3xl font-extrabold text-foreground">GEOMIND — Design System</h1>
        <p className="mt-1 text-muted-foreground">Page de démo des composants signatures (T8.5)</p>
      </header>

      {/* ScoreGauge */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">ScoreGauge</h2>
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Faible (sm)</span>
            <ScoreGauge score={18} size="sm" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Moyen (md)</span>
            <ScoreGauge score={45} size="md" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Bon (lg)</span>
            <ScoreGauge score={78} size="lg" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Max</span>
            <ScoreGauge score={100} size="md" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Zéro</span>
            <ScoreGauge score={0} size="md" />
          </div>
        </div>
      </section>

      {/* ScoreCard */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">ScoreCard</h2>
        <div className="flex flex-wrap gap-4">
          <ScoreCard pillar="global" score={62} delta={8} trend="up" />
          <ScoreCard pillar="authority" score={44} delta={-3} trend="down" />
          <ScoreCard pillar="technical" score={87} delta={0} trend="stable" />
          <ScoreCard pillar="content" score={21} />
        </div>
      </section>

      {/* NeutralPromptBadge */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">NeutralPromptBadge</h2>
        <div className="flex flex-wrap items-center gap-3">
          <NeutralPromptBadge isNeutral={true} />
          <NeutralPromptBadge isNeutral={false} />
          <NeutralPromptBadge isNeutral={true} iconOnly />
          <NeutralPromptBadge isNeutral={false} iconOnly />
        </div>
        <div className="space-y-2 max-w-xl">
          {[
            { text: 'Quels sont les meilleurs outils de référencement naturel ?', neutral: true },
            { text: "Pourquoi choisir geomind.fr pour auditer mon SEO ?", neutral: false },
            { text: 'Comment améliorer la visibilité d\'un site dans les IA génératives ?', neutral: true },
          ].map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <NeutralPromptBadge isNeutral={p.neutral} iconOnly className="mt-0.5 shrink-0" />
              <span className="text-foreground">{p.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* IssueSeverityBadge */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">IssueSeverityBadge</h2>
        <div className="flex flex-wrap items-center gap-3">
          <IssueSeverityBadge severity="critical" />
          <IssueSeverityBadge severity="high" />
          <IssueSeverityBadge severity="medium" />
          <IssueSeverityBadge severity="low" />
        </div>
        <div className="space-y-2 max-w-xl">
          {[
            { severity: 'critical' as const, label: 'Aucune balise <title> détectée sur la page d\'accueil' },
            { severity: 'high' as const, label: 'Schema.org Organization absent' },
            { severity: 'medium' as const, label: 'Métadonnées Open Graph incomplètes' },
            { severity: 'low' as const, label: 'Attribut lang manquant sur la balise <html>' },
          ].map((issue, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <IssueSeverityBadge severity={issue.severity} className="shrink-0" />
              <span className="text-foreground">{issue.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
