// Retries `fn` up to `retries` times on transient errors.
// Stops immediately on 401/403 (non-retryable auth errors).
// Uses exponential backoff between attempts.

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return true
  const msg = err.message
  return (
    !msg.includes('401') &&
    !msg.includes('403') &&
    !msg.includes('Unauthorized') &&
    !msg.includes('Forbidden')
  )
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isRetryable(err)) throw err
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
      }
    }
  }
  throw lastErr
}
