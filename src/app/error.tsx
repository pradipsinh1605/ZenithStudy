'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-6">😕</div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Kuch galat ho gaya
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Ek unexpected error aaya. Aap try kar sakte hain page reload karke.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted px-3 py-1 rounded">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Dobara try karo
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Home par jao
          </a>
        </div>
      </div>
    </div>
  )
}
