import * as Sentry from '@sentry/nextjs'
import { scrubChantierTokens } from '@/lib/chantiers/scrub'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  environment: process.env.NODE_ENV,
  // Le lien secret de l'espace chantier ne doit jamais partir chez Sentry
  beforeSend: (event) => scrubChantierTokens(event),
  beforeSendTransaction: (event) => scrubChantierTokens(event),
  beforeBreadcrumb: (crumb) => scrubChantierTokens(crumb),
})
