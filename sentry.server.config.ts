import * as Sentry from '@sentry/nextjs'
import { scrubChantierTokens } from '@/lib/chantiers/scrub'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  environment: process.env.NODE_ENV,
  // Le lien secret de l'espace chantier ne doit jamais partir chez Sentry
  beforeSend: (event) => scrubChantierTokens(event),
  beforeSendTransaction: (event) => scrubChantierTokens(event),
})
