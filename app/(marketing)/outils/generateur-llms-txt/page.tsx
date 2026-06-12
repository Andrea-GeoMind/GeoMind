import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LlmsTxtGenerator } from '@/components/features/marketing/llms-txt-generator'

export const metadata: Metadata = {
  title: 'Générateur llms.txt gratuit — créez votre fichier en 2 minutes',
  description:
    'Outil gratuit et sans inscription : générez le fichier llms.txt de votre site pour vous présenter aux IA (ChatGPT, Perplexity, Claude). Copiez-collez, c\'est en ligne.',
  alternates: { canonical: '/outils/generateur-llms-txt' },
}

export default function LlmsTxtGeneratorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
        Outil gratuit
      </p>
      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Générateur de llms.txt
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Le llms.txt est la carte de visite de votre site pour les IA : qui vous êtes, vos pages
        importantes, comment vous contacter. Remplissez, copiez, placez le fichier à la racine de
        votre site (votresite.fr/llms.txt) — 2 minutes, sans inscription.
      </p>

      <div className="mt-12">
        <LlmsTxtGenerator />
      </div>

      <div className="mt-14 space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-bold text-foreground">Comment installer votre llms.txt</h2>
        <ol className="ml-5 list-decimal space-y-1.5">
          <li>Téléchargez le fichier généré ci-dessus (ou copiez son contenu).</li>
          <li>
            Placez-le à la <strong className="text-foreground">racine</strong> de votre site, au
            même endroit que votre robots.txt. Sur WordPress : via votre hébergeur (FTP ou
            gestionnaire de fichiers), dans le dossier principal du site.
          </li>
          <li>
            Vérifiez en ouvrant <strong className="text-foreground">votresite.fr/llms.txt</strong>{' '}
            dans votre navigateur : si le texte s&apos;affiche, c&apos;est en place.
          </li>
        </ol>
        <p>
          Le llms.txt est un standard récent : toutes les IA ne le lisent pas encore, mais il
          coûte 2 minutes et envoie un signal clair. Pour aller plus loin, lisez notre guide{' '}
          <Link href="/blog/fichiers-qui-parlent-aux-ia" className="font-medium text-primary underline underline-offset-4">
            llms.txt, Schema.org, FAQ : les fichiers qui parlent aux IA
          </Link>
          .
        </p>
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-center shadow-xl shadow-indigo-200">
        <p className="mb-2 text-lg font-bold text-white">
          Le llms.txt n&apos;est qu&apos;une règle parmi 57.
        </p>
        <p className="mb-5 text-sm text-indigo-100">
          Découvrez tout ce qui empêche les IA de vous citer — analyse complète offerte, sans
          carte bancaire.
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
