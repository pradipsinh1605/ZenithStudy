'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#fafafa',
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              App crash ho gaya
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Ek serious error aaya. Please page refresh karo.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Refresh karo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
