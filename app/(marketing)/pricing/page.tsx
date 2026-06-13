import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { PricingPlans } from '@/components/features/marketing/pricing-plans'

export const metadata: Metadata = {
  title: 'Tarifs — Gratuit, Solo 19 €, Pro 59 €, Business 149 €',
  description:
    'Des tarifs simples et sans engagement pour auditer votre visibilité dans ChatGPT, Perplexity, Gemini et Claude. 1 analyse complète offerte, sans carte bancaire.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="bg-muted/50 py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Tarifs
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Des tarifs simples,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              sans engagement
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Chaque plan inclut des crédits mensuels — vous les dépensez librement entre analyses
            et coach IA.
          </p>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <PricingPlans />
        </div>
      </section>

      {/* ── Comparison table ──────────────────────────────────────────── */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Comparaison détaillée
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border">
                  <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                    Fonctionnalité
                  </th>
                  <th className="px-5 py-4 text-center font-medium text-muted-foreground">
                    Gratuit
                  </th>
                  <th className="px-5 py-4 text-center font-medium text-muted-foreground">Solo</th>
                  <th className="px-5 py-4 text-center font-semibold text-primary">Pro</th>
                  <th className="px-5 py-4 text-center font-medium text-muted-foreground">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <ComparisonRow
                  label="Crédits / mois"
                  values={['1 000 offerts, sans renouvellement', '5 000', '20 000', '80 000']}
                />
                <ComparisonRow label="Sites" values={['1', '2', '5', '15']} striped />
                <ComparisonRow
                  label="Analyses complètes (400 crédits)"
                  values={['1 offerte', '≈ 12 / mois', '≈ 50 / mois', '≈ 200 / mois']}
                />
                <ComparisonRow
                  label="Coach IA GEO"
                  values={[true, true, true, true]}
                  striped
                />
                <ComparisonRow
                  label="Mémoire du coach entre sessions"
                  values={[false, true, true, true]}
                />
                <ComparisonRow
                  label="Studio de correctifs (fichiers prêts à coller)"
                  values={[true, true, true, true]}
                  striped
                />
                <ComparisonRow
                  label="Suivi des concurrents (share of voice)"
                  values={[true, true, true, true]}
                />
                <ComparisonRow
                  label="Réputation : ce que les IA disent de vous"
                  values={[true, true, true, true]}
                  striped
                />
                <ComparisonRow
                  label="Local : questions géolocalisées + checklist"
                  values={[true, true, true, true]}
                />
                <ComparisonRow
                  label="Score Agent-Ready (commerce agentique)"
                  values={[true, true, true, true]}
                  striped
                />
                <ComparisonRow
                  label="Pixel : visiteurs réels venus des IA"
                  values={[true, true, true, true]}
                />
                <ComparisonRow
                  label="Surveillance automatique + alertes email"
                  values={['mensuelle', 'hebdomadaire', 'hebdomadaire', 'hebdomadaire']}
                  striped
                />
                <ComparisonRow
                  label="Suivi dans le temps (tendances)"
                  values={[true, true, true, true]}
                />
                <ComparisonRow
                  label="Analyse page par page"
                  values={[false, '5 pages', '10 pages', '10 pages']}
                  striped
                />
                <ComparisonRow
                  label="Recommandations complètes (IA avancée)"
                  values={[false, false, true, true]}
                />
                <ComparisonRow
                  label="Publishers recommandés"
                  values={['3', '15', '15', '15']}
                  striped
                />
                <ComparisonRow
                  label="Export PDF des rapports"
                  values={[false, false, true, 'White-label']}
                />
                <ComparisonRow
                  label="Historique des analyses"
                  values={['30 jours', '90 jours', '1 an', 'Illimité']}
                  striped
                />
                <ComparisonRow
                  label="Packs de crédits à la carte"
                  values={[true, true, true, true]}
                />
                <ComparisonRow
                  label="Support"
                  values={['Email', 'Email', 'Email', 'Prioritaire < 24 h']}
                  striped
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Questions sur la facturation
          </h2>
          <div className="divide-y divide-border">
            {[
              {
                q: 'Comment fonctionnent les crédits ?',
                a: "Chaque plan payant inclut une allocation mensuelle de crédits que vous dépensez librement : une analyse complète coûte 400 crédits, une question au coach IA environ 10. Les crédits du plan se renouvellent à chaque cycle de facturation. Le plan Gratuit reçoit 1 000 crédits de bienvenue, sans renouvellement — de quoi faire votre première analyse complète et poser vos questions au coach.",
              },
              {
                q: 'Que se passe-t-il si j’épuise mes crédits ?',
                a: "Vous pouvez acheter un pack de crédits à la carte (à partir de 5 €) sans changer de plan. Les crédits achetés n'expirent jamais et sont consommés après les crédits mensuels.",
              },
              {
                q: 'Les crédits non utilisés sont-ils reportés ?',
                a: "Les crédits mensuels du plan ne sont pas reportés d'un mois sur l'autre. Les crédits achetés en pack, eux, restent valables sans limite de temps.",
              },
              {
                q: 'Puis-je annuler à tout moment ?',
                a: "Oui, sans engagement ni frais de résiliation. Votre plan reste actif jusqu'à la fin de la période payée, puis vous basculez sur le plan Gratuit. Vos crédits achetés restent utilisables.",
              },
              {
                q: 'Puis-je changer de plan en cours de mois ?',
                a: "Oui. En cas de passage à un plan supérieur, le changement est immédiat : le montant est proratisé et la différence de crédits est ajoutée tout de suite à votre solde. En cas de passage à un plan inférieur, le changement prend effet à la fin de la période en cours.",
              },
              {
                q: 'Que deviennent mes sites si je réduis mon plan ?',
                a: "Rien n'est supprimé. Si vous avez plus de sites que la limite du nouveau plan, les sites excédentaires passent en lecture seule : vous consultez leurs données, mais vous ne pouvez plus lancer d'analyses dessus.",
              },
              {
                q: "Mes données sont-elles supprimées si j'annule ?",
                a: "Non. Vos données restent accessibles en lecture sur le plan gratuit. Vous pouvez demander la suppression complète à tout moment (RGPD).",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground">
                  {q}
                  <span className="ml-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-16 shadow-xl shadow-indigo-200">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Lancez votre premier audit
            </h2>
            <p className="mb-8 text-indigo-100">
              Créez votre compte gratuitement — 1 000 crédits offerts, aucune carte bancaire
              requise.
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-lg bg-white px-8 text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors font-semibold"
            >
              <Link href="/signup">Commencer gratuitement</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ComparisonRow({
  label,
  values,
  striped = false,
}: {
  label: string
  values: Array<string | boolean>
  striped?: boolean
}) {
  return (
    <tr className={striped ? 'bg-muted/20' : 'bg-card'}>
      <td className="px-5 py-4 font-medium text-foreground">{label}</td>
      {values.map((value, i) => (
        <td key={i} className="px-5 py-4 text-center">
          {value === true ? (
            <Check className="mx-auto h-4 w-4 text-emerald-500" />
          ) : value === false ? (
            <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
          ) : (
            <span className={i === 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {value}
            </span>
          )}
        </td>
      ))}
    </tr>
  )
}
