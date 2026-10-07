import { useMemo } from 'react'
import { create } from 'zustand'
import messages from './messages-it.json'
import { gameTexts } from './catalog'
import { createTranslator, type Language } from './translate'

const storageKey = 'mhw-planner-language'
function initialLanguage(): Language {
  try { return localStorage.getItem(storageKey) === 'it' ? 'it' : 'en' } catch { return 'en' }
}

export const useLanguage = create<{ language: Language; setLanguage: (language: Language) => void }>((set) => ({
  language: initialLanguage(),
  setLanguage: (language) => {
    try { localStorage.setItem(storageKey, language) } catch { /* Language switching also works without storage. */ }
    set({ language })
  },
}))

export function useTranslation() {
  const language = useLanguage((state) => state.language)
  const t = useMemo(() => createTranslator(language, messages, gameTexts), [language])
  return { t, language }
}
