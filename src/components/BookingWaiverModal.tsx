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
        Décharge et acceptation des risques
      </h2>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Reconnaissance des risques</h3>
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
        <h3 className="waiver-modal-section-title">Participation volontaire</h3>
        <p>
          Je confirme participer volontairement à l&apos;activité et être physiquement apte à y participer. Je déclare ne présenter aucune condition médicale connue pouvant compromettre ma sécurité ou celle des autres participants. Je comprends qu&apos;il est de ma responsabilité d&apos;agir de façon prudente, respectueuse et sécuritaire envers les animaux, les instructeurs, les employés et les autres participants.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Respect des consignes</h3>
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
        <h3 className="waiver-modal-section-title">Décharge de responsabilité</h3>
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
        <h3 className="waiver-modal-section-title">Responsabilité personnelle</h3>
        <p>
          Je demeure entièrement responsable de mes gestes, de mes effets personnels et des dommages que je pourrais causer à autrui, aux installations ou aux animaux. J&apos;accepte de rembourser tout dommage causé volontairement ou par négligence.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Autorisation de soins d&apos;urgence</h3>
        <p>
          En cas d&apos;urgence, j&apos;autorise Studio Yopaw à communiquer avec les services médicaux d&apos;urgence et à prendre les mesures raisonnables nécessaires pour assurer ma sécurité. Tous les frais médicaux ou de transport demeurent ma responsabilité.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Utilisation d&apos;image</h3>
        <p>
          J&apos;autorise Studio Yopaw à utiliser toute photo ou vidéo prise durant l&apos;activité à des fins promotionnelles, publicitaires ou sur les réseaux sociaux, sans compensation financière.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Mineur</h3>
        <p>
          Pour tout participant mineur, le parent ou tuteur légal signataire reconnaît avoir lu et accepté la présente décharge au nom du mineur.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Acceptation</h3>
        <p>
          Je reconnais avoir lu attentivement la présente décharge, en comprendre le contenu et accepter librement l&apos;ensemble des conditions.
        </p>
      </section>
    </>
  )
}

function WaiverContentEn() {
  return (
    <>
      <h2 id="waiver-modal-title" className="waiver-modal-title">
        Waiver and acceptance of risks
      </h2>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Acknowledgement of risks</h3>
        <p>
          I acknowledge that my participation in activities organized by Studio Yopaw, including but not limited to puppy yoga, interactions with animals, and any related activities, involves certain inherent, foreseeable, or unforeseeable risks.
        </p>
        <p>These risks include, without limitation:</p>
        <ul className="waiver-modal-list">
          <li>bites, scratches, or physical contact with puppies</li>
          <li>allergic reactions</li>
          <li>falls, slips, or physical injuries</li>
          <li>property damage</li>
          <li>unpredictable animal behavior</li>
          <li>possible transmission of illness or bacteria despite sanitary measures in place</li>
        </ul>
        <p>
          I understand that despite all reasonable precautions taken by Studio Yopaw, it is impossible to eliminate all risks entirely.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Voluntary participation</h3>
        <p>
          I confirm that I participate voluntarily in the activity and am physically able to do so. I declare that I have no known medical condition that could compromise my safety or that of other participants. I understand that it is my responsibility to act prudently, respectfully, and safely toward animals, instructors, employees, and other participants.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Compliance with instructions</h3>
        <p>I agree to comply at all times with:</p>
        <ul className="waiver-modal-list">
          <li>directions given by Studio Yopaw</li>
          <li>safety rules</li>
          <li>guidelines relating to animal welfare</li>
          <li>interaction limits imposed with puppies</li>
        </ul>
        <p>
          I understand that Studio Yopaw may immediately end my participation without refund if my behavior is deemed dangerous, disrespectful, or inappropriate.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Release of liability</h3>
        <p>
          In consideration of my participation in Studio Yopaw activities, I voluntarily waive any claim, lawsuit, action, or demand against Studio Yopaw, its owners, administrators, employees, instructors, volunteers, partners, breeders, and representatives for any damage, injury, loss, accident, or harm that may occur during or following my participation.
        </p>
        <p>This release applies in particular to:</p>
        <ul className="waiver-modal-list">
          <li>bodily injury</li>
          <li>property damage</li>
          <li>financial losses</li>
          <li>allergic reactions</li>
          <li>incidents involving puppies</li>
          <li>accidents on the activity premises</li>
        </ul>
        <p>
          This waiver does not apply, however, in cases of gross fault or serious negligence on the part of Studio Yopaw.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Personal responsibility</h3>
        <p>
          I remain fully responsible for my actions, my personal belongings, and any damage I may cause to others, facilities, or animals. I agree to reimburse any damage caused intentionally or through negligence.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Emergency care authorization</h3>
        <p>
          In an emergency, I authorize Studio Yopaw to contact emergency medical services and to take reasonable measures necessary to ensure my safety. All medical or transportation costs remain my responsibility.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Use of likeness</h3>
        <p>
          I authorize Studio Yopaw to use any photo or video taken during the activity for promotional, advertising, or social media purposes, without financial compensation.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Minor</h3>
        <p>
          For any minor participant, the signing parent or legal guardian acknowledges having read and accepted this waiver on behalf of the minor.
        </p>
      </section>

      <section className="waiver-modal-section">
        <h3 className="waiver-modal-section-title">Acceptance</h3>
        <p>
          I acknowledge that I have carefully read this waiver, understand its contents, and freely accept all of the conditions.
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
