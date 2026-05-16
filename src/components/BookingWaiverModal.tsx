import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Lang } from '../i18n/siteStrings'

type Props = {
  lang: Lang
  open: boolean
  onClose: () => void
  closeAriaLabel: string
}

function WaiverContentFr() {
  return (
    <>
      <h2 id="waiver-modal-title" className="waiver-modal-title">
        Décharge et politique de remboursement
      </h2>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">1. Reconnaissance des risques</h3>
        <p>
          Je reconnais que ma participation aux activités organisées par Studio Yopaw, incluant notamment le yoga avec chiots, les interactions avec des animaux et toute activité connexe, comporte certains risques inhérents, prévisibles ou imprévisibles.
        </p>
        <p>Ces risques incluent notamment, sans s&apos;y limiter :</p>
        <ul className="waiver-modal-list">
          <li>morsures, griffures ou contacts physiques avec les chiots</li>
          <li>réactions allergiques</li>
          <li>chutes, glissades ou blessures physiques</li>
          <li>dommages matériels</li>
          <li>comportements imprévisibles d&apos;animaux</li>
          <li>transmission possible de maladies ou bactéries malgré les mesures sanitaires en place</li>
        </ul>
        <p>
          Je comprends que, malgré toutes les précautions raisonnables prises par Studio Yopaw, il est impossible d&apos;éliminer complètement tous les risques.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">2. Participation volontaire</h3>
        <p>
          Je confirme participer volontairement à l&apos;activité et être physiquement apte à y participer.
        </p>
        <p>
          Je déclare ne présenter aucune condition médicale connue pouvant compromettre ma sécurité ou celle des autres participants.
        </p>
        <p>
          Je comprends qu&apos;il est de ma responsabilité d&apos;agir de façon prudente, respectueuse et sécuritaire envers les animaux, les instructeurs, les employés et les autres participants.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">3. Respect des consignes et instructions</h3>
        <p>Je m&apos;engage à respecter en tout temps :</p>
        <ul className="waiver-modal-list">
          <li>les directives données par Studio Yopaw</li>
          <li>les règles de sécurité</li>
          <li>les consignes relatives au bien-être animal</li>
          <li>les limites d&apos;interaction imposées avec les chiots</li>
        </ul>
        <p>
          Je comprends que Studio Yopaw peut mettre fin immédiatement à ma participation sans remboursement si mon comportement est jugé dangereux, irrespectueux ou inapproprié.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">4. Décharge de responsabilité</h3>
        <p>
          En contrepartie de ma participation aux activités de Studio Yopaw, je renonce volontairement à toute réclamation, poursuite, action ou demande contre Studio Yopaw, ses propriétaires, administrateurs, employés, instructeurs, bénévoles, partenaires, éleveurs et représentants pour tout dommage, blessure, perte, accident ou préjudice pouvant survenir durant ou à la suite de ma participation.
        </p>
        <p>Cette décharge s&apos;applique notamment :</p>
        <ul className="waiver-modal-list">
          <li>aux blessures corporelles</li>
          <li>aux dommages matériels</li>
          <li>aux pertes financières</li>
          <li>aux réactions allergiques</li>
          <li>aux incidents impliquant les chiots</li>
          <li>aux accidents sur les lieux de l&apos;activité</li>
        </ul>
        <p>
          La présente décharge ne s&apos;applique toutefois pas en cas de faute lourde ou de négligence grave de Studio Yopaw.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">5. Responsabilité personnelle</h3>
        <p>Je demeure entièrement responsable de :</p>
        <ul className="waiver-modal-list">
          <li>mes gestes</li>
          <li>mes effets personnels</li>
          <li>tout dommage que je pourrais causer à autrui, aux installations ou aux animaux</li>
        </ul>
        <p>J&apos;accepte de rembourser tout dommage causé volontairement ou par négligence.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">6. Autorisation de soins d&apos;urgence</h3>
        <p>
          En cas d&apos;urgence, j&apos;autorise Studio Yopaw à communiquer avec les services médicaux d&apos;urgence et à prendre les mesures raisonnables nécessaires pour assurer ma sécurité.
        </p>
        <p>Tous les frais médicaux ou de transport demeurent ma responsabilité.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">7. Utilisation d&apos;image</h3>
        <p>
          J&apos;autorise Studio Yopaw à utiliser toute photo ou vidéo prise durant l&apos;activité à des fins promotionnelles, publicitaires ou sur les réseaux sociaux, sans compensation financière.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">8. Mineurs</h3>
        <p>
          Pour tout participant mineur, le parent ou tuteur légal signataire reconnaît avoir lu et accepté la présente décharge au nom du mineur.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">9. Acceptation</h3>
        <p>
          Je reconnais avoir lu attentivement la présente décharge, en comprendre le contenu et accepter librement l&apos;ensemble des conditions.
        </p>
      </section>

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid rgba(244,114,182,0.25)' }} />

      <h2 className="waiver-modal-title" style={{ marginBottom: '24px' }}>
        Politique de remboursement – Studio Yopaw
      </h2>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">1. Paiement</h3>
        <p>
          Le paiement complet est requis pour confirmer la réservation de toute séance ou événement offert par Studio Yopaw.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">2. Annulation par le client</h3>
        <p>
          Les clients peuvent annuler leur réservation sans pénalité, à condition que Studio Yopaw soit avisé au moins 72 heures avant le début de la séance.
        </p>
        <p>Dans ce cas, le client peut choisir entre :</p>
        <ul className="waiver-modal-list">
          <li>un remboursement complet au mode de paiement original</li>
          <li>un crédit applicable à une séance future</li>
        </ul>
        <p>Toute annulation effectuée moins de 72 heures avant la séance est finale et non remboursable.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">3. Retards et absences</h3>
        <p>
          Les participants doivent se présenter à l&apos;heure prévue. Studio Yopaw recommande fortement d&apos;arriver 15 minutes à l&apos;avance.
        </p>
        <p>
          Tout retard de 15 minutes ou plus peut être considéré comme une absence et entraîner l&apos;annulation de la participation ainsi que la perte totale du montant payé, sans remboursement ni crédit. Toute absence sans préavis est également non remboursable.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">4. Annulation par Studio Yopaw</h3>
        <p>
          Si Studio Yopaw doit annuler une séance ou un événement pour des raisons indépendantes de sa volonté, le client recevra un remboursement complet ou un crédit complet applicable à une séance future, à son choix. En plus du remboursement ou du crédit, Studio Yopaw offrira un crédit supplémentaire équivalant à 25 % de la valeur de la séance.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">5. Acceptation</h3>
        <p>
          En procédant au paiement ou en réservant une séance, le client reconnaît avoir lu, compris et accepté la présente politique de remboursement.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">6. Soumettre une demande de remboursement</h3>
        <p>
          Pour toute demande conforme aux délais prévus dans cette politique, veuillez communiquer avec Studio Yopaw à :{' '}
          <a href="mailto:studioyopaw@gmail.com" style={{ color: 'var(--sage-dark)' }}>studioyopaw@gmail.com</a>
        </p>
      </section>
    </>
  )
}

