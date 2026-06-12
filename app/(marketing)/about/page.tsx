import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'À propos — pourquoi GeoMind existe',
  description:
    'GeoMind est né d\'un constat simple : vos clients posent leurs questions aux IA, et aucun outil ne disait aux petites entreprises françaises si elles y existaient. Voici notre approche.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
        À propos
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
        Pourquoi GeoMind existe
      </h1>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-foreground/85">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Le constat</h2>
          <p>
            En quelques années, une partie des recherches a quitté Google pour ChatGPT,
            Perplexity, Gemini et Claude. Quand quelqu&apos;un demande aujourd&apos;hui « quel
            artisan pour refaire ma salle de bain ? » ou « quel logiciel de devis pour un
            indépendant ? », l&apos;IA répond avec <em>quelques</em> noms — et tous les autres
            n&apos;existent simplement pas dans la conversation.
          </p>
          <p>
            Les grands groupes ont des équipes pour s&apos;en occuper. Les TPE, PME et
            indépendants, non. Les outils existants sont chers, en anglais, et pensés pour des
            experts SEO. GeoMind est né pour combler exactement ce vide.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Notre approche</h2>
          <p>
            <strong>Mesurer honnêtement.</strong> Nous interrogeons réellement les 4 moteurs IA
            avec les questions que vos clients posent. Et parce que les IA ne répondent jamais
            deux fois pareil, nous vous montrons la tendance sur 30 jours plutôt qu&apos;un
            chiffre du jour qui fait paniquer pour rien.
          </p>
          <p>
            <strong>Parler français — le vrai.</strong> Pas de « canonical tag mismatch » sans
            explication. Chaque point faible est expliqué en une phrase qu&apos;un patron
            comprend, avec la correction qui va avec.
          </p>
          <p>
            <strong>Faire, pas seulement diagnostiquer.</strong> Un plan d&apos;action priorisé
            par retour sur effort, un coach IA qui vous guide pas à pas, et une vérification
            automatique de vos corrections. L&apos;objectif n&apos;est pas un score — ce sont
            des clients qui vous trouvent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Qui est derrière GeoMind</h2>
          <p>
            GeoMind est un produit français, indépendant et auto-financé, développé par une
            petite équipe obsédée par une chose : rendre la visibilité IA accessible à ceux qui
            n&apos;ont ni le temps ni le budget d&apos;une agence. Vos données sont hébergées en
            Europe (Supabase, région UE) et ne sont jamais revendues.
          </p>
          <p>
            Une question, une idée, un doute ?{' '}
            <a
              href="mailto:contact@geomind.fr"
              className="font-medium text-primary underline underline-offset-4"
            >
              contact@geomind.fr
            </a>{' '}
            — on répond vite, et c&apos;est un humain qui lit.
          </p>
        </section>
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-center shadow-xl shadow-indigo-200">
        <p className="mb-5 text-lg font-bold text-white">
          Découvrez où vous en êtes — la première analyse est offerte.
        </p>
        <Button
          asChild
          className="rounded-lg bg-white px-8 font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          <Link href="/signup">Analyser mon site gratuitement</Link>
        </Button>
      </div>
    </div>
  )
}
