import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export const LAZY_RETRY_MARKER = 'zap-sucatas:lazy-retry'

function isChunkLoadError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading chunk') ||
    message.includes('chunkloaderror')
  )
}

function shouldRetryChunkLoad() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.sessionStorage.getItem(LAZY_RETRY_MARKER) !== '1'
  } catch {
    return true
  }
}

function markChunkLoadRetry() {
  try {
    window.sessionStorage.setItem(LAZY_RETRY_MARKER, '1')
  } catch {
    // Ignore storage failures; the reload still handles the stale bundle case.
  }
}

function clearChunkLoadRetry() {
  try {
    window.sessionStorage.removeItem(LAZY_RETRY_MARKER)
  } catch {
    // Ignore storage failures.
  }
}

export function lazyWithRetry<T extends ComponentType<object>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory()
      .then((module) => {
        clearChunkLoadRetry()
        return module
      })
      .catch((error) => {
        if (typeof window !== 'undefined' && isChunkLoadError(error) && shouldRetryChunkLoad()) {
          markChunkLoadRetry()
          window.location.reload()
          return new Promise<never>(() => {})
        }

        clearChunkLoadRetry()
        throw error
      }),
  )
}

export { clearChunkLoadRetry, isChunkLoadError, shouldRetryChunkLoad }
