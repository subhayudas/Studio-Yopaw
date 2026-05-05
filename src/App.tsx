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
    title: 'Puppy Yoga — Yin',
    duration: '60 min',
    image: '/IMG_0642.webp',
    description: 'A slow, meditative practice accompanied by adorable puppies. Designed for all levels — the perfect balance of stillness, breathing, and puppy cuddles.',
    link: '#book',
    linkText: 'Reserve a spot →',
  },
  {
    title: 'Puppy Yoga — Gentle Flow',
    duration: '60 min',
    image: '/IMG_1468.webp',
    description: 'Beginner-friendly movement in a warm, welcoming atmosphere. Explore yoga at your own pace while our puppies bring endless joy to your mat.',
    link: '#book',
    linkText: 'Reserve a spot →',
  },
  {
    title: 'Private & Corporate',
    duration: 'Flexible',
    image: '/IMG_2299_2.webp',
    description: 'Book a private session for your group — up to 20 participants. Perfect for corporate wellness, team building, birthdays, and special celebrations.',
    link: '#corporate',
    linkText: 'Learn more →',
  },
]

const STATS = [
  { value: 20,  prefix: '',  suffix: '',     label: 'Max Students Per Class' },
  { value: 60,  prefix: '',  suffix: ' min', label: 'Class Duration' },
  { value: 46,  prefix: '$', suffix: '',     label: 'Drop-In Per Session' },
  { value: 100, prefix: '',  suffix: '%',    label: 'Tail Wags Guaranteed' },
]

const GALLERY = [
  { src: '/IMG_7546.webp',                                        alt: 'Studio Yopaw session',   tall: true  },
  { src: '/IMG_7268_43334cab-c14c-4b05-b4b9-497a9fcd7f92.webp', alt: 'Class in session',       tall: false },
  { src: '/IMG_7478_3c7b739e-7a8c-43b3-b104-99f3db44a731.webp', alt: 'Happy pup moment',       tall: false },
  { src: '/IMG_9045_b027fb31-b966-46ee-ac10-47bafc1ef696.webp', alt: 'Yoga flow with puppies', tall: false },
  { src: '/IMG_1167_ff8c28e8-ef39-491c-bf7c-ae0caa5fda75.webp', alt: 'Studio highlight',       tall: false },
]

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    since: 'Yoga participant',
    quote: "I've tried every yoga studio in the city, but nothing compares to the pure joy of practicing with puppies. It completely transformed my relationship with mindfulness.",
    rating: 5,
  },
  {
    name: 'Jamie L.',
    since: 'Regular attendee',
    quote: "The instructors are incredible, the puppies are adorable, and the atmosphere is so welcoming. It's genuinely the highlight of my week, every single week.",
    rating: 5,
  },
  {
    name: 'Priya K.',
    since: 'First-time visitor',
    quote: "As someone who struggles with anxiety, puppy yoga has been genuinely therapeutic. The combination of mindful movement and puppy cuddles is simply unbeatable.",
    rating: 5,
  },
]

const MARQUEE = [
  '🐾 Yoga avec chiens', '·', 'Animal-Assisted Therapy', '·', 'Saint-Lazare, QC', '·',
  'Yin & Gentle Flow', '·', 'RYT 200 Certified', '·', 'All Sizes Welcome', '·',
  '🐾 Puppy Yoga', '·', 'Stress Relief & Joy', '·', 'Namaste & Play', '·',
]

