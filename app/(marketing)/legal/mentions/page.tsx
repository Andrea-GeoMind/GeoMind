import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — GEOMIND',
  description: 'Mentions légales du site geomind.fr.',
}

export default function MentionsPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-border pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Mentions légales</h1>
        <p className="mt-2 text-xs text-muted-foreground">Dernière mise à jour : juin 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Éditeur du site</h2>
        <p className="text-muted-foreground leading-relaxed">Le site geomind.fr est édité par :</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Dénomination</strong> : GEOMIND
          </li>
          <li>
            <strong className="text-foreground">Statut</strong> : Micro-entrepreneur
          </li>
          <li>
            <strong className="text-foreground">SIRET</strong> : [à compléter après inscription auto-entrepreneur]
          </li>
          <li>
            <strong className="text-foreground">Adresse</strong> : France
          </li>
          <li>
            <strong className="text-foreground">E-mail</strong> :{' '}
            <a
              href="mailto:contact@geomind.fr"
              className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
            >
              contact@geomind.fr
            </a>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Directeur de la publication</h2>
        <p className="text-muted-foreground leading-relaxed">Andrea Schwertz</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Hébergement</h2>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Vercel Inc.</strong>
          </li>
          <li>340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</li>
          <li>
            <a
              href="https://vercel.com"
              className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Les données sont stockées sur des serveurs PostgreSQL hébergés par Supabase (région
          eu-west-1, Union Européenne), conformément au RGPD.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Propriété intellectuelle</h2>
        <p className="text-muted-foreground leading-relaxed">
          L&apos;ensemble des contenus présents sur geomind.fr (textes, graphismes, logo, code) sont la
          propriété exclusive de GEOMIND et sont protégés par le droit d&apos;auteur. Toute reproduction
          ou représentation sans autorisation expresse est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Limitation de responsabilité</h2>
        <p className="text-muted-foreground leading-relaxed">
          L&apos;Éditeur s&apos;efforce de maintenir les informations publiées à jour et exactes, mais ne peut
          garantir leur exhaustivité. Sa responsabilité ne peut être engagée en cas d&apos;inexactitude.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Médiation de la consommation</h2>
        <p className="text-muted-foreground leading-relaxed">
          En cas de litige non résolu à l&apos;amiable, le Client peut recourir à un médiateur agréé.
          Liste disponible sur{' '}
          <a
            href="https://www.economie.gouv.fr/mediation-conso"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
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
