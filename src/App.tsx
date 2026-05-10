import { useState, useEffect, useLayoutEffect, useRef, useMemo, type FormEvent } from 'react'
import './App.css'
import type { Lang } from './i18n/siteStrings'
import { interpolate, useI18n } from './i18n/LanguageProvider'

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

const GALLERY_IMAGES = [
  { src: '/IMG_7546.webp', tall: true as const },
  { src: '/magnific_change-the-dog-to-a-dachs_2935979833.png', tall: false as const },
  { src: '/IMG_7478_3c7b739e-7a8c-43b3-b104-99f3db44a731.webp', tall: false as const },
  { src: '/IMG_9045_b027fb31-b966-46ee-ac10-47bafc1ef696.webp', tall: false as const },
  { src: '/IMG_1167_ff8c28e8-ef39-491c-bf7c-ae0caa5fda75.webp', tall: false as const },
]

const CLASS_IMAGES = [
  '/magnific_change-the-dog-to-a-frenc_2935952488.png',
  '/magnific_change-the-dog-to-a-labra_2935977057.png',
  '/IMG_2299_2.webp',
]

// ── Sections ───────────────────────────────────────────────

function Navbar({ scrolled }: { scrolled: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, s, toggleLang } = useI18n()
  const toggleLabel = lang === 'en' ? 'FR' : 'EN'
  const toggleAria = lang === 'en' ? s.navSwitchToFrAria : s.navSwitchToEnAria

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="#hero" className="navbar-logo">
            <img src="/yopawlogo.png" alt="Studio Yopaw" className="navbar-logo-img" />
          </a>
          <ul className="navbar-links">
            <li><a href="#experience">{s.navLinks.howItWorks}</a></li>
            <li><a href="#classes">{s.navLinks.classes}</a></li>
            <li><a href="#testimonials">{s.navLinks.reviews}</a></li>
            <li><a href="#pricing">{s.navLinks.pricing}</a></li>
            <li><a href="#corporate">{s.navLinks.corporate}</a></li>
            <li><a href="#faq">{s.navLinks.faq}</a></li>
          </ul>
          <div className="navbar-actions">
            <button
              type="button"
              className="lang-switch"
              onClick={toggleLang}
              aria-label={toggleAria}
              title={s.navLangOtherHint}
            >
              {toggleLabel}
            </button>
            <a href="#book" className="btn-primary">{s.navBook}</a>
          </div>
          <button
            className="hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={s.navToggle}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#experience" onClick={() => setMenuOpen(false)}>{s.navLinks.howItWorks}</a>
          <a href="#classes" onClick={() => setMenuOpen(false)}>{s.navLinks.classes}</a>
          <a href="#testimonials" onClick={() => setMenuOpen(false)}>{s.navLinks.reviews}</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>{s.navLinks.pricing}</a>
          <a href="#corporate" onClick={() => setMenuOpen(false)}>{s.navLinks.corporate}</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>{s.navLinks.faq}</a>
          <div className="mobile-menu-actions">
            <button
              type="button"
              className="lang-switch"
              onClick={() => { toggleLang(); setMenuOpen(false); }}
              aria-label={toggleAria}
              title={s.navLangOtherHint}
            >
              {toggleLabel}
            </button>
            <a href="#book" className="btn-primary mobile-menu-book" onClick={() => setMenuOpen(false)}>
              {s.navMobileBook}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function HeroSection() {
  const { s } = useI18n()
  return (
    <section className="hero-section" id="hero">
      <video
        autoPlay muted loop playsInline
        className="hero-video"
        src="/182991340eeb459d952466dcb9f2d778.mp4"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">
          {s.heroTitleL1}<br />
          {s.heroTitleL2Prefix}<em>{s.heroTitleItalic}</em>
        </h1>
        <p className="hero-sub">
          {s.heroSub}
        </p>
        <div className="hero-ctas">
          <a href="#book" className="btn-primary btn-lg">{s.heroBook}</a>
          <a href="#classes" className="btn-ghost   btn-lg">{s.heroClasses}</a>
        </div>
      </div>
      <div className="hero-scroll">
        <span>{s.heroScroll}</span>
        <div className="scroll-chevron" />
      </div>
    </section>
  )
}

function MarqueeTicker() {
  const { s } = useI18n()
  const doubled = [...s.marqueeItems, ...s.marqueeItems]
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
  const { s } = useI18n()
  return (
    <section className="about-section" id="about">
      <div className={`about-inner${inView ? ' visible' : ''}`} ref={ref}>
        <div className="about-text">
          <span className="section-badge">{s.aboutBadge}</span>
          <h2>
            {s.aboutHeadingL1}
            <br />
            {s.aboutHeadingEmPrefix}
            <em>{s.aboutHeadingItalic}</em>.
          </h2>
          <p>{s.aboutP1}</p>
          <p>{s.aboutP2}</p>
          <a href="#classes" className="link-arrow">{s.aboutLink}</a>
        </div>
        <div className="about-image">
          <img src="/IMG_5574.webp" alt={s.aboutImgAlt} />
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
  const { s } = useI18n()
  return (
    <section className="classes-section" id="classes">
      <div className="section-header">
        <span className="section-badge">{s.classesBadge}</span>
        <h2>{s.classesHeading}<em>{s.classesHeadingEm}</em>.</h2>
        <p>{s.classesSub}</p>
      </div>
      <div className={`classes-grid${inView ? ' visible' : ''}`} ref={ref}>
        {s.classCards.map((cls, i) => (
          <div
            key={cls.title}
            className="class-card"
            style={{ transitionDelay: `${i * 0.13}s` }}
          >
            <div className="card-image">
              <img src={CLASS_IMAGES[i]} alt={cls.title} loading="lazy" />
              <span className="duration-badge">{cls.duration}</span>
            </div>
            <div className="card-body">
              <h3>{cls.title}</h3>
              <p>{cls.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '2.75rem', width: '100%', textAlign: 'center' }}>
        <a href="#booking" className="btn-primary btn-lg">
          {s.classesBook}
        </a>
      </div>
    </section>
  )
}

function ExperienceSection() {
  const { ref, inView } = useInView(0.1)
  const { s } = useI18n()
  /** Bump this when replacing step PNGs in /public under the same filename (forces browsers/CDNs to reload). */
  const stepLogoV = '2'
  const stepSrc = [`/step1Logo.png?v=${stepLogoV}`, `/step2Logo.png?v=${stepLogoV}`, `/step3Logo.png?v=${stepLogoV}`]

  return (
    <section className="experience-section" id="experience">
      <div className="section-header">
        <span className="section-badge">{s.experienceBadge}</span>
        <h2>
          {s.experienceHeadingPre}
          <em>{s.experienceHeadingEm}</em>
        </h2>
        <p>{s.experienceSub}</p>
      </div>
      <div className={`experience-grid${inView ? ' visible' : ''}`} ref={ref}>
        {s.experienceSteps.map((step, i) => (
          <div
            key={step.title}
            className="experience-card"
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <div className={i === 0 ? 'exp-icon exp-icon--step1' : 'exp-icon'}>
              <img src={stepSrc[i]} alt={step.logoAlt} loading="lazy" />
            </div>
            <div className="exp-time">{step.time}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '2.75rem', textAlign: 'center' }}>
        <a href="#book" className="btn-primary btn-lg">
          {s.experienceBook}
        </a>
      </div>
    </section>
  )
}

const WEEKEND_SPOTS_PATTERN = [18, 12, 0, 7, 0, 15] as const

type YogaStyle = 'yin' | 'gentle'

type WeekendSession = { iso: string; spotsRemaining: number }

function addDaysLocal(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function buildNextWeekendSessions(): WeekendSession[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const out: WeekendSession[] = []
  for (let i = 0; i < 200 && out.length < 12; i++) {
    const d = addDaysLocal(start, i)
    const wd = d.getDay()
    if (wd === 0 || wd === 6) {
      const wi = Math.floor(out.length / 2)
      const spotsRemaining = WEEKEND_SPOTS_PATTERN[wi % WEEKEND_SPOTS_PATTERN.length]
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      out.push({ iso, spotsRemaining })
    }
  }
  return out
}

function formatLongSessionDate(iso: string, lang: Lang): string {
  const [y, m, day] = iso.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const loc = lang === 'fr' ? 'fr-CA' : 'en-CA'
  return d.toLocaleDateString(loc, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortSessionDate(iso: string, lang: Lang): string {
  const [y, m, day] = iso.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const loc = lang === 'fr' ? 'fr-CA' : 'en-CA'
  return d.toLocaleDateString(loc, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PricingStepBack({ onClick }: { onClick: () => void }) {
  const { s } = useI18n()
  return (
    <button type="button" className="pricing-step-back" onClick={onClick} aria-label={s.commonBackAria}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function PricingSection() {
  const { lang, s } = useI18n()
  const weekendSessions = useMemo(() => buildNextWeekendSessions(), [])
  const bookingClassChoices = useMemo(
    () =>
      [
        { id: 'yin' as const, label: s.bookingChoiceYin },
        { id: 'gentle' as const, label: s.bookingChoiceGentle },
        { id: 'corporate' as const, label: s.bookingChoiceCorporate },
      ] as const,
    [s]
  )

  type Flow =
    | { kind: 'chooseClass' }
    | { kind: 'public'; step: 'mat' | 'date' | 'contact'; yoga: YogaStyle }
    | { kind: 'publicSuccess' }
    | { kind: 'corporate'; step: 'form' }
    | { kind: 'corporateSuccess' }

  const [flow, setFlow] = useState<Flow>({ kind: 'chooseClass' })
  const [selectedSessionIso, setSelectedSessionIso] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [corpName, setCorpName] = useState('')
  const [corpEmail, setCorpEmail] = useState('')
  const [corpPhone, setCorpPhone] = useState('')
  const [groupSize, setGroupSize] = useState('')
  const [eventDetails, setEventDetails] = useState('')

  const pricingCardRef = useRef<HTMLDivElement>(null)
  const hasInteractedWithBookingFormRef = useRef(false)
  const pendingPricingStepScrollRef = useRef(false)
  const flowTransitionKey =
    flow.kind === 'chooseClass'
      ? 'choose'
      : flow.kind === 'publicSuccess'
        ? 'pub-success'
        : flow.kind === 'corporateSuccess'
          ? 'corp-success'
          : flow.kind === 'corporate'
            ? 'corp-form'
            : `pub-${flow.step}-${flow.yoga}`

  const requestScrollPricingCardAfterAdvance = () => {
    hasInteractedWithBookingFormRef.current = true
    pendingPricingStepScrollRef.current = true
  }

  useEffect(() => {
    if (!hasInteractedWithBookingFormRef.current || !pendingPricingStepScrollRef.current) return
    const card = pricingCardRef.current
    if (!card || !hasInteractedWithBookingFormRef.current) return
    pendingPricingStepScrollRef.current = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!hasInteractedWithBookingFormRef.current) return
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }, [flowTransitionKey])

  const progressPercent = (): number => {
    if (flow.kind === 'chooseClass') return 25
    if (flow.kind === 'publicSuccess') return 100
    if (flow.kind === 'public') {
      if (flow.step === 'mat') return 50
      if (flow.step === 'date') return 75
      return 100
    }
    if (flow.kind === 'corporate' || flow.kind === 'corporateSuccess') return 100
    return 0
  }

  const showProgress =
    flow.kind !== 'publicSuccess' && flow.kind !== 'corporateSuccess'

  const goBack = () => {
    if (flow.kind === 'public') {
      if (flow.step === 'mat') {
        setFlow({ kind: 'chooseClass' })
        return
      }
      if (flow.step === 'date') {
        setFlow({ kind: 'public', step: 'mat', yoga: flow.yoga })
        setSelectedSessionIso(null)
        return
      }
      setFlow({ kind: 'public', step: 'date', yoga: flow.yoga })
      return
    }
    if (flow.kind === 'corporate' && flow.step === 'form') {
      setFlow({ kind: 'chooseClass' })
      setCorpName('')
      setCorpEmail('')
      setCorpPhone('')
      setGroupSize('')
      setEventDetails('')
    }
  }

  const chooseClass = (id: (typeof bookingClassChoices)[number]['id']) => {
    requestScrollPricingCardAfterAdvance()
    if (id === 'corporate') {
      setFlow({ kind: 'corporate', step: 'form' })
      return
    }
    setFlow({ kind: 'public', step: 'mat', yoga: id })
    setSelectedSessionIso(null)
  }

  const pickMat = () => {
    requestScrollPricingCardAfterAdvance()
    setFlow(prev =>
      prev.kind === 'public' && prev.step === 'mat'
        ? { ...prev, step: 'date' }
        : prev
    )
    setSelectedSessionIso(null)
  }

  const submitPublic = (e: FormEvent) => {
    e.preventDefault()
    requestScrollPricingCardAfterAdvance()
    setFlow({ kind: 'publicSuccess' })
  }

  const submitCorporate = (e: FormEvent) => {
    e.preventDefault()
    requestScrollPricingCardAfterAdvance()
    setFlow({ kind: 'corporateSuccess' })
  }

  const restartPublicBooking = () => {
    setFlow({ kind: 'chooseClass' })
    setSelectedSessionIso(null)
    setFullName('')
    setEmail('')
    setPhone('')
  }

  const renderPublicSuccess = () => (
    <div className="pricing-success">
      <div className="pricing-success-icon" aria-hidden>
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="var(--sage)" strokeWidth="2" opacity="0.35" />
          <path d="M14 24l8 8 13-17" stroke="var(--sage-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="pricing-step-title">{s.pricingSuccessPublicTitle}</h3>
      <p className="pricing-success-body">
        {interpolate(s.pricingSuccessPublicBody, {
          email,
          date: selectedSessionIso
            ? formatLongSessionDate(selectedSessionIso, lang)
            : s.pricingSuccessChosenDayFallback,
        })}
      </p>
      <p className="pricing-success-foot">{s.pricingSuccessPublicFoot}</p>
      <button type="button" className="pricing-success-restart" onClick={restartPublicBooking}>
        {s.pricingSuccessRestart}
      </button>
    </div>
  )

  const renderCorporateSuccess = () => (
    <div className="pricing-success">
      <div className="pricing-success-icon" aria-hidden>
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="var(--sage)" strokeWidth="2" opacity="0.35" />
          <path d="M14 24l8 8 13-17" stroke="var(--sage-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="pricing-step-title">{s.pricingSuccessCorpTitle}</h3>
      <p className="pricing-success-body">{s.pricingSuccessCorpBody}</p>
    </div>
  )

  let showBack = false
  if (flow.kind === 'public' && flow.step === 'mat') showBack = true
  else if (flow.kind === 'public' && flow.step === 'date') showBack = true
  else if (flow.kind === 'public' && flow.step === 'contact') showBack = true
  else if (flow.kind === 'corporate' && flow.step === 'form') showBack = true

  const showFullPricingCardHeader =
    flow.kind === 'chooseClass' ||
    flow.kind === 'corporate' ||
    flow.kind === 'corporateSuccess'

  return (
    <section className="pricing-section" id="pricing">
      <span id="booking" style={{ display: 'block', height: 0, overflow: 'hidden' }} aria-hidden />
      <span id="corporate" style={{ display: 'block', height: 0, overflow: 'hidden' }} aria-hidden />
      <span id="book" style={{ display: 'block', height: 0, overflow: 'hidden' }} aria-hidden />
      <div className="pricing-inner">
        <div className="section-header">
          <span className="section-badge badge-light">{s.pricingSectionBadge}</span>
          <h2 style={{ color: '#fff' }}>
            {lang === 'fr' ? (
              <>
                {s.pricingHeadingPre}
                <br />
                {s.pricingHeadingMidLead}
                <em style={{ color: '#F9A8D4', fontStyle: 'italic' }}>{s.pricingHeadingEm}</em>
                {s.pricingHeadingMidTrail}
              </>
            ) : (
              <>
                {s.pricingHeadingPre}
                <em style={{ color: '#F9A8D4', fontStyle: 'italic' }}>{s.pricingHeadingEm}</em>
              </>
            )}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>{s.pricingSub}</p>
        </div>
        <div ref={pricingCardRef} className="pricing-card">
          {showFullPricingCardHeader ? (
            <>
              <div className="pricing-amount">
                <span className="price-value">{s.pricingAmount}</span>
                <span className="price-suffix">{s.pricingPlusTaxes}</span>
              </div>
              <div className="price-type">{s.pricingDropInRow}</div>
              <ul className="price-features">
                <li>{s.pricingFeat1}</li>
                <li>{s.pricingFeat2}</li>
                <li>{s.pricingFeat3}</li>
                <li>{s.pricingFeat4}</li>
                <li>{s.pricingFeat5}</li>
              </ul>

              <hr className="pricing-card-divider" />
            </>
          ) : (
            <p className="pricing-header-summary">{s.pricingHeaderSummary}</p>
          )}

          <div className="pricing-multi-flow">
            {showProgress && (
              <div className="pricing-progress-wrap" aria-hidden>
                <div className="pricing-progress-track">
                  <div className="pricing-progress-fill" style={{ width: `${progressPercent()}%` }} />
                </div>
              </div>
            )}

            {showBack && (
              <div className="pricing-step-toolbar">
                <PricingStepBack onClick={goBack} />
              </div>
            )}

            {flow.kind === 'chooseClass' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">{s.pricingAskClassType}</h3>
                <div className="pricing-choice-stack">
                  {bookingClassChoices.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className="pricing-choice-card"
                      onClick={() => chooseClass(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {flow.kind === 'public' && flow.step === 'mat' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">{s.pricingAskMat}</h3>
                <div className="pricing-choice-stack pricing-choice-stack--pair">
                    <button type="button" className="pricing-choice-card" onClick={pickMat}>
                    {s.pricingMatYes}
                  </button>
                  <button type="button" className="pricing-choice-card" onClick={pickMat}>
                    {s.pricingMatNo}
                  </button>
                </div>
                <p className="pricing-helper-text">{s.pricingMatHelper}</p>
              </div>
            )}

            {flow.kind === 'public' && flow.step === 'date' && (
              <div className="pricing-step-block">
                <h3 className="pricing-step-title">{s.pricingChooseSession}</h3>
                <div className="pricing-session-list">
                  {weekendSessions.map(session => {
                    const full = session.spotsRemaining <= 0
                    const sel = selectedSessionIso === session.iso
                    return (
                      <button
                        key={session.iso}
                        type="button"
                        className={`pricing-session-row${full ? ' is-disabled' : ''}${sel ? ' is-selected' : ''}`}
                        disabled={full}
                        onClick={() => {
                          if (full) return
                          requestScrollPricingCardAfterAdvance()
                          setSelectedSessionIso(session.iso)
                          setFlow(prev =>
                            prev.kind === 'public' && prev.step === 'date'
                              ? { kind: 'public', step: 'contact', yoga: prev.yoga }
                              : prev
                          )
                        }}
                      >
                        <span className="pricing-session-date">{formatShortSessionDate(session.iso, lang)}</span>
                        <span className="pricing-session-spots">
                          {full
                            ? s.pricingSpotFull
                            : interpolate(s.pricingSpotsRemain, { count: String(session.spotsRemaining) })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {flow.kind === 'public' && flow.step === 'contact' && (
              <form className="pricing-booking-form" onSubmit={submitPublic}>
                <h3 className="pricing-step-title">{s.pricingContactHeading}</h3>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="pub-fullname">
                    {s.pricingLblFullName}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="pub-fullname"
                    type="text"
                    name="fullName"
                    className="pricing-input"
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="pub-email">
                    {s.pricingLblEmail}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="pub-email"
                    type="email"
                    name="email"
                    className="pricing-input"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="pub-phone">
                    {s.pricingLblPhone}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="pub-phone"
                    type="tel"
                    name="phone"
                    className="pricing-input"
                    autoComplete="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary btn-lg pricing-submit">
                  {s.pricingSubmitBookSpot}
                </button>
              </form>
            )}

            {flow.kind === 'publicSuccess' && renderPublicSuccess()}

            {flow.kind === 'corporate' && flow.step === 'form' && (
              <form className="pricing-booking-form" onSubmit={submitCorporate}>
                <h3 className="pricing-step-title">{s.pricingCorporateTitle}</h3>
                <p className="pricing-step-intro">{s.pricingCorporateIntro}</p>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-fullname">
                    {s.pricingLblFullName}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-fullname"
                    type="text"
                    name="corpFullName"
                    className="pricing-input"
                    autoComplete="name"
                    value={corpName}
                    onChange={e => setCorpName(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-email">
                    {s.pricingLblEmail}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-email"
                    type="email"
                    name="corpEmail"
                    className="pricing-input"
                    autoComplete="email"
                    value={corpEmail}
                    onChange={e => setCorpEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-phone">
                    {s.pricingLblPhone}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-phone"
                    type="tel"
                    name="corpPhone"
                    className="pricing-input"
                    autoComplete="tel"
                    value={corpPhone}
                    onChange={e => setCorpPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-group">
                    {s.pricingLblGroupSize}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <input
                    id="corp-group"
                    type="number"
                    name="groupSize"
                    className="pricing-input"
                    min={1}
                    max={20}
                    step={1}
                    value={groupSize}
                    onChange={e => {
                      const v = e.target.value
                      const n = parseInt(v, 10)
                      if (v === '' || Number.isNaN(n)) setGroupSize('')
                      else setGroupSize(String(Math.min(20, Math.max(1, n))))
                    }}
                    required
                  />
                </div>
                <div className="pricing-form-field">
                  <label className="pricing-form-label" htmlFor="corp-event">
                    {s.pricingLblEventDetails}{' '}
                    <abbr className="pricing-req-mark" title={s.abbrevRequiredTitle}>*</abbr>
                  </label>
                  <textarea
                    id="corp-event"
                    name="eventDetails"
                    className="pricing-input pricing-input-textarea"
                    rows={4}
                    placeholder={s.pricingCorpPlaceholder}
                    value={eventDetails}
                    onChange={e => setEventDetails(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary btn-lg pricing-submit">
                  {s.pricingCorporateSubmit}
                </button>
              </form>
            )}

            {flow.kind === 'corporateSuccess' && renderCorporateSuccess()}
          </div>

          {flow.kind === 'public' && flow.step === 'contact' && (
            <div className="pricing-note">
              <span>{s.pricingPaymentNote}</span>
              <span>{s.pricingCancelNote}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function GallerySection() {
  const { ref, inView } = useInView(0.08)
  const { s } = useI18n()
  const galleryAlts = [
    s.galleryAlts.session,
    s.galleryAlts.classSession,
    s.galleryAlts.happyMoment,
    s.galleryAlts.yogaFlow,
    s.galleryAlts.highlight,
  ]
  return (
    <section className="gallery-section" id="gallery">
      <div className="section-header">
        <span className="section-badge">{s.galleryBadge}</span>
        <h2>{s.galleryHeading}<em>{s.galleryHeadingEm}</em></h2>
        <p>{s.gallerySub}</p>
      </div>
      <div className={`gallery-grid${inView ? ' visible' : ''}`} ref={ref}>
        {GALLERY_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={`gallery-item${img.tall ? ' tall' : ''}`}
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <img src={img.src} alt={galleryAlts[i] ?? s.galleryAlts.highlight} loading="lazy" />
            <div className="gallery-overlay">
              <PawIcon size={42} className="overlay-paw" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TestimonialCarouselArrow({
  dir,
}: {
  dir: 'prev' | 'next'
}) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TestimonialsSection() {
  const { s } = useI18n()
  const [active, setActive] = useState(0)
  const cards = s.testimonialCards
  const len = cards.length

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % len), 4500)
    return () => clearInterval(id)
  }, [len])

  const goPrev = () => setActive(a => (a - 1 + len) % len)
  const goNext = () => setActive(a => (a + 1) % len)

  return (
    <section className="testimonials-section" id="testimonials">
      <div
        className="testimonials-bg"
        style={{ backgroundImage: "url('/magnific_change-the-dog-to-a-poodl_2935981941.png')" }}
        aria-hidden
      />
      <div className="testimonials-overlay" aria-hidden />
      <div className="testimonials-inner">
        <div className="section-header">
          <span className="section-badge">{s.testimonialsBadge}</span>
          <h2 style={{ color: '#fff' }}>
            {s.testimonialsHeadingPre}
            <em style={{ color: '#F9A8D4', fontStyle: 'italic' }}>{s.testimonialsHeadingEm}</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>{s.testimonialsSub}</p>
        </div>

        <div className="testimonial-carousel">
          <button
            type="button"
            className="testimonial-arrow testimonial-arrow--prev"
            onClick={goPrev}
            aria-label={s.testimonialsPrevAria}
          >
            <TestimonialCarouselArrow dir="prev" />
          </button>

          <div className="testimonial-track-shell">
            <div className="testimonial-track">
              {cards.map((t, i) => (
                <div key={t.name} className={`testimonial-card${i === active ? ' active' : ''}`}>
                  <div className="stars">
                    {Array.from({ length: 5 }).map((_, j) => <StarIcon key={j} />)}
                  </div>
                  <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="testimonial-author">
                    <strong>{t.name}</strong>
                    <span>{t.since}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="testimonial-arrow testimonial-arrow--next"
            onClick={goNext}
            aria-label={s.testimonialsNextAria}
          >
            <TestimonialCarouselArrow dir="next" />
          </button>
        </div>

        <div className="testimonial-dots">
          {cards.map((_, i) => (
            <button
              key={i}
              className={`dot${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`${s.testimonialsDotAria} ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const { s } = useI18n()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section" id="faq">
      <div className="section-header">
        <span className="section-badge">{s.faqBadge}</span>
        <h2>{s.faqHeading}<em>{s.faqHeadingEm}</em></h2>
        <p>{s.faqSub}</p>
      </div>
      <div className="faq-list">
        {s.faqItems.map((faq, i) => (
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

function Footer() {
  const { s } = useI18n()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/yopawlogo.png" alt="Studio Yopaw" className="footer-logo-img" />
          </div>
          <p>{s.footerTaglineL1}<br />{s.footerTaglineL2}</p>
          <div className="footer-social">
            <a href="https://instagram.com/studioyopaw" target="_blank" rel="noopener noreferrer" aria-label={s.footerIgAria}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#" aria-label={s.footerFbAria}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>{s.footerNavigate}</h4>
          <ul>
            <li><a href="#experience">{s.navLinks.howItWorks}</a></li>
            <li><a href="#classes">{s.navLinks.classes}</a></li>
            <li><a href="#testimonials">{s.navLinks.reviews}</a></li>
            <li><a href="#pricing">{s.navLinks.pricing}</a></li>
            <li><a href="#corporate">{s.navLinks.corporate}</a></li>
            <li><a href="#faq">{s.navLinks.faq}</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>{s.footerFindUs}</h4>
          <p>{s.footerAddressL1}<br />{s.footerAddressL2}</p>
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
              {s.footerSite}
            </a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{s.footerBottom}</p>
      </div>
    </footer>
  )
}

// ── App ────────────────────────────────────────────────────

export default function App() {
  const [scrolled, setScrolled] = useState(false)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

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
      <ExperienceSection />
      <ClassesSection />
      <TestimonialsSection />
      <PricingSection />
      <GallerySection />
      <AboutSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
