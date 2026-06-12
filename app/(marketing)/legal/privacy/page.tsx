import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — GEOMIND',
  description: 'Politique de confidentialité et traitement des données personnelles de GEOMIND.',
}

export default function PrivacyPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-border pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">Dernière mise à jour : juin 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">1. Responsable du traitement</h2>
        <p className="text-muted-foreground leading-relaxed">
          Le responsable du traitement est GEOMIND, micro-entreprise française
          (SIRET : [à compléter]), joignable à{' '}
          <a
            href="mailto:contact@geomind.fr"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            contact@geomind.fr
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">2. Données collectées</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Données de compte</strong> : adresse e-mail, mot de
            passe hashé (Supabase Auth).
          </li>
          <li>
            <strong className="text-foreground">Données d&apos;usage</strong> : URL des sites analysés,
            résultats d&apos;audits GEO, historique des analyses.
          </li>
          <li>
            <strong className="text-foreground">Données de facturation</strong> : gérées par Stripe —
            GEOMIND ne stocke aucune donnée de carte bancaire.
          </li>
          <li>
            <strong className="text-foreground">Données analytiques</strong> : pages visitées, actions
            (PostHog), uniquement avec votre consentement.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">3. Bases légales</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Exécution du contrat</strong> : données de compte et
            d&apos;usage.
          </li>
          <li>
            <strong className="text-foreground">Obligation légale</strong> : données de facturation —
            conservation 10 ans.
          </li>
          <li>
            <strong className="text-foreground">Consentement</strong> : cookies analytiques PostHog —
            retirable via la{' '}
            <a
              href="/legal/cookies"
              className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
            >
              page Cookies
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">4. Durées de conservation</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Données de compte : durée de l&apos;abonnement + 3 ans après résiliation.</li>
          <li>Données d&apos;analyse : durée de l&apos;abonnement actif.</li>
          <li>Données de facturation : 10 ans (obligation comptable).</li>
          <li>Logs analytiques : 13 mois maximum (PostHog EU).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">5. Sous-traitants</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Prestataire</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Rôle</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Localisation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: 'Supabase', role: 'Base de données et authentification', loc: 'UE (eu-west-1)' },
                { name: 'Vercel', role: 'Hébergement', loc: 'UE' },
                { name: 'Stripe', role: 'Paiement', loc: 'UE' },
                { name: 'Resend', role: 'E-mails transactionnels', loc: 'UE' },
                { name: 'PostHog (EU)', role: 'Analytique produit', loc: 'UE' },
                { name: 'Sentry', role: 'Monitoring erreurs', loc: 'UE' },
              ].map(({ name, role, loc }) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-medium text-foreground">{name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{loc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Tous les sous-traitants sont liés par des DPA conformes au RGPD.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">6. Vos droits</h2>
        <p className="text-muted-foreground leading-relaxed">
          Conformément au RGPD (art. 15 à 22), vous disposez des droits d&apos;accès, rectification,
          effacement, portabilité et opposition. La suppression du compte entraîne la suppression
          en cascade de toutes les données associées.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Pour exercer ces droits :{' '}
          <a
            href="mailto:contact@geomind.fr"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            contact@geomind.fr
          </a>
          . Réponse sous 30 jours. En cas d&apos;insatisfaction, vous pouvez saisir la{' '}
          <a
            href="https://www.cnil.fr"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
            target="_blank"
            rel="noopener noreferrer"
          >
            CNIL
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">7. Sécurité</h2>
        <p className="text-muted-foreground leading-relaxed">
          Les données sont chiffrées en transit (TLS) et au repos. L&apos;accès est soumis à des règles
          RLS côté base de données. Les mots de passe ne sont jamais stockés en clair.
        </p>
      </section>
    </>
  )
}
