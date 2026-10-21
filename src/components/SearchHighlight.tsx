import { getSearchText } from '../i18n/catalog'
import { useTranslation } from '../i18n/useTranslation'

export default function SearchHighlight({ name, query = '' }: { name: string; query?: string }) {
  const { t } = useTranslation()
  const text = t(name)
  const search = query.trim().toLowerCase()
  if (!search) return text
  const normalized = text.toLowerCase()
  const first = normalized.indexOf(search)
  // A match in the other language still highlights the displayed name.
  if (first < 0) return getSearchText(name).toLowerCase().includes(search)
    ? <mark className="hunter-search-match">{text}</mark> : text
  const parts = []
  let start = 0
  let index = first
  while (index >= 0) {
    parts.push(text.slice(start, index))
    parts.push(<mark key={index} className="hunter-search-match">{text.slice(index, index + search.length)}</mark>)
    start = index + search.length
    index = normalized.indexOf(search, start)
  }
  parts.push(text.slice(start))
  return <>{parts}</>
}
