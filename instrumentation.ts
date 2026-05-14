/**
 * instrumentation.ts
 *
 * Next.js 15 instrumentation hook — loads Sentry on server/edge startup.
 * This file is automatically imported by Next.js via the experimental.instrumentation
 * setting in next.config.mjs.
 *
 * Register function: called on server startup to initialize Sentry server config.
 * onRequestError: called when an unhandled request error occurs (catches 500s).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

type InstrumentationOnRequestError = (
  error: unknown,
  request: Readonly<{
    path: string
    method: string
    headers: NodeJS.Dict<string | string[]>
  }>,
  context: Readonly<{
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
  }>
) => void | Promise<void>

export const onRequestError: InstrumentationOnRequestError = async (err, request, context) => {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request, context)
}
