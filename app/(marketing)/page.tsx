import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  BarChart2,
  BarChart3,
  Search,
  Lightbulb,
  CheckCircle2,
  Shield,
  Wrench,
  FileText,
  TrendingUp,
  Zap,
  Building2,
  Briefcase,
  FileCode2,
  Trophy,
  AlertTriangle,
  BellRing,
  ArrowRight,
  Globe,
} from 'lucide-react'
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

/* ─── Intitulé de section — aligné à gauche, kicker bleu acier + gros titre navy ─── */
function SectionHeading({
  kicker,
  title,
  intro,
}: {
  kicker: string
  title: string
  intro?: string
}) {
  return (
    <div className="mb-12 max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{kicker}</p>
      <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>}
    </div>
  )
}

/* ─── Mini product preview — rendered in pure Tailwind, no images needed ─── */
function ProductPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/30 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-full bg-background px-3 py-1 text-[11px] text-muted-foreground border border-border/60">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          geomind.fr
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Score hero */}
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Score GEO Global
          </p>
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
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Niveau : <span className="font-semibold text-foreground">Avancé</span>
              </p>
            </div>
          </div>
        </div>

        {/* 3 pillar cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Shield, label: 'Autorité', score: 68, color: '--score-mid' },
            { icon: Wrench, label: 'Technique', score: 82, color: '--score-good' },
            { icon: FileText, label: 'Contenu', score: 65, color: '--score-mid' },
          ].map(({ icon: Icon, label, score, color }) => (
            <div key={label} className="rounded-xl border border-border bg-background p-3">
              <Icon size={15} className="text-primary" aria-hidden />
              <p className="mt-2 text-[10px] text-muted-foreground">{label}</p>
              <p className="text-lg font-extrabold" style={{ color: `var(${color}-600)` }}>
                {score}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MarketingHome() {
  return (
    <div className="bg-white">
      {/* ── Hero — surface navy premium ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#16304B]">
        {/* Halos lumineux */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[28%] h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[380px] w-[520px] rounded-full bg-[--score-good-500]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: copy */}
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#B2C8DE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                Audit GEO · 100&nbsp;% français
              </span>

              <h1 className="text-balance text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl">
                Vos clients cherchent dans ChatGPT.{' '}
                <span className="text-[#7FB5E6]">Y êtes-vous&nbsp;?</span>
              </h1>

              <p className="mt-5 max-w-lg text-balance text-lg text-[#B2C8DE]">
                GEOMIND mesure si votre site est cité par les IA — ChatGPT, Perplexity, Gemini,
                Claude — et vous donne un plan d&apos;action concret.
              </p>

              {/* Audit express sans inscription (PLAN item 20) — l'outil EST le hero */}
              <div className="mt-8">
                <ExpressAudit />
                <p className="mt-3 text-xs text-[#7C92AC]">
                  Envie d&apos;aller directement à l&apos;audit complet ?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-white underline underline-offset-4"
                  >
                    Créer un compte gratuit
                  </Link>{' '}
                  ·{' '}
                  <Link
                    href="/pricing"
                    className="font-medium text-white underline underline-offset-4"
                  >
                    Voir les tarifs
                  </Link>
                </p>
              </div>

              {/* Social proof — uniquement des faits vérifiables */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-[#B2C8DE]">
                <span>
                  <strong className="font-semibold text-white">4 IA</strong> interrogées à chaque
                  audit
                </span>
                <span className="text-white/20">·</span>
                <span>
                  <strong className="font-semibold text-white">1 analyse offerte</strong>, sans
                  carte bancaire
                </span>
                <span className="text-white/20">·</span>
                <span>
                  Données hébergées <strong className="font-semibold text-white">en Europe</strong>
                </span>
              </div>
            </div>

            {/* Right: product preview, décalé */}
            <div className="flex justify-center lg:mt-10 lg:justify-end">
              <ProductPreview />
            </div>
          </div>
        </div>

        {/* IA Trust bar — intégrée en bas du hero */}
        <div className="relative border-t border-white/10 bg-[#0F2236]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7C92AC]">
              Interrogées à chaque audit
            </span>
            {['ChatGPT', 'Perplexity', 'Google Gemini', 'Claude'].map((name) => (
              <span key={name} className="text-sm font-medium text-white">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading kicker="Comment ça marche" title="Trois étapes, quelques minutes." />

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                num: '1',
                icon: Globe,
                title: 'Donnez votre URL',
                body: "Entrez l'adresse de votre site. Pas besoin d'installer quoi que ce soit.",
              },
              {
                num: '2',
                icon: Zap,
                title: 'On interroge les 4 IA',
                body: 'Des questions neutres envoyées à ChatGPT, Perplexity, Gemini et Claude, puis analysées.',
              },
              {
                num: '3',
                icon: Lightbulb,
                title: 'Vous recevez un plan',
                body: 'Où vous êtes cité, où vous ratez des opportunités, et quoi faire en priorité.',
              },
            ].map(({ num, icon: Icon, title, body }) => (
              <div
                key={num}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-3 right-4 text-6xl font-extrabold text-foreground/[0.04]"
                >
                  {num}
                </span>
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={19} className="text-primary" aria-hidden />
                </span>
                <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — bento ──────────────────────────────────────────── */}
      <section id="features" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Fonctionnalités"
            title="Tout pour être cité par les IA."
            intro="Un outil simple, conçu pour les indépendants et PME qui n'ont pas d'équipe marketing dédiée."
          />

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* Carte phare — navy */}
            <div className="relative overflow-hidden rounded-2xl bg-[#16304B] p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 right-0 h-64 w-72 rounded-full bg-primary/30 blur-3xl"
              />
              <span className="relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <BarChart2 className="h-5 w-5 text-[#7FB5E6]" aria-hidden />
              </span>
              <h3 className="relative text-xl font-bold text-white">Sachez où vous en êtes</h3>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-[#B2C8DE]">
                Votre score GEO en temps réel : combien d&apos;IA vous citent, sur quels mots-clés,
                et face à vos concurrents.
              </p>
              <div className="relative mt-6 flex flex-wrap gap-3">
                {[
                  { value: '72', label: 'Score GEO', accent: true },
                  { value: '4/4', label: 'IA suivies', accent: false },
                  { value: '+8', label: '30 jours', accent: false },
                ].map(({ value, label, accent }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5"
                  >
                    <p
                      className={`text-2xl font-extrabold ${accent ? 'text-[#34D399]' : 'text-white'}`}
                    >
                      {value}
                    </p>
                    <p className="text-[10px] text-[#7C92AC]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Deux cartes secondaires */}
            <div className="grid gap-4">
              {[
                {
                  icon: Search,
                  iconClass: 'bg-primary/10 text-primary',
                  title: 'Comprenez pourquoi pas',
                  body: 'Analyse technique et contenu : on détecte exactement ce qui bloque les IA de vous citer.',
                },
                {
                  icon: Lightbulb,
                  iconClass: 'bg-[--score-good-50] text-[--score-good-600]',
                  title: 'Améliorez avec un plan',
                  body: 'Recommandations personnalisées, priorisées par impact. Pas de jargon, des actions simples.',
                },
              ].map(({ icon: Icon, iconClass, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6">
                  <span
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cas d'usage / personas (PLAN item 21) ─────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Pour qui ?"
            title="Ça change quoi, concrètement ?"
            intro="Trois situations types — la vôtre y est sûrement."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Wrench,
                who: 'Artisan ou commerce local',
                scenario:
                  '« Quelqu\'un demande à ChatGPT le meilleur plombier de sa ville. Trois noms sortent — pas le mien. »',
                outcome:
                  'GeoMind vous dit si vous sortez dans ces réponses, pourquoi vos concurrents y sont, et quoi corriger en premier (souvent : une fiche bien structurée et des infos lisibles par les IA).',
              },
              {
                icon: Building2,
                who: 'PME avec un site vitrine',
                scenario:
                  '« On a investi dans le SEO. Mais nos prospects posent maintenant leurs questions à une IA, et on ne sait même pas si on y existe. »',
                outcome:
                  'Vous suivez votre taux de citation mois après mois, recevez une alerte quand il bouge, et votre équipe applique un plan d\'action priorisé — vérifié automatiquement.',
              },
              {
                icon: Briefcase,
                who: 'Freelance ou consultant',
                scenario:
                  '« Mes clients me trouvaient par Google. Maintenant ils demandent à ChatGPT "quel consultant pour…" — et je n\'ai aucune idée de ce qu\'il répond. »',
                outcome:
                  'Vous voyez les réponses réelles des 4 moteurs sur les questions de votre métier, et le coach vous guide pas à pas, sans jargon, pour y apparaître.',
              },
            ].map(({ icon: Icon, who, scenario, outcome }) => (
              <div key={who} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
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
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Bien plus qu'un score"
            title="GeoMind fait le travail, pas seulement le constat."
            intro="Les autres outils vous donnent un tableau de bord. GeoMind vous donne les correctifs, la preuve que ça marche, et vous prévient quand ça bouge."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileCode2,
                title: 'Correctifs prêts à coller',
                body: 'Pour chaque problème détecté, le fichier corrigé prêt à coller (llms.txt, données structurées, FAQ, balises) — avec les instructions pour votre plateforme.',
              },
              {
                icon: BarChart3,
                title: 'La preuve par les chiffres',
                body: 'Le Pixel GeoMind compte les visiteurs réels que les IA vous amènent, et ce qu’ils font : appels, devis, rendez-vous.',
              },
              {
                icon: Trophy,
                title: 'Vos concurrents en face',
                body: 'Sur les questions de votre secteur, qui les IA citent-elles ? Vous, ou eux ? Et surtout : pourquoi eux.',
              },
              {
                icon: AlertTriangle,
                title: 'Ce que les IA disent de vous',
                body: 'On détecte quand ChatGPT ou Gemini racontent des infos fausses sur vous (horaires, adresse) — avant que ça vous coûte un client.',
              },
              {
                icon: BellRing,
                title: 'Surveillance automatique',
                body: 'GeoMind re-vérifie votre visibilité chaque semaine et vous alerte par email : nouvelle citation, ou baisse à corriger.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <h3 className="mb-1.5 text-base font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="Tarifs"
            title="Des tarifs simples, sans engagement."
            intro="Commencez gratuitement. Passez au Pro quand vous êtes prêt."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
                    ? 'relative flex flex-col rounded-2xl border-2 border-primary bg-card p-7 shadow-lg shadow-primary/10'
                    : 'flex flex-col rounded-2xl border border-border bg-card p-7'
                }
              >
                {highlighted && (
                  <span className="absolute -top-3.5 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
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
                  className="mt-8 rounded-lg"
                >
                  <Link href={price === 0 ? '/signup' : '/pricing'}>{cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            1 analyse complète = 400 crédits. Chaque plan inclut des crédits mensuels, utilisables
            librement entre analyses et questions au Coach IA.{' '}
            <Link href="/pricing" className="underline hover:text-foreground">
              Voir le détail des plans
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
        <div className="mx-auto max-w-3xl px-4">
          <SectionHeading kicker="FAQ" title="Questions fréquentes." />
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

      {/* ── CTA final — second moment navy ────────────────────────────── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#16304B] px-8 py-16 sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/3 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
          />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Prêt à savoir où vous en êtes&nbsp;?
            </h2>
            <p className="mt-4 text-lg text-[#B2C8DE]">
              Créez votre compte gratuitement et lancez votre premier audit en moins de 5 minutes.
            </p>
            <Button
              size="lg"
              asChild
              className="mt-8 gap-2 rounded-lg bg-[#34D399] px-8 font-semibold text-[#0B3B2E] shadow-lg shadow-black/20 hover:bg-[#2bbd88]"
            >
              <Link href="/signup">
                Analyser mon site gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
