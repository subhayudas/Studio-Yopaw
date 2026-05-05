export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      {/* Content layer */}
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 10 }}>

        {/* Navigation */}
        <nav className="flex flex-row justify-between items-center px-8 py-6 w-full max-w-7xl mx-auto">
          <span
            className="text-3xl tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif", color: 'hsl(var(--foreground))' }}
          >
            Velorah<sup className="text-xs">®</sup>
          </span>

          <ul className="hidden md:flex gap-8 items-center list-none m-0 p-0">
            {(['Home', 'Studio', 'About', 'Journal', 'Reach Us'] as const).map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-sm transition-colors no-underline"
                  style={{
                    color: label === 'Home'
                      ? 'hsl(var(--foreground))'
                      : 'hsl(var(--muted-foreground))',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                  onMouseLeave={e => (e.currentTarget.style.color = label === 'Home' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))')}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <button
            className="liquid-glass rounded-full px-6 py-2.5 text-sm transition-transform hover:scale-[1.03] cursor-pointer"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            Begin Journey
          </button>
        </nav>

        {/* Hero */}
        <section
          className="flex flex-col items-center text-center px-6 flex-1 justify-center"
          style={{ paddingTop: '90px', paddingBottom: '90px' }}
        >
          <h1
            className="animate-fade-rise font-normal"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              lineHeight: '0.95',
              letterSpacing: '-2.46px',
              maxWidth: '80rem',
              color: 'hsl(var(--foreground))',
              margin: 0,
            }}
          >
            Where{' '}
            <em className="not-italic" style={{ color: 'hsl(var(--muted-foreground))' }}>dreams</em>
            {' '}rise{' '}
            <em className="not-italic" style={{ color: 'hsl(var(--muted-foreground))' }}>through the silence.</em>
          </h1>

          <p
            className="animate-fade-rise-delay leading-relaxed"
            style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
              maxWidth: '42rem',
              marginTop: '2rem',
            }}
          >
            We're designing tools for deep thinkers, bold creators, and quiet rebels.
            Amid the chaos, we build digital spaces for sharp focus and inspired work.
          </p>

          <button
            className="animate-fade-rise-delay-2 liquid-glass rounded-full text-base transition-transform hover:scale-[1.03] cursor-pointer"
            style={{
              color: 'hsl(var(--foreground))',
              paddingLeft: '3.5rem',
              paddingRight: '3.5rem',
              paddingTop: '1.25rem',
              paddingBottom: '1.25rem',
              marginTop: '3rem',
            }}
          >
            Begin Journey
          </button>
        </section>
      </div>
    </div>
  )
}
