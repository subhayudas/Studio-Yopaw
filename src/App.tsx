import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── SVG Icons ──────────────────────────────────────────────

function PawIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="50" cy="72" rx="24" ry="20" />
      <ellipse cx="22" cy="48" rx="12" ry="14" />
      <ellipse cx="78" cy="48" rx="12" ry="14" />
      <ellipse cx="37" cy="28" rx="10" ry="12" />
      <ellipse cx="63" cy="28" rx="10" ry="12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

// ── Custom Hook ────────────────────────────────────────────

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Static Data ────────────────────────────────────────────

const CLASSES = [
  {
    title: 'Puppy Vinyasa',
    duration: '60 min',
    image: '/IMG_0642.webp',
    description: 'A flowing sequence guided by adorable pups. Build strength and flexibility while puppies weave playfully between poses.',
  },
  {
    title: 'Mindful Paws',
    duration: '45 min',
    image: '/IMG_1468.webp',
    description: 'Slow, meditative movement paired with puppy cuddle time. Perfect for beginners seeking calm and genuine connection.',
  },
  {
    title: 'Power Flow with Pups',
    duration: '75 min',
    image: '/IMG_2299_2.webp',
    description: 'A challenging flow for experienced practitioners. Energetic puppies keep the spirit high and hearts full.',
  },
]

const STATS = [
  { value: 500, suffix: '+', label: 'Happy Pups' },
  { value: 4,   suffix: '',  label: 'Years of Joy' },
  { value: 50,  suffix: '+', label: 'Classes Monthly' },
  { value: 100, suffix: '%', label: 'Tail Wags Guaranteed' },
]

const GALLERY = [
  { src: '/IMG_7546.webp',                                         alt: 'Studio Yopaw session',   tall: true  },
  { src: '/IMG_7268_43334cab-c14c-4b05-b4b9-497a9fcd7f92.webp',  alt: 'Class in session',       tall: false },
  { src: '/IMG_7478_3c7b739e-7a8c-43b3-b104-99f3db44a731.webp',  alt: 'Happy pup moment',       tall: false },
  { src: '/IMG_9045_b027fb31-b966-46ee-ac10-47bafc1ef696.webp',  alt: 'Yoga flow with puppies', tall: false },
  { src: '/IMG_1167_ff8c28e8-ef39-491c-bf7c-ae0caa5fda75.webp',  alt: 'Studio highlight',       tall: false },
]

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    since: 'Pup parent since 2022',
    quote: "I've tried every yoga studio in the city, but nothing compares to the pure joy of practicing with puppies. It completely transformed my relationship with mindfulness.",
    rating: 5,
  },
  {
    name: 'Jamie L.',
    since: 'Pup parent since 2021',
    quote: "The instructors are incredible, the puppies are adorable, and the atmosphere is so welcoming. It's genuinely the highlight of my week, every single week.",
    rating: 5,
  },
  {
    name: 'Priya K.',
    since: 'Pup parent since 2023',
    quote: "As someone who struggles with anxiety, puppy yoga has been genuinely therapeutic. The combination of mindful movement and puppy cuddles is simply unbeatable.",
    rating: 5,
  },
]

const MARQUEE = [
  '🐾 Puppy Yoga', '·', 'Mindful Movement', '·', 'Happy Tails', '·',
  'Find Your Flow', '·', 'Joy & Breath', '·', 'Wag More Worry Less', '·',
  "Adopt Don't Shop", '·', 'Namaste & Play', '·',
]

// ── Sections ───────────────────────────────────────────────

function Navbar({ scrolled }: { scrolled: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="#hero" className="navbar-logo">
            <PawIcon size={26} className="logo-paw" />
            Studio Yopaw
          </a>
          <ul className="navbar-links">
            <li><a href="#about">About</a></li>
            <li><a href="#classes">Classes</a></li>
            <li><a href="#gallery">Gallery</a></li>
          </ul>
          <div className="navbar-cta">
            <a href="#book" className="btn-primary">Book a Session</a>
          </div>
          <button
            className="hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#about"   onClick={() => setMenuOpen(false)}>About</a>
          <a href="#classes" onClick={() => setMenuOpen(false)}>Classes</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="#book"
            className="btn-primary"
            style={{ marginTop: 8, textAlign: 'center' }}
            onClick={() => setMenuOpen(false)}
          >
            Book a Session
          </a>
        </div>
      )}
    </>
  )
}

