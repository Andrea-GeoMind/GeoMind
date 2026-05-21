import type { Metadata } from 'next'
import { CookieConsentButtons } from '@/components/cookie-consent-buttons'

export const metadata: Metadata = {
  title: 'Politique de cookies — GEOMIND',
  description: 'Politique de gestion des cookies sur geomind.fr.',
}

export default function CookiesPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-border pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Politique de cookies
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">Dernière mise à jour : mai 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Qu&apos;est-ce qu&apos;un cookie ?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d&apos;un
          site. Il permet de mémoriser des informations entre deux visites ou sessions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Cookies utilisés sur geomind.fr</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Cookie</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Durée</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Finalité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-foreground">sb-*</td>
                <td className="px-4 py-3 text-muted-foreground">Essentiel</td>
                <td className="px-4 py-3 text-muted-foreground">Session / 1 an</td>
                <td className="px-4 py-3 text-muted-foreground">Authentification Supabase</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-foreground">cookie-consent</td>
                <td className="px-4 py-3 text-muted-foreground">Essentiel</td>
                <td className="px-4 py-3 text-muted-foreground">Session</td>
                <td className="px-4 py-3 text-muted-foreground">Mémorise votre choix de consentement</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-foreground">ph_*</td>
                <td className="px-4 py-3 text-muted-foreground">Analytique</td>
                <td className="px-4 py-3 text-muted-foreground">13 mois</td>
                <td className="px-4 py-3 text-muted-foreground">
                  PostHog — mesure d&apos;audience et amélioration produit
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Cookies essentiels</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ces cookies sont indispensables au fonctionnement du service et ne nécessitent pas votre
          consentement au titre de l&apos;article 82 de la loi Informatique et Libertés.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Cookies analytiques (PostHog)</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ces cookies mesurent l&apos;audience et améliorent le produit. Ils sont stockés sur les serveurs
          européens de PostHog et ne sont activés qu&apos;avec votre consentement explicite. Aucune donnée
          n&apos;est vendue à des tiers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Gérer vos préférences</h2>
        <p className="text-muted-foreground leading-relaxed">
          Vous pouvez modifier votre choix à tout moment :
        </p>
        <CookieConsentButtons />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          Pour toute question :{' '}
          <a
            href="mailto:contact@geomind.fr"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            contact@geomind.fr
          </a>
        </p>
      </section>
    </>
  )
}
