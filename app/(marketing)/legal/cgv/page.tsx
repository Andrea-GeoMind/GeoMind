import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — GEOMIND',
  description: 'Conditions Générales de Vente du service GEOMIND.',
}

export default function CgvPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-border pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Conditions Générales de Vente
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">Dernière mise à jour : juin 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">1. Objet</h2>
        <p className="text-muted-foreground leading-relaxed">
          Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
          entre GEOMIND (ci-après « l&apos;Éditeur ») et toute personne physique ou morale souscrivant à
          un abonnement payant via le site geomind.fr (ci-après « le Client »).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">2. Offres et tarifs</h2>
        <p className="text-muted-foreground leading-relaxed">GEOMIND propose les abonnements suivants :</p>
        <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Plan Gratuit</strong> — sans frais : 1 site, 1
            analyse complète offerte.
          </li>
          <li>
            <strong className="text-foreground">Plan Solo</strong> — 19 € HT/mois : 2 sites, 5 000
            crédits mensuels.
          </li>
          <li>
            <strong className="text-foreground">Plan Pro</strong> — 59 € HT/mois : 5 sites, 20 000
            crédits mensuels.
          </li>
          <li>
            <strong className="text-foreground">Plan Business</strong> — 149 € HT/mois : 15 sites,
            80 000 crédits mensuels.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Les fonctionnalités sont mesurées en crédits : à titre indicatif, une analyse complète
          consomme 400 crédits, un message au Coach IA 10 à 30 crédits, une recommandation complète
          50 crédits. Les crédits mensuels se renouvellent à chaque période de facturation et ne se
          reportent pas. Des packs de crédits additionnels (paiement unique, sans expiration)
          peuvent être proposés. La facturation annuelle bénéficie d&apos;une remise de 20 %.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Les tarifs peuvent évoluer ; le Client en est informé par e-mail avec un préavis de 30 jours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">2 bis. Essai gratuit</h2>
        <p className="text-muted-foreground leading-relaxed">
          Le plan Pro inclut une période d&apos;essai gratuite de 7 jours, réservée à la première
          souscription payante d&apos;un compte. Une carte bancaire est requise à la souscription ;
          aucun prélèvement n&apos;est effectué pendant l&apos;essai. Sauf annulation avant la fin
          de la période d&apos;essai (depuis Paramètres → Facturation), l&apos;abonnement démarre
          automatiquement au tarif en vigueur. L&apos;annulation pendant l&apos;essai est sans
          frais et prend effet immédiatement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">3. Commande et souscription</h2>
        <p className="text-muted-foreground leading-relaxed">
          La souscription est effectuée en ligne via geomind.fr. Le contrat est conclu dès validation
          du paiement par Stripe. Une confirmation est adressée par e-mail au Client.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">4. Paiement</h2>
        <p className="text-muted-foreground leading-relaxed">
          Le règlement s&apos;effectue par carte bancaire via Stripe. Les données de paiement ne sont pas
          stockées par GEOMIND. En cas d&apos;échec, l&apos;abonnement est suspendu après un délai de grâce de
          7 jours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">5. Durée et résiliation</h2>
        <p className="text-muted-foreground leading-relaxed">
          L&apos;abonnement est renouvelé automatiquement. Le Client peut résilier à tout moment depuis
          Paramètres → Facturation. La résiliation prend effet à la fin de la période en cours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">6. Droit de rétractation</h2>
        <p className="text-muted-foreground leading-relaxed">
          Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne
          s&apos;applique pas aux services démarrés avec l&apos;accord exprès du consommateur. Toutefois,
          l&apos;Éditeur propose un remboursement au prorata sur demande dans les 7 jours suivant la
          première souscription.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">7. Responsabilité</h2>
        <p className="text-muted-foreground leading-relaxed">
          Les scores et recommandations GEOMIND sont indicatifs et ne garantissent pas de résultats.
          La responsabilité de l&apos;Éditeur est limitée aux sommes perçues au cours des 12 derniers mois.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">8. Droit applicable</h2>
        <p className="text-muted-foreground leading-relaxed">
          Les présentes CGV sont soumises au droit français. En cas de litige non résolu à l&apos;amiable,
          les tribunaux de Paris sont compétents.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">9. Contact</h2>
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