const FAQS = [
  {
    q: 'Do I need yoga experience to attend?',
    a: "Not at all! Our Yin and Gentle Flow classes are fully beginner-friendly. Whether it's your first time on a mat or you're a seasoned practitioner, you'll feel right at home.",
  },
  {
    q: 'What size dogs are welcome?',
    a: 'All sizes are welcome! From tiny Chihuahuas to large Golden Retrievers — the more the merrier at Studio Yopaw.',
  },
  {
    q: 'Do the dogs need to be vaccinated?',
    a: 'Vaccinations are strongly recommended for the safety and well-being of all animals participating in class. We want every pup to have a happy, healthy experience.',
  },
  {
    q: 'What should I bring to class?',
    a: "Comfortable yoga clothes and ideally your own yoga mat. If you don't have one, we offer rentals on-site for just $5.",
  },
  {
    q: 'What is your cancellation policy?',
    a: 'Cancel at least 72 hours before your class start time to receive a full refund or credit toward a future session.',
  },
  {
    q: 'How long is a class and what does it look like?',
    a: 'Each class is 60 minutes: 15 minutes of warm-up yoga (without puppies), 15 minutes of yoga with the puppies joining in, and 30 minutes of free play and photos with our furry friends.',
  },
  {
    q: 'How do I book a class?',
    a: "Book online at studioyopaw.ca — it's quick and easy. Payment is taken at time of booking, and you'll receive an email confirmation right away. Reminder emails are sent the Monday before your weekend class.",
  },
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
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#corporate">Corporate</a></li>
            <li><a href="#faq">FAQ</a></li>
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
          <a href="#about"     onClick={() => setMenuOpen(false)}>About</a>
          <a href="#classes"   onClick={() => setMenuOpen(false)}>Classes</a>
          <a href="#pricing"   onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#gallery"   onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="#corporate" onClick={() => setMenuOpen(false)}>Corporate</a>
          <a href="#faq"       onClick={() => setMenuOpen(false)}>FAQ</a>
          <a
            href="#book"
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
        <div className="hero-badge">🐾 Est. 2026 · Saint-Lazare, QC</div>
        <h1 className="hero-title">
          Where Puppies & People<br />Find Their <em>Flow</em>
        </h1>
        <p className="hero-sub">
          Animal-assisted therapy meets mindful movement. Our puppy yoga classes bring joy, calm,
          and four-legged companionship to your practice — right here in Saint-Lazare.
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
          <span className="section-badge">Notre Histoire</span>
          <h2>Yoga. Chiens.<br />Pure <em>Bonheur</em>.</h2>
          <p>
            Studio Yopaw was born from a beautiful combination: a deep love for dogs and the
            well-being that yoga provides. Founded in 2026 by Joelle Castonguay in Saint-Lazare, QC,
            our studio exists to offer animal-assisted therapy to people of all backgrounds.
          </p>
          <p>
            Our RYT 200 certified instructors guide every 60-minute session with care and expertise.
            Whether you're stepping onto a mat for the first time or deepening a long-time practice,
            every class is made infinitely better by our four-legged co-instructors.
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
        <h2>One Class. <em>Infinite Joy</em>.</h2>
        <p>Puppy yoga for every level — Yin, Gentle Flow, and private sessions. All dogs, all levels, all welcome.</p>
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
              <a href={cls.link} className="link-arrow">{cls.linkText}</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExperienceSection() {
  const { ref, inView } = useInView(0.1)

  const steps = [
    {
      icon: '🧘',
      time: '15 min',
      title: 'Warm Up',
      description: 'We begin with gentle yoga — breathing, centering, and preparing your body for movement. A mindful start, just you and your mat.',
    },
    {
      icon: '🐾',
      time: '15 min',
      title: 'Flow With Pups',
      description: 'The puppies join the mat! Continue your practice with adorable four-legged companions weaving through poses and filling the room with joy.',
    },
    {
      icon: '📸',
      time: '30 min',
      title: 'Play & Connect',
      description: 'The mats roll up and the fun begins. Free play, cuddles, and as many photos as your heart desires. Pure puppy bliss.',
    },
  ]

  return (
    <section className="experience-section" id="experience">
      <div className="section-header">
        <span className="section-badge">Your 60-Minute Journey</span>
        <h2>What to <em>Expect</em></h2>
        <p>Every session is designed to warm your body, open your heart, and leave you glowing.</p>
      </div>
      <div className={`experience-grid${inView ? ' visible' : ''}`} ref={ref}>
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="experience-card"
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <div className="exp-icon">{step.icon}</div>
            <div className="exp-time">{step.time}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatCounter({ value, prefix = '', suffix, label }: { value: number; prefix?: string; suffix: string; label: string }) {
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
      <span className="stat-value">{prefix}{count}{suffix}</span>
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

function PricingSection() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-inner">
        <div className="section-header">
          <span className="section-badge badge-light">Simple Pricing</span>
          <h2 style={{ color: '#fff' }}>One Price. <em style={{ color: '#A8D5A0' }}>Pure Joy.</em></h2>
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>Transparent, fair, and no surprises.</p>
        </div>
        <div className="pricing-card glass-dark">
          <div className="pricing-amount">
            <span className="price-value">$46</span>
            <span className="price-suffix">+ taxes</span>
          </div>
          <div className="price-type">Drop-In · Per Class</div>
          <ul className="price-features">
            <li>✓ 60-minute guided session</li>
            <li>✓ RYT 200 certified instructor</li>
            <li>✓ All dog sizes welcome</li>
            <li>✓ Photo opportunities included</li>
            <li>✓ Yoga mat rental on-site ($5)</li>
          </ul>
          <a
            href="https://www.studioyopaw.ca"
            className="btn-primary btn-lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book Your Spot
          </a>
          <div className="pricing-note">
            <span>💳 Payment at time of booking (online)</span>
            <span>↩ 72-hour cancellation · Full refund or credit</span>
          </div>
        </div>
      </div>
    </section>
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
          <span className="section-badge badge-light">The Mission</span>
          <h2>Your Mat,<br />Their <em>World</em></h2>
          <p>
            At Studio Yopaw, we believe in the healing power of animal connection.
            Our mission is to offer animal-assisted therapy through the practice of yoga —
            a beautiful combination that soothes stress, lifts mood, and opens hearts.
          </p>
          <p>
            Puppies bring no judgment, no ego — just pure presence, curiosity, and unconditional
            love. Every session, something remarkable happens: you rediscover the same.
          </p>
          <a href="#book" className="btn-primary btn-lg">Book Your Spot</a>
        </div>

        <div className="illus-svg-wrapper">
          <svg viewBox="0 0 360 300" className="yoga-illustration" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="180" cy="278" rx="145" ry="13" fill="rgba(74,107,80,0.3)" />
            <rect x="55" y="266" width="250" height="12" rx="6" fill="rgba(74,107,80,0.18)" />
            <line x1="180" y1="90" x2="102" y2="226" stroke="rgba(180,168,155,0.65)" strokeWidth="11" strokeLinecap="round" />
            <line x1="180" y1="90" x2="300" y2="220" stroke="rgba(180,168,155,0.65)" strokeWidth="11" strokeLinecap="round" />
            <line x1="180" y1="90" x2="72" y2="218" stroke="#F0EBE3" strokeWidth="14" strokeLinecap="round" />
            <line x1="180" y1="90" x2="284" y2="214" stroke="#F0EBE3" strokeWidth="14" strokeLinecap="round" />
            <ellipse cx="282" cy="218" rx="15" ry="8" fill="#F0D5B5" />
            <ellipse cx="298" cy="224" rx="11" ry="6" fill="#DFC09A" opacity="0.75" />
            <circle cx="71"  cy="219" r="11" fill="#F0D5B5" />
            <circle cx="101" cy="228" r="8"  fill="#DFC09A" opacity="0.75" />
            <circle cx="55" cy="196" r="25" fill="#F0D5B5" />
            <ellipse cx="55" cy="178" rx="25" ry="15" fill="#7A5A3A" />
            <circle cx="47" cy="197" r="3"  fill="#4A3520" />
            <circle cx="62" cy="199" r="3"  fill="#4A3520" />
            <path d="M48 207 Q55 213 62 207" stroke="#6B4A30" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="180" cy="90" r="6" fill="rgba(240,235,227,0.35)" />
            <ellipse cx="180" cy="67" rx="31" ry="21" fill="#C4895A" />
            <circle cx="153" cy="51" r="23" fill="#C4895A" />
            <ellipse cx="140" cy="59" rx="11" ry="9" fill="#A87040" />
            <ellipse cx="146" cy="33" rx="9"  ry="15" fill="#9E6230" transform="rotate(-18 146 33)" />
            <ellipse cx="168" cy="31" rx="9"  ry="15" fill="#9E6230" transform="rotate(12 168 31)" />
            <circle cx="147" cy="47" r="5.5" fill="#1C1C1C" />
            <circle cx="162" cy="45" r="5.5" fill="#1C1C1C" />
            <circle cx="148" cy="46" r="2"   fill="white" />
            <circle cx="163" cy="44" r="2"   fill="white" />
            <ellipse cx="140" cy="57" rx="5" ry="4" fill="#5A2A2A" />
            <path d="M136 63 Q140 71 144 63" stroke="#D44040" strokeWidth="2.5" fill="#D44040" strokeLinecap="round" />
            <line x1="163" y1="84" x2="158" y2="103" stroke="#9E6230" strokeWidth="9" strokeLinecap="round" />
            <circle cx="157" cy="105" r="5.5" fill="#854F20" />
            <line x1="196" y1="87" x2="193" y2="106" stroke="#9E6230" strokeWidth="9" strokeLinecap="round" />
            <circle cx="192" cy="108" r="5.5" fill="#854F20" />
            <g className="tail-group">
              <path
                d="M208 62 Q222 47 226 32 Q230 18 221 13"
                stroke="#C4895A" strokeWidth="10" strokeLinecap="round" fill="none"
              />
              <circle cx="220" cy="12" r="7" fill="#C4895A" />
            </g>
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
        <h2>Moments of <em>Joy</em></h2>
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

function CorporateSection() {
  return (
    <section className="corporate-section" id="corporate">
      <div className="corporate-inner">
        <div className="corporate-card glass-dark">
          <PawIcon size={52} className="corporate-paw" />
          <span className="section-badge badge-light">Private &amp; Corporate</span>
          <h2 style={{ color: '#fff', marginTop: 16 }}>
            Bring the Joy<br />to Your <em style={{ color: '#A8D5A0' }}>Team</em>
          </h2>
          <p>
            Looking for a one-of-a-kind group experience? Book a private puppy yoga session
            for your team — up to 20 participants. Perfect for corporate wellness days,
            team building, birthdays, bachelorette parties, and special celebrations.
          </p>
          <div className="corporate-features">
            <div className="corp-feature">👥 Up to 20 participants</div>
            <div className="corp-feature">🎉 Special events & birthdays</div>
            <div className="corp-feature">🏢 Corporate wellness days</div>
            <div className="corp-feature">📸 Photo opportunities</div>
          </div>
          <div className="corporate-ctas">
            <a href="mailto:Studioyopaw@gmail.com" className="btn-primary btn-lg">Email Us</a>
            <a href="tel:5142424947" className="btn-ghost btn-lg">514-242-4947</a>
          </div>
        </div>
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
        <h2>Loved by Every <em>Pup Parent</em></h2>
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

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section" id="faq">
      <div className="section-header">
        <span className="section-badge">Got Questions?</span>
        <h2>Frequently Asked <em>Questions</em></h2>
        <p>Everything you need to know before your first class.</p>
      </div>
      <div className="faq-list">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={`faq-item${open === i ? ' open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="faq-question">
              <span>{faq.q}</span>
              <span className="faq-chevron">{open === i ? '−' : '+'}</span>
            </div>
            {open === i && <div className="faq-answer">{faq.a}</div>}
          </div>
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
          Join Studio Yopaw in Saint-Lazare and discover the joy of animal-assisted yoga.
          Your first class is just a click away.
        </p>
        <a
          href="https://www.studioyopaw.ca"
          className="btn-primary btn-xl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Book Your First Class
        </a>
        <span className="cta-note">
          $46 + taxes · All levels welcome · Yoga mat rental available $5 🐾
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
          <p>Animal-assisted therapy through yoga.<br />Where every pose is better with a pup.</p>
          <div className="footer-social">
            <a href="https://instagram.com/studioyopaw" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
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
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#corporate">Corporate</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#book">Book a Session</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Find Us</h4>
          <p>1515A, des Marguerites<br />Saint-Lazare, QC J7T2R8</p>
          <p>
            <a href="mailto:Studioyopaw@gmail.com" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Studioyopaw@gmail.com
            </a>
          </p>
          <p>
            <a href="tel:5142424947" style={{ color: 'rgba(255,255,255,0.65)' }}>
              514-242-4947
            </a>
          </p>
          <p style={{ marginTop: 8 }}>
            <a
              href="https://www.studioyopaw.ca"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--sage)' }}
            >
              www.studioyopaw.ca
            </a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Studio Yopaw · Saint-Lazare, QC · Made with 🐾</p>
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
      <ExperienceSection />
      <StatsBar />
      <PricingSection />
      <IllustrationSection />
      <GallerySection />
      <CorporateSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
