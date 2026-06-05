import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart2, Search, Lightbulb, CheckCircle2, ArrowRight, Shield, Wrench, FileText, TrendingUp, Zap } from 'lucide-react'

/* ─── Mini product preview — rendered in pure Tailwind, no images needed ─── */
function ProductPreview() {
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card shadow-xl shadow-indigo-100/60 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-full bg-background px-3 py-1 text-[11px] text-muted-foreground border border-border/60">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          geomind.fr/sites/votre-site/overview
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Score hero */}
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Score GEO Global</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-4xl font-extrabold text-[--score-good-600]">72</span>
                <span className="text-sm text-muted-foreground">/100</span>
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[--score-good-50] px-2 py-0.5 text-[10px] font-semibold text-[--score-good-600]">
                  <TrendingUp size={9} /> +8 pts
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-[--score-good-500]" />
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">Niveau : <span className="font-semibold text-foreground">Avancé</span></p>
            </div>
            {/* Pie suggestion */}
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-[--score-good-100] bg-[--score-good-50]">
              <span className="text-sm font-extrabold text-[--score-good-600]">72</span>
            </div>
          </div>
        </div>

        {/* 3 pillar cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Shield, label: 'Autorité', sub: 'Citations IA', score: 68, color: '--score-mid' },
            { icon: Wrench, label: 'Technique', sub: 'Lisibilité IA', score: 82, color: '--score-good' },
            { icon: FileText, label: 'Contenu', sub: 'Pertinence', score: 65, color: '--score-mid' },
          ].map(({ icon: Icon, label, sub, score, color }) => (
            <div key={label} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Icon size={11} className="text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-foreground leading-none">{label}</p>
                  <p className="text-[9px] text-muted-foreground">{sub}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-0.5 mb-1.5">
                <span className="text-xl font-extrabold leading-none" style={{ color: `var(${color}-600)` }}>{score}</span>
                <span className="text-[9px] text-muted-foreground">/100</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: `var(${color}-500)` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Action prioritaire */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-indigo-50/60 px-3 py-2.5">
          <Lightbulb size={13} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Action prioritaire</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">Boostez votre Autorité IA</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Votre site est rarement cité. Renforcez vos signaux d&apos;autorité.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        {/* Background glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/6 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: copy */}
            <div>
              {/* Badge */}
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Audit GEO · 100&nbsp;% français
              </span>

              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-5xl">
                Vos clients cherchent dans ChatGPT.{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Êtes-vous trouvable&nbsp;?
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-balance text-lg text-muted-foreground">
                GEOMIND audite votre visibilité dans les moteurs IA (ChatGPT, Perplexity, Gemini,
                Claude) et vous donne un plan d&apos;action concret.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1.5">
                  <Button
                    size="lg"
                    asChild
                    className="gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-white shadow-lg shadow-indigo-200/60 hover:opacity-90 transition-opacity"
                  >
                    <Link href="/signup">
                      Analyser mon site — gratuit
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <span className="text-xs text-muted-foreground">Sans carte bancaire · 60 secondes</span>
                </div>
                <Button size="lg" variant="outline" asChild className="rounded-lg">
                  <Link href="/pricing">Voir les tarifs</Link>
                </Button>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">2&nbsp;400+</strong> sites analysés
                </span>
                <span className="text-border">·</span>
                <span>
                  <strong className="text-foreground">4 IA</strong> testées
                </span>
                <span className="text-border">·</span>
                <span>
                  <strong className="text-foreground">4,8/5</strong> sur Trustpilot
                </span>
              </div>
            </div>

            {/* Right: product preview */}
            <div className="flex justify-center lg:justify-end">
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── IA Trust bar ──────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Compatible avec les principales IA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['ChatGPT', 'Perplexity', 'Google Gemini', 'Claude'].map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-indigo-200 hover:text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Comment ça marche
          </p>
          <h2 className="mb-16 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Trois étapes, soixante secondes.
          </h2>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line (desktop only) */}
            <div
              aria-hidden
              className="absolute top-6 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200 md:block"
            />

            {[
              {
                num: '01',
                icon: Search,
                title: 'Donnez votre URL',
                body: "Entrez l'adresse de votre site. Pas besoin d'installer quoi que ce soit.",
              },
              {
                num: '02',
                icon: Zap,
                title: 'On interroge les 4 IA',
                body: 'GEOMIND envoie des questions neutres à ChatGPT, Perplexity, Gemini et Claude et analyse leurs réponses.',
              },
              {
                num: '03',
                icon: Lightbulb,
                title: 'Vous recevez un plan',
                body: "Un rapport clair : où vous êtes cité, où vous ratez des opportunités, et quoi faire en priorité.",
              },
            ].map(({ num, icon: Icon, title, body }) => (
              <div key={num} className="flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                  <Icon size={20} className="text-primary" aria-hidden />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-[9px] font-black text-white">
                    {num.replace('0', '')}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
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
                title: 'Sachez',
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
                className="rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:shadow-indigo-100/50 hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                  {icon}
                </div>
                <h3 className="mb-1 text-xl font-bold text-foreground">{title}</h3>
                <p className="mb-3 text-sm font-semibold text-primary">{subtitle}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
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
                {['1 site', '1 analyse à vie', 'Score GEO global'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[--score-good-500]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8 rounded-lg">
                <Link href="/signup">Commencer gratuitement</Link>
              </Button>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex flex-col rounded-xl border border-primary/40 bg-card p-8 ring-2 ring-primary shadow-lg shadow-indigo-100/60">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                Populaire
              </span>
              <h3 className="text-lg font-bold text-foreground">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">49 €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {['3 sites', '4 analyses / mois', 'Analyse complète', 'Coach IA'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[--score-good-500]" />
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
                {['10 sites', '30 analyses / mois', 'Coach IA version complète', 'Support prioritaire'].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[--score-good-500]" />
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
              Prêt à savoir où vous en êtes&nbsp;?
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
