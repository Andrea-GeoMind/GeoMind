import type { Metadata } from 'next'
import { CookieConsentButtons } from '@/components/cookie-consent-buttons'

export const metadata: Metadata = {
  title: 'Politique de cookies — GEOMIND',
  description: 'Politique de gestion des cookies sur geomind.fr.',
}

export default function CookiesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Politique de cookies</h1>
      <p className="text-xs text-muted-foreground">Dernière mise à jour : mai 2026</p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Qu&apos;est-ce qu&apos;un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d&apos;un
          site. Il permet de mémoriser des informations entre deux visites ou sessions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Cookies utilisés sur geomind.fr</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Cookie</th>
                <th className="py-2 pr-4 font-medium">Catégorie</th>
                <th className="py-2 pr-4 font-medium">Durée</th>
                <th className="py-2 font-medium">Finalité</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4 font-mono">sb-*</td>
                <td className="py-2 pr-4">Essentiel</td>
                <td className="py-2 pr-4">Session / 1 an</td>
                <td className="py-2">Authentification Supabase</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">cookie-consent</td>
                <td className="py-2 pr-4">Essentiel</td>
                <td className="py-2 pr-4">Session</td>
                <td className="py-2">Mémorise votre choix de consentement</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">ph_*</td>
                <td className="py-2 pr-4">Analytique</td>
                <td className="py-2 pr-4">13 mois</td>
                <td className="py-2">PostHog — mesure d&apos;audience et amélioration produit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Cookies essentiels</h2>
        <p>
          Ces cookies sont indispensables au fonctionnement du service et ne nécessitent pas votre
          consentement au titre de l&apos;article 82 de la loi Informatique et Libertés.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Cookies analytiques (PostHog)</h2>
        <p>
          Ces cookies mesurent l&apos;audience et améliorent le produit. Ils sont stockés sur les serveurs
          européens de PostHog et ne sont activés qu&apos;avec votre consentement explicite. Aucune donnée
          n&apos;est vendue à des tiers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Gérer vos préférences</h2>
        <p>Vous pouvez modifier votre choix à tout moment :</p>
        <CookieConsentButtons />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Contact</h2>
        <p>
          Pour toute question : <strong>contact@geomind.fr</strong>
        </p>
      </section>
    </>
  )
}
