import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart2, Search, Lightbulb } from 'lucide-react'

export default function HomePage() {
  return (
    <main>
      {/* ── Section 1 — Hero ─────────────────────────────────────────── */}
      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-24 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          Audit GEO · 100&nbsp;% français
        </span>
        <h1 className="max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
          Vos clients cherchent dans ChatGPT.{' '}
          <span className="text-primary">Êtes-vous trouvable&nbsp;?</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          GEOMIND interroge ChatGPT, Perplexity, Gemini et Claude à votre place — et vous dit
          exactement où vous apparaissez (ou pas).
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <div className="flex flex-col items-center gap-1.5">
            <Button size="lg" asChild className="px-8">
              <Link href="/signup">Analyser mon site — gratuit →</Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              60 secondes · sans carte bancaire
            </span>
          </div>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">Voir les tarifs</Link>
          </Button>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span><strong className="text-foreground">2&nbsp;400+</strong> sites analysés</span>
          <span className="text-border hidden sm:block">·</span>
          <span><strong className="text-foreground">4 IA</strong> testées en parallèle</span>
          <span className="text-border hidden sm:block">·</span>
          <span><strong className="text-foreground">4,8/5</strong> sur 187 avis Trustpilot</span>
        </div>
      </section>

      {/* ── Section 2 — Comment ça marche ────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Comment ça marche
          </p>
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trois étapes, soixante secondes.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Donnez votre URL',
                body: "Entrez l'adresse de votre site. Pas besoin d'installer quoi que ce soit.",
              },
              {
                num: '02',
                title: 'On interroge les 4 IA',
                body: 'GEOMIND envoie des questions neutres à ChatGPT, Perplexity, Gemini et Claude et analyse leurs réponses.',
              },
              {
                num: '03',
                title: 'Vous recevez un plan',
                body: "Un rapport clair : où vous êtes cité, où vous ratez des opportunités, et quoi faire en priorité.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="flex gap-4">
                <span className="mt-0.5 shrink-0 font-mono text-2xl font-bold text-primary/30 leading-none">
                  {num}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3 — Value props ───────────────────────────────────── */}
      <section id="features" className="bg-secondary py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tout ce dont vous avez besoin pour être cité par les IA
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
            Un outil simple, conçu pour les indépendants et PME qui n&apos;ont pas d&apos;équipe
            marketing dédiée.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-border bg-card p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--brand-blue-50)]">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-foreground">Sache</h3>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Où vous en êtes</p>
              <p className="text-muted-foreground">
                Votre score GEO en temps réel : combien d&apos;IA vous citent, sur quels
                mots-clés, et par rapport à vos concurrents.
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-card p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--brand-blue-50)]">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-foreground">Comprenez</h3>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Pourquoi vous n&apos;apparaissez pas
              </p>
              <p className="text-muted-foreground">
                Analyse technique et contenu : on détecte exactement ce qui bloque les IA de vous
                citer.
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-card p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--brand-blue-50)]">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-foreground">Améliorez</h3>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Avec un plan concret</p>
              <p className="text-muted-foreground">
                Recommandations personnalisées, priorisées par impact. Pas de jargon, des actions
                simples.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 — Trust bar ─────────────────────────────────────── */}
      <section className="border-y border-border py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Compatible avec les principales IA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-muted-foreground">
            <span className="font-semibold">ChatGPT</span>
            <span className="text-border">·</span>
            <span className="font-semibold">Perplexity</span>
            <span className="text-border">·</span>
            <span className="font-semibold">Google Gemini</span>
            <span className="text-border">·</span>
            <span className="font-semibold">Claude</span>
          </div>
        </div>
      </section>

      {/* ── Section 4 — Pricing preview ───────────────────────────────── */}
      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Des tarifs simples, sans engagement
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-muted-foreground">
            Commencez gratuitement. Passez au Pro quand vous êtes prêt.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Gratuit */}
            <div className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Gratuit</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">0 €</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  1 site
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  3 analyses / mois
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Score GEO global
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-8">
                <Link href="/signup">Commencer gratuitement</Link>
              </Button>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex flex-col rounded-[var(--radius)] border-2 border-primary bg-card p-8 shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                Populaire
              </span>
              <h3 className="text-lg font-bold text-foreground">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">49 €</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  5 sites
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  30 analyses / mois
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Analyse complète
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Coach IA
                </li>
              </ul>
              <Button asChild className="mt-8">
                <Link href="/signup">Essayer Pro</Link>
              </Button>
            </div>

            {/* Business */}
            <div className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Business</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">149 €</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  10 sites
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  100 analyses / mois
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Support prioritaire
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-8">
                <Link href="mailto:contact@geomind.fr">Contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5 — FAQ ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-border">
            {[
              {
                q: "Qu'est-ce que la visibilité IA ?",
                a: "Quand quelqu'un pose une question à ChatGPT ou Perplexity, l'IA cite ses sources. La visibilité IA, c'est être dans ces sources. GEOMIND mesure si votre site est cité, et où vous pouvez progresser.",
              },
              {
                q: "Comment fonctionne l'audit ?",
                a: "On génère des questions neutres sur votre secteur, on les envoie aux principales IA, on analyse les réponses et on vérifie si votre site est cité. Tout est automatisé.",
              },
              {
                q: "Combien de temps prend une analyse ?",
                a: "En général entre 2 et 5 minutes selon le nombre de mots-clés et de moteurs IA.",
              },
              {
                q: "Est-ce que ça marche pour les petits sites ?",
                a: "Oui, c'est même là qu'on peut le plus vous aider. Les grands groupes ont des équipes SEO/GEO. Les indépendants et PME, non. C'est pour eux qu'on a créé GEOMIND.",
              },
              {
                q: "Quelle est la différence avec le SEO classique ?",
                a: "Le SEO optimise votre position dans Google. Le GEO (Generative Engine Optimization) optimise votre présence dans les réponses des IA. Ce sont deux leviers complémentaires.",
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui, sans engagement ni frais de résiliation. Vous restez sur le plan gratuit après l'annulation.",
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Oui. Vos données sont hébergées en Europe (Supabase EU) et ne sont jamais partagées avec des tiers.",
              },
              {
                q: "Je ne suis pas technique, est-ce que je peux l'utiliser ?",
                a: "Absolument. GEOMIND est conçu pour les non-experts. Les recommandations sont formulées en langage clair, sans jargon technique.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground">
                  {q}
                  <span className="ml-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="bg-primary py-24 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Prêt à savoir où vous en êtes ?
          </h2>
          <p className="mb-8 text-blue-100">
            Créez votre compte gratuitement et lancez votre premier audit en moins de 5 minutes.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-white px-8 text-primary hover:bg-blue-50"
          >
            <Link href="/signup">Analyser mon site gratuitement</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
