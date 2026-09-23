import type { GeoTool } from '@/lib/marketing/geo-tools'

/**
 * Corps d'une fiche outil — rendu à partir de lib/marketing/geo-tools.ts.
 *
 * Utilisé par l'article /blog/meilleurs-outils-geo-2026 (une fiche par outil)
 * et disponible pour toute autre page qui présente un outil. Le titre (H2) et
 * les phrases de synthèse propres à une page restent hors du composant : ici
 * on ne rend que les faits du registre.
 */
export function ToolFiche({ tool }: { tool: GeoTool }) {
  return (
    <>
      <p>
        <strong>Prix.</strong> {tool.priceDetail}
      </p>
      <p>
        <strong>Moteurs.</strong> {tool.engineDetail}
      </p>
      <p>
        <strong>Langue et cible.</strong> {tool.languageDetail} {tool.audienceDetail}
      </p>

      {tool.strengths.length === 1 ? (
        <p>
          <strong>Point fort.</strong> {tool.strengths[0]}
        </p>
      ) : (
        <>
          <p>
            <strong>Points forts.</strong>
          </p>
          <ul>
            {tool.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      )}

      {tool.weaknesses.length === 1 ? (
        <p>
          <strong>Point faible.</strong> {tool.weaknesses[0]}
        </p>
      ) : (
        <>
          <p>
            <strong>Points faibles.</strong> Plusieurs, et il faut les lire avant de choisir.
          </p>
          <ul>
            {tool.weaknesses.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
