import { ExpressAudit } from '@/components/features/marketing/express-audit'
import { ENGINE_COUNT } from '@/lib/ai/connectors/base'

/**
 * Bandeau d'audit express réutilisable — bas d'article de blog et bas de page
 * secteur. Même composant que le hero, posé sur un fond navy autonome pour
 * rester lisible quel que soit le contenu au-dessus.
 */
export function ExpressAuditBand({
  title = 'Et votre site, les IA le citent-elles ?',
  subtitle,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <section className="not-prose my-12">
      <div className="relative overflow-hidden rounded-3xl bg-[#16304B] px-6 py-10 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/3 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
        />
        <div className="relative">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-[#B2C8DE]">
            {subtitle ??
              `Testez votre site en quelques secondes : les vérifications techniques de base, puis ce qu’il faudrait interroger auprès des ${ENGINE_COUNT} IA pour le savoir vraiment.`}
          </p>
          <div className="mt-6">
            <ExpressAudit variant="hero" />
          </div>
        </div>
      </div>
    </section>
  )
}
