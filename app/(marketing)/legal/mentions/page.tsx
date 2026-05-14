import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — GEOMIND',
  description: 'Mentions légales du site geomind.fr.',
}

export default function MentionsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Mentions légales</h1>
      <p className="text-xs text-muted-foreground">Dernière mise à jour : mai 2026</p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Éditeur du site</h2>
        <p>Le site geomind.fr est édité par :</p>
        <ul className="space-y-1">
          <li><strong>Dénomination</strong> : GEOMIND</li>
          <li><strong>Statut</strong> : Micro-entrepreneur</li>
          <li><strong>SIRET</strong> : [à compléter après inscription auto-entrepreneur]</li>
          <li><strong>Adresse</strong> : France</li>
          <li><strong>E-mail</strong> : contact@geomind.fr</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Directeur de la publication</h2>
        <p>Andrea Schwertz</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Hébergement</h2>
        <ul className="space-y-1">
          <li><strong>Vercel Inc.</strong></li>
          <li>340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</li>
          <li>
            <a
              href="https://vercel.com"
              className="underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com
            </a>
          </li>
        </ul>
        <p>
          Les données sont stockées sur des serveurs PostgreSQL hébergés par Supabase (région
          eu-west-1, Union Européenne), conformément au RGPD.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur geomind.fr (textes, graphismes, logo, code) sont la
          propriété exclusive de GEOMIND et sont protégés par le droit d&apos;auteur. Toute reproduction
          ou représentation sans autorisation expresse est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Limitation de responsabilité</h2>
        <p>
          L&apos;Éditeur s&apos;efforce de maintenir les informations publiées à jour et exactes, mais ne peut
          garantir leur exhaustivité. Sa responsabilité ne peut être engagée en cas d&apos;inexactitude.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Médiation de la consommation</h2>
        <p>
          En cas de litige non résolu à l&apos;amiable, le Client peut recourir à un médiateur agréé.
          Liste disponible sur{' '}
          <a
            href="https://www.economie.gouv.fr/mediation-conso"
            className="underline underline-offset-4 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            economie.gouv.fr
          </a>
          .
        </p>
      </section>
    </>
  )
}
