export type Lang = 'en' | 'fr'

export const LANG_STORAGE_KEY = 'studio-yopaw-lang'

export interface ExperienceStepStrings {
  logoAlt: string
  time: string
  title: string
  description: string
}

export interface ClassCardStrings {
  title: string
  duration: string
  description: string
}

export interface GalleryAltStrings {
  session: string
  classSession: string
  happyMoment: string
  yogaFlow: string
  highlight: string
}

export interface TestimonialStrings {
  name: string
  since: string
  quote: string
}

export interface FaqStrings {
  q: string
  a: string
}

export interface SiteStrings {
  metaTitle: string
  metaDescription: string
  navBrand: string
  navToggle: string
  navBook: string
  navLangShort: string
  navLangOtherHint: string
  navSwitchToEnAria: string
  navSwitchToFrAria: string
  navMobileBook: string
  navLinks: {
    howItWorks: string
    classes: string
    reviews: string
    pricing: string
    corporate: string
    faq: string
  }
  langPickerEnglish: string
  langPickerFrench: string
  heroTitleL1: string
  heroTitleL2Prefix: string
  heroTitleItalic: string
  heroSub: string
  heroBook: string
  heroClasses: string
  heroScroll: string
  marqueeItems: string[]
  aboutBadge: string
  aboutHeadingL1: string
  /** e.g. English "Pure " before the italic word; empty in French when the whole phrase is italicized */
  aboutHeadingEmPrefix: string
  aboutHeadingItalic: string
  aboutP1: string
  aboutP2: string
  aboutLink: string
  aboutImgAlt: string
  classesBadge: string
  classesHeading: string
  classesHeadingEm: string
  classesSub: string
  classesBook: string
  classCards: ClassCardStrings[]
  experienceBadge: string
  experienceHeadingPre: string
  experienceHeadingEm: string
  experienceSub: string
  experienceBook: string
  experienceSteps: ExperienceStepStrings[]
  bookingChoiceYin: string
  bookingChoiceGentle: string
  bookingChoiceCorporate: string
  pricingSectionBadge: string
  pricingHeadingPre: string
  /** Plain text before the accented pricing word on the FR second line (“les ”). Empty in EN. */
  pricingHeadingMidLead: string
  pricingHeadingEm: string
  /** Plain text after the accented word on the FR second line (“?”). Empty in EN. */
  pricingHeadingMidTrail: string
  pricingSub: string
  /** Main price figure as shown in the hero card */
  pricingAmount: string
  pricingPlusTaxes: string
  pricingDropInRow: string
  pricingFeat1: string
  pricingFeat2: string
  pricingFeat3: string
  pricingFeat4: string
  pricingFeat5: string
  pricingHeaderSummary: string
  pricingAskClassType: string
  pricingAskMat: string
  pricingMatYes: string
  pricingMatNo: string
  pricingMatHelper: string
  pricingChooseSession: string
  pricingSpotFull: string
  pricingSpotsRemain: string
  pricingContactHeading: string
  pricingLblFullName: string
  pricingLblEmail: string
  pricingLblPhone: string
  pricingSubmitBookSpot: string
  pricingCorporateTitle: string
  pricingCorporateIntro: string
  pricingLblGroupSize: string
  pricingLblEventDetails: string
  pricingCorpPlaceholder: string
  pricingCorporateSubmit: string
  pricingPaymentNote: string
  pricingCancelNote: string
  pricingSuccessPublicTitle: string
  pricingSuccessPublicBody: string
  pricingSuccessChosenDayFallback: string
  pricingSuccessPublicFoot: string
  pricingSuccessRestart: string
  pricingSuccessCorpTitle: string
  pricingSuccessCorpBody: string
  abbrevRequiredTitle: string
  galleryBadge: string
  galleryHeading: string
  galleryHeadingEm: string
  gallerySub: string
  galleryAlts: GalleryAltStrings
  testimonialsBadge: string
  testimonialsHeadingPre: string
  testimonialsHeadingEm: string
  testimonialsSub: string
  testimonialsPrevAria: string
  testimonialsNextAria: string
  testimonialsDotAria: string
  testimonialCards: TestimonialStrings[]
  faqBadge: string
  faqHeading: string
  faqHeadingEm: string
  faqSub: string
  faqItems: FaqStrings[]
  footerTaglineL1: string
  footerTaglineL2: string
  footerIgAria: string
  footerFbAria: string
  footerNavigate: string
  footerFindUs: string
  footerAddressL1: string
  footerAddressL2: string
  footerSite: string
  footerBottom: string
  commonBackAria: string
}

