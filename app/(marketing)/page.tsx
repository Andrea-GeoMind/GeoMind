import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart2, Search, Lightbulb, CheckCircle2, Shield, Wrench, FileText, TrendingUp, Zap } from 'lucide-react'
import { PLAN_PRICES, PLAN_LIMITS } from '@/lib/plans'
import { CREDIT_COSTS } from '@/lib/credits-shared'
import { ExpressAudit } from '@/components/features/marketing/express-audit'

/** Nombre d'analyses complètes couvertes par l'allocation mensuelle d'un plan. */
function analysesPerMonth(plan: keyof typeof PLAN_LIMITS): number {
  return Math.floor(PLAN_LIMITS[plan].creditsPerMonth / CREDIT_COSTS.fullAnalysis)
}

// FAQ de la landing — source unique pour l'affichage ET le balisage
// Schema.org FAQPage (règle GEO schema-org-faq que le produit audite chez
// ses clients : les IA reprennent les réponses balisées telles quelles).
const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que la visibilité IA ?",
    a: "Quand quelqu'un pose une question à ChatGPT ou Perplexity, l'IA cite ses sources. La visibilité IA, c'est être dans ces sources. GEOMIND mesure si votre site est cité, et où vous pouvez progresser.",
  },
  {
    q: "Comment fonctionne l'audit ?",
    a: "On génère des questions neutres sur votre secteur, on les envoie aux principales IA, on analyse les réponses et on vérifie si votre site est cité. Tout est automatisé.",
  },
  {
    q: 'Combien de temps prend une analyse ?',
    a: 'En général entre 2 et 5 minutes selon le nombre de mots-clés et de moteurs IA.',
  },
  {
    q: 'Est-ce que ça marche pour les petits sites ?',
    a: "Oui, c'est même là qu'on peut le plus vous aider. Les grands groupes ont des équipes SEO/GEO. Les indépendants et PME, non. C'est pour eux qu'on a créé GEOMIND.",
  },
  {
    q: 'Quelle est la différence avec le SEO classique ?',
    a: 'Le SEO optimise votre position dans Google. Le GEO (Generative Engine Optimization) optimise votre présence dans les réponses des IA. Ce sont deux leviers complémentaires.',
  },
  {
    q: 'J\'utilise déjà Semrush / Ahrefs / un consultant SEO, à quoi sert GeoMind ?',
    a: 'Ces outils mesurent votre position dans Google. GeoMind mesure si vous êtes cité quand quelqu\'un pose sa question à ChatGPT, Perplexity, Gemini ou Claude — ce qu\'aucun outil SEO classique ne fait. Gardez votre SEO, ajoutez le GEO : vos clients utilisent déjà les deux.',
  },
  {
    q: 'Mon score peut-il bouger sans que je change rien ?',
    a: 'Oui, un peu : les IA ne répondent jamais deux fois exactement pareil. C\'est pour ça que GeoMind suit la tendance sur 30 jours plutôt que le chiffre du jour, et vous alerte seulement quand un vrai changement se produit.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: "Oui, sans engagement ni frais de résiliation. Vous restez sur le plan gratuit après l'annulation.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Vos données sont hébergées en Europe (Supabase EU) et ne sont jamais partagées avec des tiers.',
  },
  {
    q: "Je ne suis pas technique, est-ce que je peux l'utiliser ?",
    a: 'Absolument. GEOMIND est conçu pour les non-experts. Les recommandations sont formulées en langage clair, sans jargon technique.',
  },
] as const

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

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
    <div>
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

              {/* Audit express sans inscription (PLAN item 20) — l'outil EST le hero */}
              <div className="mt-8">
                <ExpressAudit />
                <p className="mt-3 text-xs text-muted-foreground">
                  Envie d&apos;aller directement à l&apos;audit complet ?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Créer un compte gratuit
                  </Link>{' '}
                  ·{' '}
                  <Link
                    href="/pricing"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Voir les tarifs
                  </Link>
                </p>
              </div>

              {/* Social proof — uniquement des faits vérifiables */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">4 IA</strong> interrogées à chaque audit
                </span>
                <span className="text-border">·</span>
                <span>
                  <strong className="text-foreground">1 analyse offerte</strong>, sans carte
                  bancaire
                </span>
                <span className="text-border">·</span>
                <span>
                  Données hébergées <strong className="text-foreground">en Europe</strong>
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
            Trois étapes, quelques minutes.
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

      {/* ── Cas d'usage / personas (PLAN item 21) ─────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Pour qui ?
          </p>
          <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Ça change quoi, concrètement ?
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-center text-muted-foreground">
            Trois situations types — la vôtre y est sûrement.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: '🔧',
                who: 'Artisan ou commerce local',
                scenario:
                  '« Quelqu\'un demande à ChatGPT le meilleur plombier de sa ville. Trois noms sortent — pas le mien. »',
                outcome:
                  'GeoMind vous dit si vous sortez dans ces réponses, pourquoi vos concurrents y sont, et quoi corriger en premier (souvent : une fiche bien structurée et des infos lisibles par les IA).',
              },
              {
                emoji: '🏢',
                who: 'PME avec un site vitrine',
                scenario:
                  '« On a investi dans le SEO. Mais nos prospects posent maintenant leurs questions à une IA, et on ne sait même pas si on y existe. »',
                outcome:
                  'Vous suivez votre taux de citation mois après mois, recevez une alerte quand il bouge, et votre équipe applique un plan d\'action priorisé — vérifié automatiquement.',
              },
              {
                emoji: '💼',
                who: 'Freelance ou consultant',
                scenario:
                  '« Mes clients me trouvaient par Google. Maintenant ils demandent à ChatGPT "quel consultant pour…" — et je n\'ai aucune idée de ce qu\'il répond. »',
                outcome:
                  'Vous voyez les réponses réelles des 4 moteurs sur les questions de votre métier, et le coach vous guide pas à pas, sans jargon, pour y apparaître.',
              },
            ].map(({ emoji, who, scenario, outcome }) => (
              <div
                key={who}
                className="flex flex-col rounded-xl border border-border bg-card p-7 shadow-sm"
              >
                <div className="mb-3 text-3xl" aria-hidden>
                  {emoji}
                </div>
                <h3 className="mb-3 text-base font-bold text-foreground">{who}</h3>
                <p className="mb-4 text-sm italic leading-relaxed text-muted-foreground">
                  {scenario}
                </p>
                <p className="mt-auto text-sm leading-relaxed text-foreground/80">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capacités phares (PLAN item 34 : montrer la valeur réelle) ──── */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Bien plus qu&apos;un score
          </p>
          <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            GeoMind fait le travail, pas seulement le constat
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-center text-muted-foreground">
            Les autres outils vous donnent un tableau de bord. GeoMind vous donne les correctifs,
            la preuve que ça marche, et vous prévient quand ça bouge.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Studio de correctifs',
                body: 'Vos fichiers corrigés prêts à coller (llms.txt, données structurées, FAQ, balises) — ou à envoyer à votre webmaster en un clic.',
              },
              {
                title: 'La preuve par les chiffres',
                body: 'Le Pixel GeoMind compte les visiteurs réels que les IA vous amènent, et ce qu’ils font : appels, devis, rendez-vous.',
              },
              {
                title: 'Vos concurrents en face',
                body: 'Sur les questions de votre secteur, qui les IA citent-elles ? Vous, ou eux ? Et surtout : pourquoi eux.',
              },
              {
                title: 'Ce que les IA disent de vous',
                body: 'On détecte quand ChatGPT ou Gemini racontent des infos fausses sur vous (horaires, adresse) — avant que ça vous coûte un client.',
              },
              {
                title: 'Surveillance automatique',
                body: 'GeoMind re-vérifie votre visibilité chaque semaine et vous alerte par email : nouvelle citation, ou baisse à corriger.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
                  <Zap className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-foreground">{title}</h3>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'Gratuit',
                forWho: 'Pour découvrir',
                price: 0,
                features: [
                  '1 site',
                  '1 analyse complète offerte',
                  'Score GEO + points faibles essentiels',
                  'Coach IA',
                ],
                cta: 'Commencer gratuitement',
                highlighted: false,
              },
              {
                name: 'Solo',
                forWho: 'Pour les indépendants',
                price: PLAN_PRICES.solo.monthly,
                features: [
                  `${PLAN_LIMITS.solo.sites} sites`,
                  `Jusqu'à ${analysesPerMonth('solo')} analyses / mois`,
                  'Analyse page par page (5 pages)',
                  'Coach IA avec mémoire',
                ],
                cta: 'Essayer Solo',
                highlighted: false,
              },
              {
                name: 'Pro',
                forWho: 'Pour les TPE/PME qui veulent agir',
                trialNote: '7 jours d’essai gratuit, annulable à tout moment',
                price: PLAN_PRICES.pro.monthly,
                features: [
                  `${PLAN_LIMITS.pro.sites} sites`,
                  `Jusqu'à ${analysesPerMonth('pro')} analyses / mois`,
                  'Recommandations complètes (IA avancée)',
                  'Export PDF · Historique 1 an',
                ],
                cta: 'Essayer Pro — 7 jours offerts',
                highlighted: true,
              },
              {
                name: 'Business',
                forWho: 'Pour les agences & multi-sites',
                price: PLAN_PRICES.business.monthly,
                features: [
                  `${PLAN_LIMITS.business.sites} sites`,
                  `Jusqu'à ${analysesPerMonth('business')} analyses / mois`,
                  'Export PDF white-label',
                  'Historique illimité · Support prioritaire',
                ],
                cta: 'Essayer Business',
                highlighted: false,
              },
            ].map(({ name, forWho, price, features, cta, highlighted }) => (
              <div
                key={name}
                className={
                  highlighted
                    ? 'relative flex flex-col rounded-xl border border-primary/40 bg-card p-8 ring-2 ring-primary shadow-lg shadow-indigo-100/60'
                    : 'flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm'
                }
              >
                {highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                    Populaire
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground">{name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{forWho}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{price}&nbsp;€</span>
                  <span className="text-sm text-muted-foreground">HT/mois</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[--score-good-500]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={highlighted ? 'default' : 'outline'}
                  className={
                    highlighted
                      ? 'mt-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity'
                      : 'mt-8 rounded-lg'
                  }
                >
                  <Link href={price === 0 ? '/signup' : '/pricing'}>{cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            1 analyse complète = 400 crédits. Chaque plan inclut des crédits mensuels, utilisables
            librement entre analyses et questions au Coach IA.{' '}
            <Link href="/pricing" className="underline hover:text-foreground">
              Voir le détail des plans
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-muted/50 py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-border">
            {FAQ_ITEMS.map(({ q, a }) => (
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
    </div>
  )
}
