import { create } from 'zustand'
import en from '../translations/en.json'

type Lang = 'en'

type DictValue = string | { [key: string]: DictValue }
type Dict = Record<string, DictValue>

const FALLBACK_LABELS: Record<string, string> = {
  'CAT.EXPLORE_TITLE': 'Shop by Category',
  'CAT.EXPLORE_SUB': 'Everything you need for weddings, festivals, and everyday elegance',
  'cat.explore_title': 'Shop by Category',
  'cat.explore_sub': 'Everything you need for weddings, festivals, and everyday elegance',
  'common.shopNow': 'Shop Now',
}

const LEGACY_KEY_ALIASES: Record<string, string> = {
  'CAT.EXPLORE_TITLE': 'cat.title',
  'CAT.EXPLORE_SUB': 'cat.sub',
  'cat.explore_title': 'cat.title',
  'cat.explore_sub': 'cat.sub',
}

interface LangState {
  lang: Lang
  t: (key: string) => string
}

const dict: Dict = en

const getTranslation = (dictionary: Dict, key: string): string | undefined => {
  const aliasKey = LEGACY_KEY_ALIASES[key] || LEGACY_KEY_ALIASES[key.toLowerCase()] || key
  const direct = dictionary[aliasKey]
  if (typeof direct === 'string') return direct

  let current: DictValue | undefined = dictionary
  for (const part of aliasKey.split('.')) {
    if (!current || typeof current === 'string') return undefined
    current = current[part]
  }

  return typeof current === 'string' ? current : undefined
}

const titleCase = (value: string) => value
  .split(' ')
  .filter(Boolean)
  .map((word) => word[0] ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
  .join(' ')

const humanizeKey = (key: string): string => {
  const fallbackKey = LEGACY_KEY_ALIASES[key] || LEGACY_KEY_ALIASES[key.toLowerCase()] || key
  if (FALLBACK_LABELS[fallbackKey]) {
    return FALLBACK_LABELS[fallbackKey]
  }

  const last = fallbackKey.split('.').pop() || fallbackKey
  const normalized = last.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  return titleCase(normalized)
}

// English-only. `lang` is kept (always 'en') so existing `lang === 'ta'`
// checks throughout the app simply never trigger, without having to touch
// every call site.
export const useLangStore = create<LangState>()(() => ({
  lang: 'en',
  t: (key) => getTranslation(dict, key) || humanizeKey(key),
}))
