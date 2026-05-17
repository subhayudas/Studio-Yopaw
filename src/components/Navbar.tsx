import { useState } from 'react'
import { useI18n } from '../i18n/LanguageProvider'

export function Navbar({
  scrolled,
  variant = 'default',
}: {
  scrolled: boolean
  /** `solid` = opaque bar (e.g. policy pages), not transparent over the hero. */
  variant?: 'default' | 'solid'
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, s, toggleLang } = useI18n()
  const toggleLabel = lang === 'en' ? 'FR' : 'EN'
  const toggleAria = lang === 'en' ? s.navSwitchToFrAria : s.navSwitchToEnAria

  return (
    <>
      <nav
        className={`navbar${scrolled ? ' scrolled' : ''}${variant === 'solid' ? ' navbar--solid' : ''}`}
      >
        <div className="navbar-inner">
          <a href="/" className="navbar-logo">
            <img src="/yopawlogo.png" alt="Studio Yopaw" className="navbar-logo-img" />
          </a>
          <ul className="navbar-links">
            <li><a href="/#experience">{s.navLinks.howItWorks}</a></li>
            <li><a href="/#classes">{s.navLinks.classes}</a></li>
            <li><a href="/#pricing">{s.navLinks.pricing}</a></li>
            <li><a href="/#about">{s.navLinks.values}</a></li>
            <li><a href="/#faq">{s.navLinks.faq}</a></li>
            <li><a href="/#testimonials">{s.navLinks.reviews}</a></li>
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
            <a href="/#book" className="btn-primary">{s.navBook}</a>
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
        <>
          <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="mobile-menu">
            <a href="/#experience" onClick={() => setMenuOpen(false)}>{s.navLinks.howItWorks}</a>
            <a href="/#classes" onClick={() => setMenuOpen(false)}>{s.navLinks.classes}</a>
            <a href="/#pricing" onClick={() => setMenuOpen(false)}>{s.navLinks.pricing}</a>
            <a href="/#about" onClick={() => setMenuOpen(false)}>{s.navLinks.values}</a>
            <a href="/#faq" onClick={() => setMenuOpen(false)}>{s.navLinks.faq}</a>
            <a href="/#testimonials" onClick={() => setMenuOpen(false)}>{s.navLinks.reviews}</a>
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
              <a href="/#book" className="btn-primary mobile-menu-book" onClick={() => setMenuOpen(false)}>
                {s.navMobileBook}
              </a>
            </div>
          </div>
        </>
      )}
    </>
  )
}