function HeroSection() {
  return (
    <section className="hero-section" id="hero">
      <video
        autoPlay muted loop playsInline
        className="hero-video"
        src="/182991340eeb459d952466dcb9f2d778.mp4"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">🐾 Est. 2020 · New York City</div>
        <h1 className="hero-title">
          Where Puppies & People<br />Find Their <em>Flow</em>
        </h1>
        <p className="hero-sub">
          Mindful movement, unconditional love. Our puppy yoga classes bring joy, calm,
          and four-legged companionship to your practice.
        </p>
        <div className="hero-ctas">
          <a href="#book"    className="btn-primary btn-lg">Book a Session</a>
          <a href="#classes" className="btn-ghost   btn-lg">Our Classes</a>
        </div>
      </div>
      <div className="hero-scroll">
        <span>Scroll</span>
        <div className="scroll-chevron" />
      </div>
    </section>
  )
}

function MarqueeTicker() {
  const doubled = [...MARQUEE, ...MARQUEE]
  return (
    <div className="marquee-wrapper" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item">{item}</span>
        ))}
      </div>
    </div>
  )
}

function AboutSection() {
  const { ref, inView } = useInView(0.2)
  return (
    <section className="about-section" id="about">
      <div className={`about-inner${inView ? ' visible' : ''}`} ref={ref}>
        <div className="about-text">
          <span className="section-badge">Our Story</span>
          <h2>Yoga. Puppies.<br />Pure Happiness.</h2>
          <p>
            Studio Yopaw was born from a simple belief: everything is better with a puppy.
            We've combined the ancient practice of yoga with the healing power of puppy love
            to create a one-of-a-kind wellness experience.
          </p>
          <p>
            Each class is led by certified yoga instructors alongside specially trained,
            socialized puppies from local shelters — giving every pup a chance to find
            their forever home.
          </p>
          <a href="#classes" className="link-arrow">Explore our classes →</a>
        </div>
        <div className="about-image">
          <img src="/IMG_5574.webp" alt="Studio Yopaw puppy yoga session" />
          <div className="paw-float paw-float-1"><PawIcon size={46} /></div>
          <div className="paw-float paw-float-2"><PawIcon size={32} /></div>
          <div className="paw-float paw-float-3"><PawIcon size={22} /></div>
        </div>
      </div>
    </section>
  )
}

