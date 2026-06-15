import { ImageResponse } from 'next/og'

/**
 * Image Open Graph générée dynamiquement (1200×630) — partages réseaux
 * sociaux, messageries et aperçus de liens dans les réponses IA.
 */
export const runtime = 'edge'
export const alt = 'GEOMIND — Êtes-vous cité par ChatGPT ? Auditez votre visibilité IA'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
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
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            G
          </div>
          GEOMIND
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          Vos clients cherchent dans ChatGPT. Êtes-vous trouvable ?
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            opacity: 0.85,
            maxWidth: 900,
          }}
        >
          Audit de visibilité IA pour TPE &amp; PME — ChatGPT, Perplexity, Gemini, Claude
        </div>
      </div>
    ),
    size
  )
}
