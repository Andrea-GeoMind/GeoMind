import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — GEOMIND',
  description: 'Conditions Générales de Vente du service GEOMIND.',
}

export default function CgvPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Conditions Générales de Vente</h1>
      <p className="text-xs text-muted-foreground">Dernière mise à jour : mai 2026</p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">1. Objet</h2>
        <p>
          Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
          entre GEOMIND (ci-après « l&apos;Éditeur ») et toute personne physique ou morale souscrivant à
          un abonnement payant via le site geomind.fr (ci-après « le Client »).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">2. Offres et tarifs</h2>
        <p>GEOMIND propose les abonnements suivants :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Plan Gratuit</strong> — 1 site, 1 analyse/mois, sans frais.</li>
          <li><strong>Plan Pro</strong> — 49 € HT/mois, 3 sites, 10 analyses/mois.</li>
          <li><strong>Plan Business</strong> — 149 € HT/mois, 10 sites, analyses illimitées.</li>
        </ul>
        <p>
          Les tarifs peuvent évoluer ; le Client en est informé par e-mail avec un préavis de 30 jours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">3. Commande et souscription</h2>
        <p>
          La souscription est effectuée en ligne via geomind.fr. Le contrat est conclu dès validation
          du paiement par Stripe. Une confirmation est adressée par e-mail au Client.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">4. Paiement</h2>
        <p>
          Le règlement s&apos;effectue par carte bancaire via Stripe. Les données de paiement ne sont pas
          stockées par GEOMIND. En cas d&apos;échec, l&apos;abonnement est suspendu après un délai de grâce de
          7 jours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">5. Durée et résiliation</h2>
        <p>
          L&apos;abonnement est renouvelé automatiquement. Le Client peut résilier à tout moment depuis
          Paramètres → Facturation. La résiliation prend effet à la fin de la période en cours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">6. Droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne
          s&apos;applique pas aux services démarrés avec l&apos;accord exprès du consommateur. Toutefois,
          l&apos;Éditeur propose un remboursement au prorata sur demande dans les 7 jours suivant la
          première souscription.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">7. Responsabilité</h2>
        <p>
          Les scores et recommandations GEOMIND sont indicatifs et ne garantissent pas de résultats.
          La responsabilité de l&apos;Éditeur est limitée aux sommes perçues au cours des 12 derniers mois.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">8. Droit applicable</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige non résolu à l&apos;amiable,
          les tribunaux de Paris sont compétents.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">9. Contact</h2>
        <p>
          Pour toute question : <strong>contact@geomind.fr</strong>
        </p>
      </section>
    </>
  )
}
