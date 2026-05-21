import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart2, Search, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        {/* Subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-indigo-500/8 blur-3xl" />
        </div>

        {/* Badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Audit GEO · 100&nbsp;% français
        </span>

        {/* Title */}
        <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Vos clients cherchent dans ChatGPT.{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Êtes-vous trouvable&nbsp;?
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          GEOMIND interroge ChatGPT, Perplexity, Gemini et Claude à votre place — et vous dit
          exactement où vous apparaissez (ou pas).
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <div className="flex flex-col items-center gap-1.5">
            <Button
              size="lg"
              asChild
              className="gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-white shadow-lg shadow-indigo-200 hover:opacity-90 transition-opacity"
            >
              <Link href="/signup">
                Analyser mon site — gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground">60 secondes · sans carte bancaire</span>
          </div>
          <Button size="lg" variant="outline" asChild className="rounded-lg">
            <Link href="/pricing">Voir les tarifs</Link>
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">2&nbsp;400+</strong> sites analysés
          </span>
          <span className="hidden text-border sm:block">·</span>
          <span>
            <strong className="text-foreground">4 IA</strong> testées en parallèle
          </span>
          <span className="hidden text-border sm:block">·</span>
          <span>
            <strong className="text-foreground">4,8/5</strong> sur 187 avis Trustpilot
          </span>
        </div>
      </section>

      {/* ── IA Trust bar ──────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Compatible avec les principales IA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-muted-foreground">
            <span>ChatGPT</span>
            <span className="text-border">·</span>
            <span>Perplexity</span>
            <span className="text-border">·</span>
            <span>Google Gemini</span>
            <span className="text-border">·</span>
            <span>Claude</span>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Comment ça marche
          </p>
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
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
                <span className="mt-0.5 shrink-0 font-mono text-2xl font-extrabold leading-none text-indigo-500/30">
                  {num}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="bg-muted/50 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Fonctionnalités
          </p>
          <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Tout ce dont vous avez besoin pour être cité par les IA
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-center text-muted-foreground">
            Un outil simple, conçu pour les indépendants et PME qui n&apos;ont pas d&apos;équipe
            marketing dédiée.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <BarChart2 className="h-6 w-6 text-indigo-600" />,
                title: 'Sache',
                subtitle: 'Où vous en êtes',
                body: "Votre score GEO en temps réel : combien d'IA vous citent, sur quels mots-clés, et par rapport à vos concurrents.",
              },
              {
                icon: <Search className="h-6 w-6 text-indigo-600" />,
                title: 'Comprenez',
                subtitle: "Pourquoi vous n'apparaissez pas",
                body: "Analyse technique et contenu : on détecte exactement ce qui bloque les IA de vous citer.",
              },
              {
                icon: <Lightbulb className="h-6 w-6 text-indigo-600" />,
                title: 'Améliorez',
                subtitle: 'Avec un plan concret',
                body: "Recommandations personnalisées, priorisées par impact. Pas de jargon, des actions simples.",
              },
            ].map(({ icon, title, subtitle, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                  {icon}
                </div>
                <h3 className="mb-1 text-xl font-bold text-foreground">{title}</h3>
                <p className="mb-3 text-sm font-medium text-muted-foreground">{subtitle}</p>
                <p className="leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Tarifs
          </p>
          <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Des tarifs simples, sans engagement
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-muted-foreground">
            Commencez gratuitement. Passez au Pro quand vous êtes prêt.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Gratuit */}
            <div className="flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Gratuit</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">0 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {['1 site', '3 analyses / mois', 'Score GEO global'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8 rounded-lg">
                <Link href="/signup">Commencer gratuitement</Link>
              </Button>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex flex-col rounded-xl border border-border bg-card p-8 ring-2 ring-primary shadow-lg shadow-indigo-100">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                Populaire
              </span>
              <h3 className="text-lg font-bold text-foreground">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">49 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {['5 sites', '30 analyses / mois', 'Analyse complète', 'Coach IA'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity"
              >
                <Link href="/signup">Essayer Pro</Link>
              </Button>
            </div>

            {/* Business */}
            <div className="flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Business</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">149 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {['10 sites', '100 analyses / mois', 'API access', 'Support prioritaire'].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <Button asChild variant="outline" className="mt-8 rounded-lg">
                <Link href="mailto:contact@geomind.fr">Contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-muted/50 py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
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
              Prêt à savoir où vous en êtes ?
            </h2>
            <p className="mb-8 text-indigo-100">
              Créez votre compte gratuitement et lancez votre premier audit en moins de 5 minutes.
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-lg bg-white px-8 text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors font-semibold"
            >
              <Link href="/signup">Analyser mon site gratuitement</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