function ClassesSection() {
  const { ref, inView } = useInView(0.12)
  return (
    <section className="classes-section" id="classes">
      <div className="section-header">
        <span className="section-badge">What We Offer</span>
        <h2>Find Your Perfect Flow</h2>
        <p>Three unique classes designed for all levels — each one made better by the puppies.</p>
      </div>
      <div className={`classes-grid${inView ? ' visible' : ''}`} ref={ref}>
        {CLASSES.map((cls, i) => (
          <div
            key={cls.title}
            className="class-card"
            style={{ transitionDelay: `${i * 0.13}s` }}
          >
            <div className="card-image">
              <img src={cls.image} alt={cls.title} loading="lazy" />
              <span className="duration-badge">{cls.duration}</span>
            </div>
            <div className="card-body">
              <h3>{cls.title}</h3>
              <p>{cls.description}</p>
              <a href="#book" className="link-arrow">Reserve a spot →</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const steps = 60
          const duration = 1600
          const increment = value / steps
          let current = 0
          const id = setInterval(() => {
            current += increment
            if (current >= value) { setCount(value); clearInterval(id) }
            else setCount(Math.floor(current))
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div className="stat-item" ref={ref}>
      <span className="stat-value">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function StatsBar() {
  return (
    <div className="stats-bar">
      {STATS.map(s => <StatCounter key={s.label} {...s} />)}
    </div>
  )
}

function IllustrationSection() {
  return (
    <section className="illustration-section">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`float-paw fp-${i}`}>
          <PawIcon size={20} />
        </div>
      ))}

      <div className="illus-inner">
        <div className="illus-content">
          <span className="section-badge badge-light">The Magic</span>
          <h2>Your Mat,<br />Their <em>World</em></h2>
          <p>
            There's something transformative about practicing yoga surrounded by pure,
            unconditional joy. Puppies have no ego, no judgment — just love, curiosity,
            and the occasional snooze on your yoga mat.
          </p>
          <p>
            Every session, our shelter pups bring their whole hearts to the studio.
            And every session, something remarkable happens: you do too.
          </p>
          <a href="#book" className="btn-primary btn-lg">Experience It</a>
        </div>

        <div className="illus-svg-wrapper">
          <svg viewBox="0 0 360 300" className="yoga-illustration" xmlns="http://www.w3.org/2000/svg">
            {/* Yoga mat */}
            <ellipse cx="180" cy="278" rx="145" ry="13" fill="rgba(74,107,80,0.3)" />
            <rect x="55" y="266" width="250" height="12" rx="6" fill="rgba(74,107,80,0.18)" />

            {/* Person in downward dog — inverted V shape */}
            {/* Back arm & leg (depth/shadow) */}
            <line x1="180" y1="90" x2="102" y2="226" stroke="rgba(180,168,155,0.65)" strokeWidth="11" strokeLinecap="round" />
            <line x1="180" y1="90" x2="300" y2="220" stroke="rgba(180,168,155,0.65)" strokeWidth="11" strokeLinecap="round" />
            {/* Front arm (left) */}
            <line x1="180" y1="90" x2="72" y2="218" stroke="#F0EBE3" strokeWidth="14" strokeLinecap="round" />
            {/* Front leg (right) */}
            <line x1="180" y1="90" x2="284" y2="214" stroke="#F0EBE3" strokeWidth="14" strokeLinecap="round" />

            {/* Feet */}
            <ellipse cx="282" cy="218" rx="15" ry="8" fill="#F0D5B5" />
            <ellipse cx="298" cy="224" rx="11" ry="6" fill="#DFC09A" opacity="0.75" />
            {/* Hands */}
            <circle cx="71"  cy="219" r="11" fill="#F0D5B5" />
            <circle cx="101" cy="228" r="8"  fill="#DFC09A" opacity="0.75" />

            {/* Head (hanging between arms) */}
            <circle cx="55" cy="196" r="25" fill="#F0D5B5" />
            {/* Hair */}
            <ellipse cx="55" cy="178" rx="25" ry="15" fill="#7A5A3A" />
            {/* Face */}
            <circle cx="47" cy="197" r="3"  fill="#4A3520" />
            <circle cx="62" cy="199" r="3"  fill="#4A3520" />
            <path d="M48 207 Q55 213 62 207" stroke="#6B4A30" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Hip apex highlight */}
            <circle cx="180" cy="90" r="6" fill="rgba(240,235,227,0.35)" />

            {/* ── Puppy on back at hip apex ── */}
            {/* Body */}
            <ellipse cx="180" cy="67" rx="31" ry="21" fill="#C4895A" />
            {/* Head (facing left toward person's head) */}
            <circle cx="153" cy="51" r="23" fill="#C4895A" />
            {/* Muzzle */}
            <ellipse cx="140" cy="59" rx="11" ry="9" fill="#A87040" />
            {/* Ears */}
            <ellipse cx="146" cy="33" rx="9"  ry="15" fill="#9E6230" transform="rotate(-18 146 33)" />
            <ellipse cx="168" cy="31" rx="9"  ry="15" fill="#9E6230" transform="rotate(12 168 31)" />
            {/* Eyes */}
            <circle cx="147" cy="47" r="5.5" fill="#1C1C1C" />
            <circle cx="162" cy="45" r="5.5" fill="#1C1C1C" />
            {/* Eye shine */}
            <circle cx="148" cy="46" r="2"   fill="white" />
            <circle cx="163" cy="44" r="2"   fill="white" />
            {/* Nose */}
            <ellipse cx="140" cy="57" rx="5" ry="4" fill="#5A2A2A" />
            {/* Tongue */}
            <path d="M136 63 Q140 71 144 63" stroke="#D44040" strokeWidth="2.5" fill="#D44040" strokeLinecap="round" />
            {/* Hanging paws */}
            <line x1="163" y1="84" x2="158" y2="103" stroke="#9E6230" strokeWidth="9" strokeLinecap="round" />
            <circle cx="157" cy="105" r="5.5" fill="#854F20" />
            <line x1="196" y1="87" x2="193" y2="106" stroke="#9E6230" strokeWidth="9" strokeLinecap="round" />
            <circle cx="192" cy="108" r="5.5" fill="#854F20" />

            {/* Wagging tail (animated via CSS .tail-group) */}
            <g className="tail-group">
              <path
                d="M208 62 Q222 47 226 32 Q230 18 221 13"
                stroke="#C4895A" strokeWidth="10" strokeLinecap="round" fill="none"
              />
              <circle cx="220" cy="12" r="7" fill="#C4895A" />
            </g>

            {/* Heart floating above */}
            <text x="255" y="50" fontSize="22" textAnchor="middle"
              style={{ animation: 'bounce-gentle 2s ease-in-out infinite', display: 'inline-block' }}>
              🐾
            </text>
          </svg>
        </div>
      </div>
    </section>
  )
}

function GallerySection() {
  const { ref, inView } = useInView(0.08)
  return (
    <section className="gallery-section" id="gallery">
      <div className="section-header">
        <span className="section-badge">The Studio</span>
        <h2>Moments of Joy</h2>
        <p>Every session is a memory in the making.</p>
      </div>
      <div className={`gallery-grid${inView ? ' visible' : ''}`} ref={ref}>
        {GALLERY.map((img, i) => (
          <div
            key={img.src}
            className={`gallery-item${img.tall ? ' tall' : ''}`}
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <img src={img.src} alt={img.alt} loading="lazy" />
            <div className="gallery-overlay">
              <PawIcon size={42} className="overlay-paw" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="testimonials-section">
      <div className="section-header">
        <span className="section-badge">Kind Words</span>
        <h2>Loved by Every Pup Parent</h2>
      </div>

      <div className="testimonial-track">
        {TESTIMONIALS.map((t, i) => (
          <div key={t.name} className={`testimonial-card${i === active ? ' active' : ''}`}>
            <div className="stars">
              {Array.from({ length: t.rating }).map((_, j) => <StarIcon key={j} />)}
            </div>
            <blockquote>"{t.quote}"</blockquote>
            <div className="testimonial-author">
              <strong>{t.name}</strong>
              <span>{t.since}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="testimonial-dots">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            className={`dot${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="cta-section" id="book">
      <div
        className="cta-bg"
        style={{ backgroundImage: "url('/IMG_5575_a560e5dd-077d-48be-8f15-5d23890ed291.webp')" }}
      />
      <div className="cta-overlay" />
      <div className="cta-content">
        <PawIcon size={52} className="cta-paw" />
        <h2>Ready to Find<br />Your <em>Flow</em>?</h2>
        <p>
          Join hundreds of happy humans and puppies at Studio Yopaw.
          Your first class is just a click away.
        </p>
        <button className="btn-primary btn-xl">Book Your First Class</button>
        <span className="cta-note">
          First session 50% off · No experience needed · Puppies provided 🐾
        </span>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <PawIcon size={28} className="text-sage" />
            Studio Yopaw
          </div>
          <p>Mindful movement. Unconditional love.<br />Where every pose is better with a pup.</p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Navigate</h4>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#classes">Classes</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#book">Book a Session</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Find Us</h4>
          <p>123 Wellness Way<br />New York, NY 10001</p>
          <p>hello@studioyopaw.com</p>
          <p>(555) 123-PAWS</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Studio Yopaw. All rights reserved. Made with 🐾</p>
      </div>
    </footer>
  )
}

// ── App ────────────────────────────────────────────────────

export default function App() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="site-wrapper">
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <MarqueeTicker />
      <AboutSection />
      <ClassesSection />
      <StatsBar />
      <IllustrationSection />
      <GallerySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
