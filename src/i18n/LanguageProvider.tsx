import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LANG_STORAGE_KEY, type Lang, siteStrings, type SiteStrings } from './siteStrings'


type LanguageContextValue = {
  lang: Lang
  s: SiteStrings
  pickingLanguage: boolean
  pickLang: (l: Lang) => void
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLang(): Lang | null {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    if (raw === 'en' || raw === 'fr') return raw
  } catch {
    /* private mode */
  }
  return null
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const storedOnInit = typeof window !== 'undefined' ? readStoredLang() : null
  const [lang, setLang] = useState<Lang>(() => storedOnInit ?? 'en')
  const [pickingLanguage, setPickingLanguage] = useState(() => storedOnInit === null)

  const pickLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
    setLang(l)
    setPickingLanguage(false)
  }, [])

  const toggleLang = useCallback(() => {
    const next: Lang = lang === 'en' ? 'fr' : 'en'
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setLang(next)
  }, [lang])

  const s = siteStrings[lang]

  useEffect(() => {
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'en'
    document.title = siteStrings[lang].metaTitle
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', siteStrings[lang].metaDescription)
  }, [lang])

  useEffect(() => {
    if (!pickingLanguage) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [pickingLanguage])

  const value = useMemo(
    () => ({ lang, s, pickingLanguage, pickLang, toggleLang }),
    [lang, s, pickingLanguage, pickLang, toggleLang]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {pickingLanguage && (
        <div className="lang-picker-overlay" role="dialog" aria-modal="true" aria-labelledby="lang-picker-heading">
          <div className="lang-picker-modal">
            <div className="lang-picker-brand">
              <img src="/yopawlogo.png" alt="" className="lang-picker-logo-img" />
              <span className="lang-picker-brand-name">Studio Yopaw</span>
            </div>
            <p id="lang-picker-heading" className="lang-picker-prompt">
              Choose your language / Choisissez votre langue
            </p>
            <div className="lang-picker-actions">
              <button type="button" className="btn-primary lang-picker-btn" onClick={() => pickLang('en')}>
                {siteStrings.en.langPickerEnglish}
              </button>
              <button type="button" className="btn-ghost lang-picker-btn" onClick={() => pickLang('fr')}>
                {siteStrings.en.langPickerFrench}
              </button>
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`)
}
