import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Check, X, CheckCircle2 } from 'lucide-react'

export default function PricingPage() {
  return (
    <main>
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
            Commencez gratuitement. Passez au Pro quand vous êtes prêt.
          </p>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Gratuit */}
            <div className="flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Gratuit</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pour découvrir la visibilité IA</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-foreground">0 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <Button asChild variant="outline" className="mt-8 rounded-lg">
                <Link href="/signup">Commencer gratuitement</Link>
              </Button>
              <ul className="mt-8 flex-1 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">1 site</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">1 analyse à vie</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Score GEO global</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <span className="text-muted-foreground">Analyse technique</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <span className="text-muted-foreground">Analyse contenu</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <span className="text-muted-foreground">Coach IA</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <span className="text-muted-foreground">Support prioritaire</span>
                </li>
              </ul>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex flex-col rounded-xl border border-border bg-card p-8 ring-2 ring-primary shadow-lg shadow-indigo-100">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                Populaire
              </span>
              <h2 className="text-lg font-bold text-foreground">Pro</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour les indépendants et PME actifs
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-foreground">49 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <Button
                asChild
                className="mt-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity"
              >
                <Link href="/signup">Essayer Pro</Link>
              </Button>
              <ul className="mt-8 flex-1 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">3 sites</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">4 analyses / mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Score GEO global</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Analyse technique</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Analyse contenu</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Coach IA (recommandations)</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <span className="text-muted-foreground">Support prioritaire</span>
                </li>
              </ul>
            </div>

            {/* Business */}
            <div className="flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Business</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour les agences et équipes marketing
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-foreground">149 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <Button asChild variant="outline" className="mt-8 rounded-lg">
                <Link href="mailto:contact@geomind.fr">Nous contacter</Link>
              </Button>
              <ul className="mt-8 flex-1 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">10 sites</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">30 analyses / mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Score GEO global</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Analyse technique</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Analyse contenu</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Coach IA + API access</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">Support prioritaire</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison table ──────────────────────────────────────────── */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Comparaison détaillée
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                    Fonctionnalité
                  </th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                    Gratuit
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">Pro</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Sites</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">1</td>
                  <td className="px-6 py-4 text-center font-medium text-foreground">3</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">10</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Analyses</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">1 à vie</td>
                  <td className="px-6 py-4 text-center font-medium text-foreground">4 / mois</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">30 / mois</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Score GEO global</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Analyse technique</td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Analyse contenu</td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Analyse autorité</td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">
                    Coach IA (recommandations)
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Support</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">Email</td>
                  <td className="px-6 py-4 text-center font-medium text-foreground">Email</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">Prioritaire</td>
                </tr>
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
                q: 'Puis-je annuler à tout moment ?',
                a: "Oui, sans engagement ni frais de résiliation. Vous restez sur le plan gratuit après l'annulation.",
              },
              {
                q: "Y a-t-il une période d'essai ?",
                a: "Le plan Gratuit vous permet de tester GEOMIND sans carte bancaire. Vous pouvez passer au Pro ou Business quand vous le souhaitez.",
              },
              {
                q: 'Comment fonctionne la facturation ?',
                a: "La facturation est mensuelle, prélevée chaque mois à la date de souscription. Vous recevez une facture par email via Stripe.",
              },
              {
                q: 'Puis-je changer de plan en cours de mois ?',
                a: "Oui, le changement prend effet immédiatement. Le montant est proratisé sur la période restante.",
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
              Créez votre compte gratuitement. Aucune carte bancaire requise.
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
    </main>
  )
}
