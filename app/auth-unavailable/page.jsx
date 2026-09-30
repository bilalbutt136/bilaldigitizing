export const metadata = {
  title: 'Authentication temporarily unavailable | BDigitizing'
};

function getSafeRedirect(value) {
  const redirect = typeof value === 'string' ? value.trim() : '';
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }
  if (redirect.startsWith('/auth-unavailable')) {
    return '/';
  }
  return redirect;
}

export default async function AuthUnavailablePage({ searchParams }) {
  const params = await searchParams;
  const retryPath = getSafeRedirect(params?.redirect);

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.25rem',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
        color: '#0f172a'
      }}
    >
      <section
        aria-labelledby="auth-unavailable-title"
        style={{
          width: 'min(100%, 520px)',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 4vw, 2rem)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
          textAlign: 'center'
        }}
      >
        <img
          src="/logo-small.png"
          alt="BDigitizing"
          width="54"
          height="54"
          style={{ objectFit: 'contain', marginBottom: '0.85rem' }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            background: '#fff7ed',
            color: '#c2410c',
            border: '1px solid #fed7aa',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '0.85rem'
          }}
        >
          Temporary connection issue
        </div>

        <h1
          id="auth-unavailable-title"
          style={{
            margin: 0,
            fontSize: 'clamp(1.45rem, 5vw, 2rem)',
            lineHeight: 1.2,
            color: '#0f172a'
          }}
        >
          We could not verify your session
        </h1>

        <p
          style={{
            margin: '0.85rem auto 0',
            maxWidth: '430px',
            color: '#64748b',
            fontSize: '0.95rem',
            lineHeight: 1.65
          }}
        >
          Your account has not been signed out. The authentication service did not respond in time.
          Please try the page again.
        </p>

        <div
          style={{
            marginTop: '1.35rem',
            display: 'flex',
            gap: '0.65rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <a
            href={retryPath}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              background: '#ea580c',
              color: '#ffffff',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(234, 88, 12, 0.22)'
            }}
          >
            Try again
          </a>

          <a
            href="/"
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 800,
              textDecoration: 'none',
              border: '1px solid #cbd5e1'
            }}
          >
            Go to homepage
          </a>
        </div>

        <p
          style={{
            margin: '1rem 0 0',
            color: '#94a3b8',
            fontSize: '0.78rem',
            lineHeight: 1.5
          }}
        >
          If this page appears again, wait a few seconds and retry. Your existing browser session is preserved.
        </p>
      </section>
    </main>
  );
}
