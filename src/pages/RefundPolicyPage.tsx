import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useI18n } from '../i18n/LanguageProvider'

const MAILTO = 'mailto:studioyopaw@gmail.com'

function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 10h20M6 16h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="2" y="6" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconTicket({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 8.5V6a1 1 0 0 1 1-1h8.5M21 8.5V6a1 1 0 0 0-1-1h-2.5M3 15.5V18a1 1 0 0 0 1 1h8.5M21 15.5V18a1 1 0 0 1-1 1h-2.5M15 3v2.5a2.5 2.5 0 0 0 0 5V13M9 21v-2.5a2.5 2.5 0 0 1 0-5V8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type PolicyCopy = {
  title: string
  subtitle: string
  callout: string
  s1h: string
  s1p: string
  s2h: string
  s2p: string
  opt1h: string
  opt1b: string
  opt2h: string
  opt2b: string
  s2foot: string
  s3h: string
  s3p: string
  s4h: string
  s4p: string
  s5h: string
  s5box: string
  s5btn: string
  s6h: string
  s6p: string
  s7h: string
  s7p: string
  s7btn: string
  docTitle: string
}

const COPY: Record<'en' | 'fr', PolicyCopy> = {
  fr: {
    title: 'Politique de remboursement',
    subtitle: 'Simple, transparente, sans surprise.',
    callout:
      'Les annulations effectuées 72 heures ou plus avant la séance sont traitées automatiquement. Aucun contact nécessaire — le remboursement ou le crédit est appliqué directement.',
    s1h: 'Paiement',
    s1p:
      "Le paiement complet est requis afin de confirmer la réservation d'une séance ou d'un événement offert par Studio Yopaw.",
    s2h: 'Annulation par le client',
    s2p:
      'Vous pouvez annuler votre réservation sans frais en nous avisant au minimum 72 heures avant le début de la séance. L’annulation est traitée automatiquement et vous pourrez choisir entre :',
    opt1h: 'Remboursement complet',
    opt1b: 'Remboursé directement sur votre méthode de paiement originale.',
    opt2h: 'Crédit + 25% de rabais',
    opt2b:
      "Un crédit complet applicable à une future séance, accompagné d'un rabais de 25% sur votre prochaine réservation.",
    s2foot:
      'Toute annulation effectuée moins de 72 heures avant le début de la séance est finale et non remboursable.',
    s3h: 'Retards et absences',
    s3p:
      "Nous recommandons fortement d'arriver 15 minutes à l'avance. Tout retard de 15 minutes ou plus pourra être considéré comme une absence et entraîner l'annulation de votre participation sans remboursement ni crédit. Toute absence sans avis préalable est également non remboursable.",
    s4h: 'Annulation par Studio Yopaw',
    s4p:
      "Si Studio Yopaw doit annuler une séance pour des raisons hors de son contrôle (urgence, maladie, problème de sécurité ou toute situation imprévisible), vous recevrez au choix un remboursement complet ou un crédit complet, ainsi qu'un crédit additionnel équivalant à 25% de la valeur de la séance applicable sur une prochaine réservation.",
    s5h: 'Événements privés et corporatifs',
    s5box:
      "Pour les événements privés et corporatifs, des conditions particulières s'appliquent. Veuillez nous contacter directement pour toute modification ou annulation.",
    s5btn: 'Nous contacter',
    s6h: 'Acceptation',
    s6p:
      'En procédant au paiement ou à la réservation, vous reconnaissez avoir lu, compris et accepté la présente politique.',
    s7h: 'Demande de remboursement',
    s7p:
      "Pour les cours réguliers annulés 72h à l'avance, aucune action n'est requise de votre part — tout est traité automatiquement. Pour toute autre situation, contactez-nous :",
    s7btn: 'Envoyer un courriel',
    docTitle: 'Politique de remboursement | Studio Yopaw',
  },
  en: {
    title: 'Refund Policy',
    subtitle: 'Simple, transparent, no surprises.',
    callout:
      'Cancellations made 72 hours or more before your session are processed automatically. No need to contact us — your refund or credit is applied directly.',
    s1h: 'Payment',
    s1p:
      'Full payment is required to confirm your reservation for any session or event offered by Studio Yopaw.',
    s2h: 'Cancellation by the client',
    s2p:
      'You may cancel your reservation free of charge by notifying us at least 72 hours before your session. Cancellations are processed automatically and you can choose between:',
    opt1h: 'Full Refund',
    opt1b: 'Refunded directly to your original payment method.',
    opt2h: 'Credit + 25% Off',
    opt2b: 'A full credit toward a future session, plus a 25% discount on your next booking.',
    s2foot:
      'Any cancellation made less than 72 hours before the session is final and non-refundable.',
    s3h: 'Late arrivals & no-shows',
    s3p:
      'We strongly recommend arriving 15 minutes early. Any delay of 15 minutes or more may be considered a no-show and result in cancellation of your participation without refund or credit. No-shows without prior notice are non-refundable.',
    s4h: 'Cancellation by Studio Yopaw',
    s4p:
      'If Studio Yopaw must cancel a session due to circumstances beyond our control (emergency, illness, safety issue, or any unforeseeable situation), you will receive either a full refund or full credit, plus an additional credit equal to 25% of the session value toward a future booking.',
    s5h: 'Private & Corporate Events',
    s5box:
      'For private and corporate events, specific conditions apply. Please contact us directly for any changes or cancellations.',
    s5btn: 'Contact Us',
    s6h: 'Acceptance',
    s6p:
      'By completing payment or booking a session, you acknowledge that you have read, understood, and accepted this refund policy.',
    s7h: 'Refund Requests',
    s7p:
      'For regular classes cancelled 72h in advance, no action is required — everything is handled automatically. For any other situation, reach out:',
    s7btn: 'Send us an email',
    docTitle: 'Refund Policy | Studio Yopaw',
  },
}

export function RefundPolicyPage({ variant }: { variant: 'en' | 'fr' }) {
  const { pickLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const c = COPY[variant]

  useEffect(() => {
    pickLang(variant)
  }, [variant, pickLang])

  useEffect(() => {
    document.title = c.docTitle
  }, [c.docTitle])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="site-wrapper policy-page-root">
      <Navbar scrolled={scrolled} variant="solid" />
      <main className="policy-page">
        <header className="policy-page-header">
          <h1>{c.title}</h1>
          <p className="policy-page-subtitle">{c.subtitle}</p>
        </header>

        <div className="policy-callout policy-callout--brand" role="note">
          <p>{c.callout}</p>
        </div>

        <section className="policy-section" aria-labelledby="policy-s1">
          <h2 id="policy-s1">{c.s1h}</h2>
          <p>{c.s1p}</p>
        </section>

        <section className="policy-section" aria-labelledby="policy-s2">
          <h2 id="policy-s2">{c.s2h}</h2>
          <p>{c.s2p}</p>
          <div className="policy-option-cards">
            <div className="policy-option-card">
              <IconCreditCard className="policy-option-icon" />
              <h3>{c.opt1h}</h3>
              <p>{c.opt1b}</p>
            </div>
            <div className="policy-option-card">
              <IconTicket className="policy-option-icon" />
              <h3>{c.opt2h}</h3>
              <p>{c.opt2b}</p>
            </div>
          </div>
          <p className="policy-muted-block">{c.s2foot}</p>
        </section>

        <section className="policy-section" aria-labelledby="policy-s3">
          <h2 id="policy-s3">{c.s3h}</h2>
          <p>{c.s3p}</p>
        </section>

        <section className="policy-section" aria-labelledby="policy-s4">
          <h2 id="policy-s4">{c.s4h}</h2>
          <p>{c.s4p}</p>
        </section>

        <section className="policy-section" aria-labelledby="policy-s5">
          <h2 id="policy-s5">{c.s5h}</h2>
          <div className="policy-callout policy-callout--soft" role="note">
            <p>{c.s5box}</p>
          </div>
          <p className="policy-actions">
            <a href={MAILTO} className="btn-primary">
              {c.s5btn}
            </a>
          </p>
        </section>

        <section className="policy-section" aria-labelledby="policy-s6">
          <h2 id="policy-s6">{c.s6h}</h2>
          <p>{c.s6p}</p>
        </section>

        <section className="policy-section policy-section--last" aria-labelledby="policy-s7">
          <h2 id="policy-s7">{c.s7h}</h2>
          <p>{c.s7p}</p>
          <p className="policy-actions">
            <a href={MAILTO} className="btn-primary">
              {c.s7btn}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
