/**
 * Shop / company profile used everywhere the app shows shop details
 * (navbar, footer, invoice header, PDF, thermal receipt, admin shell...).
 *
 * These are ES module *live bindings*, not frozen constants: Store Settings is
 * the single source of truth, and `applyShopProfile()` updates them whenever
 * settings are loaded or saved. Every existing consumer keeps importing the
 * same names and picks up the saved values automatically — no call site had to
 * change its shape.
 */

const PROFILE_CACHE_KEY = 'shop-profile'
const LOGO_DATA_CACHE_KEY = 'shop-logo-data'

export interface ShopProfile {
  name: string
  ownerName: string
  businessType: string
  phone: string
  shopContact: string
  email: string
  address: string
  instagramId: string
  reviewLink: string
  logoUrl: string
}

/** Fallback used before settings load and when Supabase is not configured. */
export const DEFAULT_SHOP_PROFILE: ShopProfile = {
  name: 'Dhanyas Boutique',
  ownerName: 'Ananthi M',
  businessType: 'SAREE WHOLESALE & RETAIL',
  phone: '80980 89591',
  shopContact: '80980 89591',
  email: 'dhanyasboutique2015@gmail.com',
  address: 'Kasthoribhai Road, AGM Apartment, Kumbakonam - 612001',
  instagramId: '@ananthinathan84',
  reviewLink: 'https://g.page/r/Ccpknn3jk8O6ECA/review',
  logoUrl: '',
}

export const DEFAULT_LOGO = '/logo.png'

const readCachedProfile = (): ShopProfile => {
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return DEFAULT_SHOP_PROFILE
    return { ...DEFAULT_SHOP_PROFILE, ...(JSON.parse(raw) as Partial<ShopProfile>) }
  } catch {
    return DEFAULT_SHOP_PROFILE
  }
}

/** Digits-only form for tel:/wa.me links, defaulting to the +91 country code. */
export const toE164 = (display: string): string => {
  const digits = (display || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `91${digits}`
  return digits
}

export const toInstagramHandle = (value: string) => (value || '').trim().replace(/^@+/, '')
export const toInstagramLink = (value: string) => {
  const handle = toInstagramHandle(value)
  return handle ? `https://www.instagram.com/${handle}/` : '#'
}

// -- Live brand bindings ------------------------------------------------
export let BRAND_EN = DEFAULT_SHOP_PROFILE.name
export let BRAND_SUBTITLE = DEFAULT_SHOP_PROFILE.businessType
export let BRAND_OWNER_NAME = DEFAULT_SHOP_PROFILE.ownerName
export let BRAND_LOGO = DEFAULT_LOGO

export let BRAND_PRIMARY_PHONE_DISPLAY = DEFAULT_SHOP_PROFILE.phone
export let BRAND_PRIMARY_PHONE_E164 = toE164(DEFAULT_SHOP_PROFILE.phone)
export let BRAND_SECONDARY_PHONE_DISPLAY = DEFAULT_SHOP_PROFILE.shopContact
export let BRAND_SECONDARY_PHONE_E164 = toE164(DEFAULT_SHOP_PROFILE.shopContact)
export let BRAND_THIRD_PHONE_DISPLAY = DEFAULT_SHOP_PROFILE.shopContact
export let BRAND_THIRD_PHONE_E164 = toE164(DEFAULT_SHOP_PROFILE.shopContact)
export let BRAND_PHONE_DISPLAY = DEFAULT_SHOP_PROFILE.phone
export let BRAND_PHONE_E164 = toE164(DEFAULT_SHOP_PROFILE.phone)
export let BRAND_WHATSAPP = DEFAULT_SHOP_PROFILE.shopContact
export let WHATSAPP_NUM = toE164(DEFAULT_SHOP_PROFILE.shopContact)
export let BRAND_WHATSAPP_LINK = `https://wa.me/${toE164(DEFAULT_SHOP_PROFILE.shopContact)}`
export let BRAND_EMAIL = DEFAULT_SHOP_PROFILE.email
export let BRAND_ADDRESS = DEFAULT_SHOP_PROFILE.address
export const BRAND_LOCATION_LINK = '#'
export let BRAND_INSTAGRAM = toInstagramHandle(DEFAULT_SHOP_PROFILE.instagramId)
export let BRAND_INSTAGRAM_LINK = toInstagramLink(DEFAULT_SHOP_PROFILE.instagramId)
export let BRAND_REVIEW_LINK = DEFAULT_SHOP_PROFILE.reviewLink

/** Point every brand binding at the saved shop profile. */
export const applyShopProfile = (profile: Partial<ShopProfile>, cache = true) => {
  const next: ShopProfile = { ...DEFAULT_SHOP_PROFILE, ...profile }

  BRAND_EN = next.name || DEFAULT_SHOP_PROFILE.name
  BRAND_SUBTITLE = next.businessType || ''
  BRAND_OWNER_NAME = next.ownerName || ''
  BRAND_LOGO = next.logoUrl || DEFAULT_LOGO

  BRAND_PRIMARY_PHONE_DISPLAY = next.phone || ''
  BRAND_PRIMARY_PHONE_E164 = toE164(next.phone)
  BRAND_SECONDARY_PHONE_DISPLAY = next.shopContact || next.phone || ''
  BRAND_SECONDARY_PHONE_E164 = toE164(next.shopContact || next.phone)
  BRAND_THIRD_PHONE_DISPLAY = BRAND_SECONDARY_PHONE_DISPLAY
  BRAND_THIRD_PHONE_E164 = BRAND_SECONDARY_PHONE_E164
  BRAND_PHONE_DISPLAY = BRAND_PRIMARY_PHONE_DISPLAY
  BRAND_PHONE_E164 = BRAND_PRIMARY_PHONE_E164
  BRAND_WHATSAPP = BRAND_SECONDARY_PHONE_DISPLAY
  WHATSAPP_NUM = BRAND_SECONDARY_PHONE_E164
  BRAND_WHATSAPP_LINK = `https://wa.me/${BRAND_SECONDARY_PHONE_E164}`

  BRAND_EMAIL = next.email || ''
  BRAND_ADDRESS = next.address || ''
  BRAND_INSTAGRAM = toInstagramHandle(next.instagramId)
  BRAND_INSTAGRAM_LINK = toInstagramLink(next.instagramId)
  BRAND_REVIEW_LINK = next.reviewLink || ''

  if (cache) {
    try {
      window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(next))
    } catch {
      // Ignore storage failures (private mode / restricted storage).
    }
  }
}

// Hydrate synchronously from the last saved profile so refreshes, printing and
// PDF export show the right shop details before the settings fetch resolves.
applyShopProfile(readCachedProfile(), false)

/**
 * jsPDF cannot fetch a remote logo synchronously, so the uploaded logo is also
 * cached as a data URL when it is saved. Falls back to the bundled logo.
 */
export const setShopLogoDataUrl = (dataUrl: string | null) => {
  try {
    if (dataUrl) window.localStorage.setItem(LOGO_DATA_CACHE_KEY, dataUrl)
    else window.localStorage.removeItem(LOGO_DATA_CACHE_KEY)
  } catch {
    // Ignore storage failures (private mode / restricted storage).
  }
}

export const getShopLogoDataUrl = (): string | null => {
  try {
    return window.localStorage.getItem(LOGO_DATA_CACHE_KEY)
  } catch {
    return null
  }
}
