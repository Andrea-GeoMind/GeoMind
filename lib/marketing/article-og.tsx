import { ImageResponse } from 'next/og'

/**
 * Générateur d'image Open Graph par article de blog (1200×630).
 * Chaque app/(marketing)/blog/<slug>/opengraph-image.tsx réexporte
 * size/contentType/alt et appelle renderArticleOgImage(titre).
 *
 * GEO : une image dédiée par article améliore l'aperçu de lien partagé
 * dans les messageries et certaines réponses IA (vs image générique du site).
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

export function renderArticleOgImage(title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #16304B 0%, #2A5483 50%, #31649B 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 13,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            G
          </div>
          GEOMIND
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.12,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 28, opacity: 0.82 }}>Guide GEO · geomind.fr</div>
      </div>
    ),
    OG_SIZE
  )
}