const MARQUEE_SEP = '·'

const enMarqueeBodies = [
  'No Dog Required',
  'Saint-Lazare, QC',
  '60-Minute Sessions',
  'RYT 200 Certified Instructor',
  'Professional Dog Handler On-Site',
  'All Levels Welcome',
  'Up To 20 Spots Per Class',
  'Photo Opportunities Included',
  'Yin & Gentle Flow',
  'Stress Relief Guaranteed',
  'Namaste & Play',
  'Book Online In Minutes',
  '72-Hour Cancellation Policy',
] as const

function buildMarquee(items: readonly string[]): string[] {
  const out: string[] = []
  for (const line of items) {
    out.push(line, MARQUEE_SEP)
  }
  return out
}

export const siteStrings: Record<Lang, SiteStrings> = {
  en: {
    metaTitle: 'Studio Yopaw · Puppy Yoga Studio',
    metaDescription:
      'Studio Yopaw, where puppies and people find their flow. Mindful movement, unconditional love.',
    navBrand: 'Studio Yopaw',
    navToggle: 'Toggle navigation',
    navBook: 'Book a Session',
    navLangOtherHint: 'Switch language',
    navSwitchToEnAria: 'Show site in English',
    navSwitchToFrAria: 'Afficher en français',
    navMobileBook: 'Book a Session',
    navLangShort: 'EN',
    langPickerEnglish: 'English',
    langPickerFrench: 'Français',
    heroTitleL1: 'Yoga. Puppies.',
    heroTitleL2Prefix: 'No dog ',
    heroTitleItalic: 'required.',
    heroSub:
      'Show up, unroll your mat, and let the puppies do the rest. 60 minutes of gentle yoga with a room full of dogs, right here in Saint-Lazare.',
    heroBook: 'Book a Session',
    heroClasses: 'Our Classes',
    heroScroll: 'Scroll',
    marqueeItems: buildMarquee([...enMarqueeBodies]),
    aboutBadge: 'Our Story',
    aboutHeadingL1: 'Yoga. Puppies.',
    aboutHeadingEmPrefix: 'Pure ',
    aboutHeadingItalic: 'Joy',
    aboutP1:
      'Studio Yopaw was born from a beautiful combination: a deep love for dogs and the well-being that yoga provides. Founded in 2026 by Joelle Castonguay in Saint-Lazare, QC, our studio exists to offer animal-assisted therapy to people of all backgrounds.',
    aboutP2:
      "Our RYT 200 certified instructors guide every 60-minute session with care and expertise. Whether you're stepping onto a mat for the first time or deepening a long-time practice, every class is made infinitely better by our four-legged co-instructors.",
    aboutLink: 'Explore our classes →',
    aboutImgAlt: 'Studio Yopaw puppy yoga session',
    classesBadge: 'What We Offer',
    classesHeading: 'One Class. ',
    classesHeadingEm: 'Infinite Joy',
    classesSub: 'No dog required. Just show up, breathe, and let the puppies find you.',
    classesBook: 'Book Your Class',
    classCards: [
      {
        title: 'Puppy Yoga: Yin',
        duration: '60 min',
        description:
          'A slow, meditative practice accompanied by adorable puppies. Designed for all levels, with the perfect balance of stillness, breathing, and puppy cuddles.',
      },
      {
        title: 'Puppy Yoga: Gentle Flow',
        duration: '60 min',
        description:
          'Beginner-friendly movement in a warm, welcoming atmosphere. Explore yoga at your own pace while our puppies bring endless joy to your mat.',
      },
      {
        title: 'Private & Corporate',
        duration: 'Flexible',
        description:
          'Planning a birthday, bachelorette, or team day? We bring the puppies, you bring the people. Groups up to 20.',
      },
    ],
    experienceBadge: 'NO DOG REQUIRED · SAINT-LAZARE, QC',
    experienceHeadingPre: '60 Minutes You ',
    experienceHeadingEm: "Won't Stop Talking About",
    experienceSub: 'Gentle yoga, a room full of puppies, and zero stress, no dog required.',
    experienceBook: 'Book Your Spot',
    experienceSteps: [
      {
        logoAlt: 'Warm up',
        time: '15 min',
        title: 'Warm Up',
        description:
          'Breathe, settle, and forget about your day. Gentle movement, soft music, just you and your mat.',
      },
      {
        logoAlt: 'Flow with puppies',
        time: '15 min',
        title: 'Flow With Pups',
        description:
          "That's when the puppies arrive. Our certified handler releases the dogs and good luck keeping a straight face.",
      },
      {
        logoAlt: 'Play and connect',
        time: '30 min',
        title: 'Play & Connect',
        description:
          'Mats down, phones out. Free play, cuddles, and as many photos as your heart desires. Pure chaos. Pure joy.',
      },
    ],
    bookingChoiceYin: 'Puppy Yoga: Yin',
    bookingChoiceGentle: 'Puppy Yoga: Gentle Flow',
    bookingChoiceCorporate: 'Private / Corporate Event',
    pricingSectionBadge: 'Book Your Spot',
    pricingHeadingPre: 'Ready to Meet the ',
    pricingHeadingMidLead: '',
    pricingHeadingEm: 'Pups?',
    pricingHeadingMidTrail: '',
    pricingSub: "Pick your class, choose a date, and we'll see you on the mat.",
    pricingAmount: '$46',
    pricingPlusTaxes: '+ taxes',
    pricingDropInRow: 'Drop-In · Per Class',
    pricingFeat1: '✓ 60-minute guided session',
    pricingFeat2: '✓ RYT 200 certified instructor',
    pricingFeat3: '✓ Professional dog handler on-site',
    pricingFeat4: '✓ Photo opportunities included',
    pricingFeat5: '✓ Yoga mat rental on-site ($5)',
    pricingHeaderSummary: '$46 + taxes · Drop-in per class',
    pricingAskClassType: 'What kind of class are you looking for?',
    pricingAskMat: 'Do you have your own yoga mat?',
    pricingMatYes: "Yes, I'll bring mine",
    pricingMatNo: "No, I'll rent one on-site",
    pricingMatHelper: 'Yoga mat rental available on-site for $5',
    pricingChooseSession: 'Choose your session',
    pricingSpotFull: 'Full',
    pricingSpotsRemain: '{count} spots remaining',
    pricingContactHeading: 'Almost there, how do we reach you?',
    pricingLblFullName: 'Full name',
    pricingLblEmail: 'Email address',
    pricingLblPhone: 'Phone number',
    pricingSubmitBookSpot: 'Book Your Spot',
    pricingCorporateTitle: "Let's plan your event",
    pricingCorporateIntro:
      "Private and corporate bookings are fully customized. Fill out the form below and we'll get back to you within 24 hours to plan everything.",
    pricingLblGroupSize: 'Group size',
    pricingLblEventDetails: 'Tell us about your event',
    pricingCorpPlaceholder: 'Type of event, preferred date,\nany special requests…',
    pricingCorporateSubmit: 'Send My Request',
    pricingPaymentNote: '💳 Payment at time of booking (online)',
    pricingCancelNote: '↩ 72-hour cancellation · Full refund or credit',
    pricingSuccessPublicTitle: "You're on the mat! 🐾",
    pricingSuccessPublicBody: "We'll send your confirmation to {email}. See you on {date}.",
    pricingSuccessChosenDayFallback: 'your chosen day',
    pricingSuccessPublicFoot: 'Questions? Email us at studioyopaw@gmail.com',
    pricingSuccessRestart: 'Book another spot',
    pricingSuccessCorpTitle: 'Request received! 🐾',
    pricingSuccessCorpBody: "We'll be in touch within 24 hours to plan your perfect event.",
    abbrevRequiredTitle: 'required',
    galleryBadge: 'The Studio',
    galleryHeading: 'Moments of ',
    galleryHeadingEm: 'Joy',
    gallerySub: 'Every session is a memory in the making.',
    galleryAlts: {
      session: 'Studio Yopaw session',
      classSession: 'Class in session',
      happyMoment: 'Happy pup moment',
      yogaFlow: 'Yoga flow with puppies',
      highlight: 'Studio highlight',
    },
    testimonialsBadge: 'Real Experiences',
    testimonialsHeadingPre: 'One Class. Hooked for ',
    testimonialsHeadingEm: 'Life.',
    testimonialsSub: "Don't take our word for it. Here's what first-timers have to say.",
    testimonialsPrevAria: 'Previous review',
    testimonialsNextAria: 'Next review',
    testimonialsDotAria: 'Go to testimonial',
    testimonialCards: [
      {
        name: 'Sarah M.',
        since: 'Yoga participant',
        quote:
          "I've tried every yoga studio in the city, but nothing compares to the pure joy of practicing with puppies. It completely transformed my relationship with mindfulness.",
      },
      {
        name: 'Jamie L.',
        since: 'Regular attendee',
        quote:
          "The instructors are incredible, the puppies are adorable, and the atmosphere is so welcoming. It's genuinely the highlight of my week, every single week.",
      },
      {
        name: 'Priya K.',
        since: 'First-time visitor',
        quote:
          "As someone who struggles with anxiety, puppy yoga has been genuinely therapeutic. The combination of mindful movement and puppy cuddles is simply unbeatable.",
      },
    ],
    faqBadge: 'Got Questions?',
    faqHeading: 'Frequently Asked ',
    faqHeadingEm: 'Questions',
    faqSub: 'Everything you need to know before your first class.',
    faqItems: [
      {
        q: 'Do I need to own a dog to attend?',
        a: "Not at all, that's the beauty of it. Our professional dog handler brings all the puppies. You just show up, unroll your mat, and the dogs come to you. No dog ownership required.",
      },
      {
        q: 'Do I need yoga experience?',
        a: 'Zero experience needed. Our classes are yin and gentle flow: slow, accessible, and beginner-friendly. If you can breathe, you can do this.',
      },
      {
        q: 'Will the dogs interrupt my practice?',
        a: "That's kind of the whole point. The dogs roam freely during the session, which means you might get a puppy on your mat, a lick on the face, or a cuddle mid-pose. Our certified handler supervises the whole time to keep things joyful and safe.",
      },
      {
        q: 'What should I bring?',
        a: "Just yourself and comfortable clothing. Yoga mats are available to rent on-site for $5 if you don't have one. We recommend wearing clothes you don't mind getting a little dog hair on.",
      },
      {
        q: 'What is your cancellation policy?',
        a: 'We require 72 hours notice for a full refund or credit toward a future session. Cancellations made less than 72 hours before the class are non-refundable.',
      },
    ],
    footerTaglineL1: 'Animal-assisted therapy through yoga.',
    footerTaglineL2: 'Where every pose is better with a pup.',
    footerIgAria: 'Instagram',
    footerFbAria: 'Facebook',
    footerNavigate: 'Navigate',
    footerFindUs: 'Find Us',
    footerAddressL1: '1515A Des Marguerites St.',
    footerAddressL2: 'Saint-Lazare, QC J7T 2R8',
    footerSite: 'www.studioyopaw.ca',
    footerBottom: '© 2026 Studio Yopaw · Saint-Lazare, QC · Made with 🐾',
    commonBackAria: 'Back',
    navLinks: {
      howItWorks: 'How It Works',
      classes: 'Classes',
      reviews: 'Reviews',
      pricing: 'Pricing',
      corporate: 'Corporate',
      faq: 'FAQ',
    },
  },
  fr: {
    metaTitle: 'Studio Yopaw · Studio de yoga avec chiots',
    metaDescription:
      'Studio Yopaw : où les chiots et les humains retrouvent leur flow. Mouvement conscient, amour inconditionnel.',
    navBrand: 'Studio Yopaw',
    navToggle: 'Ouvrir le menu',
    navBook: 'Réserver une séance',
    navLangShort: 'FR',
    navLangOtherHint: 'Changer de langue',
    navSwitchToEnAria: 'Afficher en anglais',
    navSwitchToFrAria: 'Voir le site en français',
    navMobileBook: 'Réserver une séance',
    langPickerEnglish: 'English',
    langPickerFrench: 'Français',
    heroTitleL1: 'Yoga. Chiots.',
    heroTitleL2Prefix: 'Pas besoin ',
    heroTitleItalic: "d'un chien.",
    heroSub:
      'Venez comme vous êtes, déroulez votre tapis et laissez les chiots faire le reste. 60 minutes de yoga doux avec une salle pleine de chiots, ici même à Saint-Lazare.',
    heroBook: 'Réserver une séance',
    heroClasses: 'Nos cours',
    heroScroll: 'Défiler',
    marqueeItems: buildMarquee([
      'Aucun chien requis',
      'Saint-Lazare, QC',
      'Séances de 60 minutes',
      'Instructrice certifiée RYT 200',
      'Dresseuse professionnelle sur place',
      'Tous niveaux bienvenus',
      "Jusqu'à 20 places par cours",
      'Photos incluses',
      'Yin et fluide doux',
      'Stress : on s’en occupe',
      'Namaste et jeu',
      'Réservation en ligne en quelques minutes',
      'Politique d’annulation : 72 heures',
    ]),
    aboutBadge: 'Notre histoire',
    aboutHeadingL1: 'Yoga. Chiots.',
    aboutHeadingEmPrefix: '',
    aboutHeadingItalic: 'Joie pure',
    aboutP1:
      "Studio Yopaw est né d’un beau mariage : l’amour des chiens et le bien-être que procure le yoga. Fondé en 2026 par Joelle Castonguay à Saint-Lazare, au Québec, notre studio propose une thérapie assistée par les animaux à toutes et tous.",
    aboutP2:
      "Nos instructrices certifiées RYT 200 encadrent chaque séance de 60 minutes avec soin et expertise. Que ce soit votre tout premier cours ou une pratique déjà bien ancrée, nos co-instructeurs à quatre pattes rendent tout plus magique.",
    aboutLink: 'Découvrir nos cours →',
    aboutImgAlt: 'Séance de yoga avec chiots Studio Yopaw',
    classesBadge: 'Ce qu’on propose',
    classesHeading: 'Un cours. ',
    classesHeadingEm: 'Une joie infinie',
    classesSub: "Pas besoin d'un chien : venez respirer et laissez les chiots vous trouver.",
    classesBook: 'Réserver votre cours',
    classCards: [
      {
        title: 'Yoga chiots : Yin',
        duration: '60 min',
        description:
          'Une pratique lente et méditative accompagnée d’adorables chiots. Pour tous les niveaux, entre calme, respiration et câlins.',
      },
      {
        title: 'Yoga chiots : Flux doux',
        duration: '60 min',
        description:
          'Des mouvements accessibles dans une ambiance chaleureuse. Avancez à votre rythme pendant que nos chiots égayent votre tapis.',
      },
      {
        title: 'Privé et corporatif',
        duration: 'Flexible',
        description:
          "Anniversaire, fête d'équipe ou EVJF ? On amène les chiots, vous amenez vos proches ou votre équipe. Jusqu'à 20 personnes.",
      },
    ],
    experienceBadge: "PAS BESOIN D'UN CHIEN · SAINT-LAZARE, QC",
    experienceHeadingPre: '60 minutes dont vous ',
    experienceHeadingEm: 'parlerez encore',
    experienceSub:
      'Du yoga tout en douceur, une salle pleine de chiots, zéro stress. Aucun chien requis.',
    experienceBook: 'Réserver votre place',
    experienceSteps: [
      {
        logoAlt: 'Échauffement',
        time: '15 min',
        title: 'Échauffement',
        description:
          'On respire, on se pose, on laisse la journée derrière. Mouvements doux, musique douce, vous et votre tapis.',
      },
      {
        logoAlt: 'En flux avec les chiots',
        time: '15 min',
        title: 'En flux avec les chiots',
        description:
          "C'est l'entrée des chiots. Notre éducateur canin certifié les libère dans la salle. Bonne chance pour garder votre sérieux.",
      },
      {
        logoAlt: 'Jeux et complicité',
        time: '30 min',
        title: 'Jeu et complicité',
        description:
          'Tapis roulés, téléphones sortis : jeu libre, câlins et autant de photos que vous le voulez. Chaos total. Pure joie.',
      },
    ],
    bookingChoiceYin: 'Yoga chiots : Yin',
    bookingChoiceGentle: 'Yoga chiots : Flux doux',
    bookingChoiceCorporate: 'Événement privé / corporatif',
    pricingSectionBadge: 'Réservez votre place',
    pricingHeadingPre: 'Prêt·e à rencontrer',
    pricingHeadingMidLead: 'les ',
    pricingHeadingEm: 'chiots',
    pricingHeadingMidTrail: '?',
    pricingSub:
      'Choisissez votre type de cours, une date de fin de semaine, et rendez-vous sur le tapis.',
    pricingAmount: '46 $',
    pricingPlusTaxes: '+ taxes',
    pricingDropInRow: 'À la séance · Par cours',
    pricingFeat1: '✓ Séance guidée de 60 minutes',
    pricingFeat2: '✓ Instructrice certifiée RYT 200',
    pricingFeat3: '✓ Dresseuse professionnelle sur place',
    pricingFeat4: '✓ Occasions photo incluses',
    pricingFeat5: '✓ Location de tapis sur place (5 $)',
    pricingHeaderSummary: '46 $ + taxes · À la séance',
    pricingAskClassType: 'Quel type de cours recherchez-vous ?',
    pricingAskMat: 'Avez-vous votre propre tapis de yoga ?',
    pricingMatYes: 'Oui, j’apporte le mien',
    pricingMatNo: 'Non, je louerai sur place',
    pricingMatHelper: 'Location de tapis sur place pour 5 $',
    pricingChooseSession: 'Choisissez votre séance',
    pricingSpotFull: 'Complet',
    pricingSpotsRemain: '{count} places restantes',
    pricingContactHeading: 'Presque fini : comment vous joindre ?',
    pricingLblFullName: 'Nom complet',
    pricingLblEmail: 'Courriel',
    pricingLblPhone: 'Téléphone',
    pricingSubmitBookSpot: 'Réserver ma place',
    pricingCorporateTitle: 'Planifions votre événement',
    pricingCorporateIntro:
      'Les réservations privées et corporatives sont entièrement personnalisées. Remplissez le formulaire et nous communiquerons avec vous sous 24 h pour tout organiser.',
    pricingLblGroupSize: 'Taille du groupe',
    pricingLblEventDetails: 'Parlez-nous de votre événement',
    pricingCorpPlaceholder:
      'Type d’événement, date souhaitée,\ndemandes particulières…',
    pricingCorporateSubmit: 'Envoyer ma demande',
    pricingPaymentNote: '💳 Paiement à la réservation (en ligne)',
    pricingCancelNote: '↩ Annulation : 72 h · Remboursement complet ou crédit',
    pricingSuccessPublicTitle: 'Vous êtes sur le tapis ! 🐾',
    pricingSuccessPublicBody:
      'Nous enverrons la confirmation à {email}. Rendez-vous le {date}.',
    pricingSuccessChosenDayFallback: 'votre date choisie',
    pricingSuccessPublicFoot: 'Questions ? Écrivez-nous à studioyopaw@gmail.com',
    pricingSuccessRestart: 'Réserver une autre place',
    pricingSuccessCorpTitle: 'Demande reçue ! 🐾',
    pricingSuccessCorpBody:
      'Nous communiquons avec vous dans les prochaines 24 h pour planifier votre événement idéal.',
    abbrevRequiredTitle: 'obligatoire',
    galleryBadge: 'Le studio',
    galleryHeading: 'Des moments ',
    galleryHeadingEm: 'de joie',
    gallerySub: 'Chaque séance devient un souvenir précieux.',
    galleryAlts: {
      session: 'Séance Studio Yopaw',
      classSession: 'Cours en studio',
      happyMoment: 'Moment chiot complice',
      yogaFlow: 'Yoga avec chiots',
      highlight: 'Coup de cœur du studio',
    },
    testimonialsBadge: 'Expériences vécues',
    testimonialsHeadingPre: 'Un cours. Accro ',
    testimonialsHeadingEm: 'pour toujours.',
    testimonialsSub:
      'Pas besoin de nous croire sur parole : voici ce qu’en disent les nouveau·elles.',
    testimonialsPrevAria: 'Témoignage précédent',
    testimonialsNextAria: 'Témoignage suivant',
    testimonialsDotAria: 'Aller au témoignage',
    testimonialCards: [
      {
        name: 'Sarah M.',
        since: 'Participante',
        quote:
          "J'ai essayé plein de studios, mais aucun comme celui où l'on pratique avec des chiots. Ça m'a complètement changé ma façon de rester présente.",
      },
      {
        name: 'Jamie L.',
        since: 'Habitué·e',
        quote:
          "Les profs sont fantastiques, les chiots craquants, l’ambiance accueillante. C’est le moment que j’anticipe le plus chaque semaine.",
      },
      {
        name: 'Priya K.',
        since: 'Première visite',
        quote:
          "Avec mon anxiété, le yoga-chiots fait un bien fou. Mouvements conscients + câlins canins : imbattable.",
      },
    ],
    faqBadge: 'Une question ?',
    faqHeading: 'Foire ',
    faqHeadingEm: 'aux questions',
    faqSub: 'Tout ce qu’il faut savoir avant votre premier cours.',
    faqItems: [
      {
        q: 'Faut-il posséder un chien pour participer ?',
        a: 'Pas du tout : notre équipe ramène tous les chiots. Vous déroulez votre tapis et les toutous viennent vers vous — aucune propriété de chien requise.',
      },
      {
        q: 'Faut-il savoir faire du yoga ?',
        a: 'Aucune expérience n’est nécessaire. Yin et flux doux : lent, accessible, débutants bienvenus. Si vous respirez, vous pouvez suivre.',
      },
      {
        q: 'Est-ce que les chiens vont me déconcentrer ?',
        a: 'C’est un peu tout l’effet magique ! Les chiots circulent pendant la séance ; un chiot sur votre tapis ou un coup de museau arrive tout le temps. Notre dresseuse certifiée veille au bon déroulé, joyeux et sécuritaire.',
      },
      {
        q: 'Que dois-je apporter ?',
        a: 'Vous-même et une tenue confortable. Tapis de location à 5 $ si besoin — choisissez des vêtements dont vous ne mourrez pas s’ils ramassent un peu de poils.',
      },
      {
        q: 'Politique d’annulation ?',
        a: 'Préavis de 72 h pour un remboursement ou un crédit complet. Au-delà, les annulations tardives sont non remboursables.',
      },
    ],
    footerTaglineL1: 'Thérapie assistée par les animaux avec le yoga.',
    footerTaglineL2: 'Chaque posture est meilleure avec un chiot.',
    footerIgAria: 'Instagram',
    footerFbAria: 'Facebook',
    footerNavigate: 'Navigation',
    footerFindUs: 'Nous joindre',
    footerAddressL1: '1515A, rue des Marguerites',
    footerAddressL2: 'Saint-Lazare, QC J7T 2R8',
    footerSite: 'www.studioyopaw.ca',
    footerBottom:
      '© 2026 Studio Yopaw · Saint-Lazare, QC · Fabriqué avec 🐾',
    commonBackAria: 'Retour',
    navLinks: {
      howItWorks: 'Fonctionnement',
      classes: 'Cours',
      reviews: 'Avis',
      pricing: 'Tarifs',
      corporate: 'Corporatif',
      faq: 'FAQ',
    },
  },
}