function WaiverContentEn() {
  return (
    <>
      <h2 id="waiver-modal-title" className="waiver-modal-title">
        Waiver and Refund Policy
      </h2>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">1. Acknowledgment of Risks</h3>
        <p>
          I acknowledge that my participation in activities organized by Yopaw Studio, including but not limited to puppy yoga, interactions with animals, and any related activities, involves certain inherent, foreseeable, or unforeseeable risks.
        </p>
        <p>These risks include, but are not limited to:</p>
        <ul className="waiver-modal-list">
          <li>bites, scratches, or physical contact with puppies</li>
          <li>allergic reactions</li>
          <li>falls, slips, or physical injuries</li>
          <li>property damage</li>
          <li>unpredictable animal behavior</li>
          <li>possible transmission of illnesses or bacteria despite sanitary measures in place</li>
        </ul>
        <p>
          I understand that, despite all reasonable precautions taken by Yopaw Studio, it is impossible to completely eliminate all risks.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">2. Voluntary Participation</h3>
        <p>I confirm that I am voluntarily participating in the activity and that I am physically fit to do so.</p>
        <p>I declare that I do not have any known medical condition that could compromise my safety or the safety of other participants.</p>
        <p>I understand that it is my responsibility to act in a prudent, respectful, and safe manner toward the animals, instructors, employees, and other participants.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">3. Compliance with Rules and Instructions</h3>
        <p>I agree to comply at all times with:</p>
        <ul className="waiver-modal-list">
          <li>the instructions provided by Yopaw Studio</li>
          <li>all safety rules</li>
          <li>all animal welfare guidelines</li>
          <li>all interaction limits imposed regarding the puppies</li>
        </ul>
        <p>
          I understand that Yopaw Studio may immediately terminate my participation without refund if my behavior is deemed dangerous, disrespectful, or inappropriate.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">4. Release of Liability</h3>
        <p>
          In consideration of my participation in activities organized by Yopaw Studio, I voluntarily waive and release any claim, lawsuit, action, or demand against Yopaw Studio, its owners, directors, employees, instructors, volunteers, partners, breeders, and representatives for any damage, injury, loss, accident, or harm that may occur during or as a result of my participation.
        </p>
        <p>This release applies, in particular, to:</p>
        <ul className="waiver-modal-list">
          <li>bodily injuries</li>
          <li>property damage</li>
          <li>financial losses</li>
          <li>allergic reactions</li>
          <li>incidents involving the puppies</li>
          <li>accidents occurring at the activity location</li>
        </ul>
        <p>
          However, this waiver does not apply in cases of gross negligence or willful misconduct by Yopaw Studio.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">5. Personal Responsibility</h3>
        <p>I remain fully responsible for:</p>
        <ul className="waiver-modal-list">
          <li>my actions</li>
          <li>my personal belongings</li>
          <li>any damage I may cause to others, the facilities, or the animals</li>
        </ul>
        <p>I agree to reimburse any damage caused intentionally or through negligence.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">6. Emergency Medical Authorization</h3>
        <p>
          In the event of an emergency, I authorize Yopaw Studio to contact emergency medical services and to take any reasonable measures necessary to ensure my safety.
        </p>
        <p>Any medical or transportation costs remain my responsibility.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">7. Use of Image and Likeness</h3>
        <p>
          I authorize Yopaw Studio to use any photographs or videos taken during the activity for promotional, advertising, or social media purposes, without financial compensation.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">8. Minors</h3>
        <p>
          For any minor participant, the signing parent or legal guardian acknowledges having read and accepted this waiver on behalf of the minor.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">9. Acceptance</h3>
        <p>
          I acknowledge that I have carefully read this waiver, understand its contents, and freely accept all of its terms and conditions.
        </p>
      </section>

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid rgba(244,114,182,0.25)' }} />

      <h2 className="waiver-modal-title" style={{ marginBottom: '24px' }}>
        Refund Policy – Yopaw Studio
      </h2>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">1. Payment</h3>
        <p>
          Full payment is required to confirm the reservation of any session or event offered by Yopaw Studio.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">2. Cancellation by the Client</h3>
        <p>
          Clients may cancel their reservation without penalty provided that Yopaw Studio is notified at least 72 hours before the start of the session.
        </p>
        <p>In such cases, the client may choose between:</p>
        <ul className="waiver-modal-list">
          <li>a full refund issued to the original method of payment</li>
          <li>a credit applicable toward a future session</li>
        </ul>
        <p>Any cancellation made less than 72 hours before the start of the session is final and non-refundable.</p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">3. Late Arrivals and No-Shows</h3>
        <p>
          Participants must arrive at the scheduled time. Yopaw Studio strongly recommends arriving 15 minutes early.
        </p>
        <p>
          Any delay of 15 minutes or more may be considered a no-show and may result in cancellation of participation and full forfeiture of the amount paid, without refund or credit. Any absence without prior notice is also non-refundable.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">4. Cancellation by Yopaw Studio</h3>
        <p>
          If Yopaw Studio must cancel a session or event for reasons beyond its control, the client will receive a full refund or a full credit toward a future session, at the client&apos;s choice. In addition, Yopaw Studio will offer an additional credit equal to 25% of the session value.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">5. Acceptance</h3>
        <p>
          By proceeding with payment or booking a session, the client acknowledges having read, understood, and accepted this refund policy.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">6. Submitting a Refund Request</h3>
        <p>
          For any modification or request that complies with the timelines outlined in this policy, please contact Yopaw Studio at:{' '}
          <a href="mailto:studioyopaw@gmail.com" style={{ color: 'var(--sage-dark)' }}>studioyopaw@gmail.com</a>
        </p>
      </section>
    </>
  )
}

export function BookingWaiverModal({ lang, open, onClose, closeAriaLabel }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="waiver-modal-overlay" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waiver-modal-title"
        className="waiver-modal-dialog"
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="waiver-modal-close" aria-label={closeAriaLabel} onClick={onClose}>
          ×
        </button>
        <div className="waiver-modal-scroll">
          {lang === 'fr' ? <WaiverContentFr /> : <WaiverContentEn />}
        </div>
      </div>
    </div>,
    document.body
  )
}
