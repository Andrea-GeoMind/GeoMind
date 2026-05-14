import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — GEOMIND',
  description: 'Politique de confidentialité et traitement des données personnelles de GEOMIND.',
}

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Politique de confidentialité</h1>
      <p className="text-xs text-muted-foreground">Dernière mise à jour : mai 2026</p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement est GEOMIND, micro-entreprise française
          (SIRET : [à compléter]), joignable à <strong>contact@geomind.fr</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">2. Données collectées</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Données de compte</strong> : adresse e-mail, mot de passe hashé (Supabase Auth).
          </li>
          <li>
            <strong>Données d&apos;usage</strong> : URL des sites analysés, résultats d&apos;audits GEO,
            historique des analyses.
          </li>
          <li>
            <strong>Données de facturation</strong> : gérées par Stripe — GEOMIND ne stocke aucune
            donnée de carte bancaire.
          </li>
          <li>
            <strong>Données analytiques</strong> : pages visitées, actions (PostHog), uniquement
            avec votre consentement.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">3. Bases légales</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Exécution du contrat</strong> : données de compte et d&apos;usage.
          </li>
          <li>
            <strong>Obligation légale</strong> : données de facturation — conservation 10 ans.
          </li>
          <li>
            <strong>Consentement</strong> : cookies analytiques PostHog — retirable via la{' '}
            <a href="/legal/cookies" className="underline underline-offset-4 hover:text-foreground">
              page Cookies
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">4. Durées de conservation</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Données de compte : durée de l&apos;abonnement + 3 ans après résiliation.</li>
          <li>Données d&apos;analyse : durée de l&apos;abonnement actif.</li>
          <li>Données de facturation : 10 ans (obligation comptable).</li>
          <li>Logs analytiques : 13 mois maximum (PostHog EU).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">5. Sous-traitants</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Prestataire</th>
                <th className="py-2 pr-4 font-medium">Rôle</th>
                <th className="py-2 font-medium">Localisation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4">Supabase</td>
                <td className="py-2 pr-4">Base de données et authentification</td>
                <td className="py-2">UE (eu-west-1)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Vercel</td>
                <td className="py-2 pr-4">Hébergement</td>
                <td className="py-2">UE</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Stripe</td>
                <td className="py-2 pr-4">Paiement</td>
                <td className="py-2">UE</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Resend</td>
                <td className="py-2 pr-4">E-mails transactionnels</td>
                <td className="py-2">UE</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">PostHog (EU)</td>
                <td className="py-2 pr-4">Analytique produit</td>
                <td className="py-2">UE</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Sentry</td>
                <td className="py-2 pr-4">Monitoring erreurs</td>
                <td className="py-2">UE</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Tous les sous-traitants sont liés par des DPA conformes au RGPD.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">6. Vos droits</h2>
        <p>
          Conformément au RGPD (art. 15 à 22), vous disposez des droits d&apos;accès, rectification,
          effacement, portabilité et opposition. La suppression du compte entraîne la suppression
          en cascade de toutes les données associées.
        </p>
        <p>
          Pour exercer ces droits : <strong>contact@geomind.fr</strong>. Réponse sous 30 jours. En
          cas d&apos;insatisfaction, vous pouvez saisir la{' '}
          <a
            href="https://www.cnil.fr"
            className="underline underline-offset-4 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            CNIL
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">7. Sécurité</h2>
        <p>
          Les données sont chiffrées en transit (TLS) et au repos. L&apos;accès est soumis à des règles
          RLS côté base de données. Les mots de passe ne sont jamais stockés en clair.
        </p>
      </section>
    </>
  )
}
