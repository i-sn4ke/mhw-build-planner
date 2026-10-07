export type Language = 'en' | 'it'
export type TextDictionary = Readonly<Record<string, string>>

export function createTranslator(language: Language, messages: TextDictionary, gameTexts: TextDictionary) {
  const translate = (text: string | undefined): string => {
    if (text === undefined) return ''
    if (language === 'en') return text
    if (Object.hasOwn(messages, text)) return messages[text]
    return Object.hasOwn(gameTexts, text) ? gameTexts[text] : text
  }
  return (text: string | undefined, values: (string | number | undefined)[] = []): string =>
    translate(text).replace(/\{(\d+)\}/g, (placeholder, index: string) => {
      const value = values[Number(index)]
      return value === undefined ? placeholder : typeof value === 'string' ? translate(value) : String(value)
    })
}

export function bilingualSearchText(name: string, gameTexts: TextDictionary): string {
  return `${name} ${Object.hasOwn(gameTexts, name) ? gameTexts[name] : ''}`
}
