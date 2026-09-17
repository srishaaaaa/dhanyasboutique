import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { fetchAllCategories, fetchAllProducts } from '../services/productService'
import { fetchAllVariants, type ProductVariant } from '../services/variantService'
import { applyShopProfile, DEFAULT_SHOP_PROFILE, type ShopProfile } from '../lib/brand'
import { applyShopTheme, DEFAULT_CARD_COLOR, normalizeHex, readCachedCardColor } from '../lib/shopTheme'
import {
  normalizeUnitType,
  toNumber,
  type QuantityOption,
  type UnitType,
} from '../lib/retail'

export type { ProductVariant }

/** Shared state for authentication, products, billing, and settings. */

// --- Types ---
export interface Product {
  id: string | number // Support both legacy numeric IDs and new UUIDs
  name: string
  nameTa?: string
  tamilName?: string
  category: string
  categoryId?: number | string | null
  remedy: string[]
  price: number
  offerPrice?: number | null
  unitType: UnitType
  unitLabel: string
  baseQuantity: number
  stockQuantity: number
  stockUnit: string
  allowDecimalQuantity: boolean
  predefinedOptions: QuantityOption[]
  isActive: boolean
  sortOrder: number
  unit: string
  rating: number
  stock: number
  description: string
  descriptionTa?: string
  benefits: string
  benefitsTa?: string
  image: string
  imageUrl?: string
  source?: 'catalogue' | 'manual'
  itemType?: 'product' | 'service'
  note?: string | null
  hasVariants?: boolean

  // POS inventory fields
  sku?: string
  barcode?: string
  brand?: string
  purchasePrice?: number
  mrp?: number
  gstPercent?: number
  openingStock?: number
  lowStockAlert?: number
  supplier?: string
  size?: string
  color?: string
}

interface AuthUser {
  id: string
  name: string
  email: string
  mobile?: string
  role: 'admin' | 'customer'
  avatarUrl?: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  setAuth: (user: AuthUser | null) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

interface ProductState {
  products: Product[]
  loading: boolean
  error: string | null
  lastFetch: number
  fetchProducts: (force?: boolean) => Promise<void>
}

interface ProductModalState {
  product: Product | null
  open: boolean
  openProduct: (product: Product) => void
  closeProduct: () => void
}

export interface StoreSettings extends ShopProfile {
  gstEnabled: boolean
  cardColor: string
}

interface SettingsState {
  settings: StoreSettings | null
  loading: boolean
  saving: boolean
  fetchSettings: () => Promise<void>
  saveSettings: (patch: Partial<StoreSettings>) => Promise<{ ok: boolean; error?: string }>
}

interface VariantStoreState {
  variantsMap: Record<string, ProductVariant[]>
  fetched: boolean
  fetchVariants: () => Promise<void>
  refetchVariants: () => Promise<void>
  getVariants: (productId: string) => ProductVariant[]
  getDefaultVariant: (productId: string) => ProductVariant | null
  hasVariants: (productId: string | number) => boolean
}

interface VariantModalState {
  product: Product | null
  open: boolean
  openVariantModal: (product: Product) => void
  closeVariantModal: () => void
}

type SessionFallback = {
  id?: string
  email?: string | null
  phone?: string | null
  user_metadata?: {
    name?: string
    mobile?: string
  }
}

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>
  }
  return {}
}

const readString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

const LEGACY_CATEGORY_NAMES = new Set<string>()

const toAuthUser = (profile: unknown, fallback?: SessionFallback): AuthUser => {
  const profileRow = asRecord(profile)
  const fallbackMeta = asRecord(fallback?.user_metadata)
  const email = String(profileRow.email || fallback?.email || '')
  const isAdmin = profileRow.role === 'admin'

  return {
    id: String(profileRow.id || fallback?.id || ''),
    name: String(profileRow.name || fallbackMeta.name || fallback?.email || 'Customer'),
    email,
    mobile: String(profileRow.mobile || fallbackMeta.mobile || fallback?.phone || ''),
    role: isAdmin ? 'admin' : 'customer',
    avatarUrl: readString(profileRow.avatar_url) || undefined,
  }
}

const mapDbProduct = (input: unknown, categoriesById: Record<string, string> = {}): Product => {
  const p = asRecord(input)
  const categoryId = typeof p.category_id === 'string' || typeof p.category_id === 'number' ? p.category_id : null
  const image = readString(p.image_url) || readString(p.image) || '/product-placeholder.svg'
  const remedy = Array.isArray(p.remedy)
    ? p.remedy.filter((entry): entry is string => typeof entry === 'string')
    : []

  return {
    id: String(p.id || ''),
    name: readString(p.name, 'Product'),
    nameTa: readString(p.name_ta) || readString(p.tamil_name),
    tamilName: readString(p.tamil_name) || readString(p.name_ta),
    category: categoriesById[String(categoryId)] || (() => {
      const legacyCategory = readString(p.category).trim()
      return LEGACY_CATEGORY_NAMES.has(legacyCategory.toLowerCase()) ? '' : legacyCategory
    })(),
    categoryId,
    remedy,
    price: toNumber(p.price, 0),
    offerPrice: p.offer_price != null ? toNumber(p.offer_price, 0) : null,
    unitType: normalizeUnitType(p.unit_type, 'unit'),
    unitLabel: readString(p.unit_label, 'piece'),
    baseQuantity: toNumber(p.base_quantity, 1),
    stockQuantity: toNumber(p.stock_quantity, 0),
    stockUnit: readString(p.stock_unit, 'piece'),
    allowDecimalQuantity: Boolean(p.allow_decimal_quantity),
    predefinedOptions: Array.isArray(p.predefined_options) ? p.predefined_options as QuantityOption[] : [],
    isActive: p.is_active !== false,
    sortOrder: toNumber(p.sort_order, 0),
    unit: readString(p.unit, '100g'),
    rating: toNumber(p.rating, 4.7),
    stock: Math.floor(toNumber(p.stock_quantity ?? p.stock, 0)),
    description: readString(p.description),
    descriptionTa: readString(p.description_ta),
    benefits: readString(p.benefits),
    benefitsTa: readString(p.benefits_ta),
    image,
    imageUrl: image,
    hasVariants: Boolean(p.has_variants),
    itemType: (p.item_type === 'service' ? 'service' : 'product') as 'product' | 'service',

    // POS inventory mapping
    sku: readString(p.sku),
    barcode: readString(p.barcode),
    brand: readString(p.brand),
    purchasePrice: toNumber(p.purchase_price, 0),
    mrp: toNumber(p.mrp, 0),
    gstPercent: toNumber(p.gst_percent, 0),
    openingStock: toNumber(p.opening_stock, 0),
    lowStockAlert: toNumber(p.low_stock_alert, 5),
    supplier: readString(p.supplier),
    size: readString(p.size),
    color: readString(p.color),
  }
}

// --- Auth Store ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get): AuthState => ({
      user: null,
      loading: true,
      isAuthenticated: () => !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      setAuth: (user: AuthUser | null) => set({ user, loading: false }),
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, loading: false })
      },
      initialize: async () => {
        set({ loading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            let { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            const meta = session.user.user_metadata || {}
            const email = session.user.email || ''
            const metaName  = String(meta.full_name || meta.name || (email ? email.split('@')[0] : 'Customer'))
            const metaMobile = String(meta.mobile || meta.phone || '')

            if (!profile) {
              // Bootstrap profile for users signed up before the DB trigger existed
              const role = 'customer'
              const { data: upserted } = await supabase
                .from('profiles')
                .upsert({
                  id: session.user.id,
                  email,
                  name: metaName,
                  mobile: metaMobile,
                  role,
                }, { onConflict: 'id' })
                .select()
                .single()
              profile = upserted
            } else {
              // Profile exists — backfill missing fields from user_metadata
              // (handles users who signed up before phone field was added to the form)
              const needsUpdate: Record<string, string> = {}
              if (!profile.mobile && metaMobile) needsUpdate.mobile = metaMobile
              if (!profile.name   && metaName)   needsUpdate.name   = metaName
              if (!profile.email  && email)       needsUpdate.email  = email

              if (Object.keys(needsUpdate).length > 0) {
                const { data: updated } = await supabase
                  .from('profiles')
                  .update(needsUpdate)
                  .eq('id', session.user.id)
                  .select()
                  .single()
                if (updated) profile = updated
              }
            }

            set({ user: toAuthUser(profile, session.user) })
          } else {
            set({ user: null })
          }
        } catch (e) {
          console.error('Auth init error', e)
        } finally {
          set({ loading: false })
        }
      }
    }),
    { name: 'ssp-tex-auth' }
  )
)

// --- Product Store ---
export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  lastFetch: 0,
  fetchProducts: async (force = false) => {
    if (!force && Date.now() - get().lastFetch < 300000 && get().products.length > 0) return

    if (!isSupabaseConfigured) {
      set({
        products: [],
        loading: false,
        error: 'Supabase is not configured',
        lastFetch: Date.now(),
      })
      return
    }

    set({ loading: true, error: null })
    try {
      const [{ data, error }, { data: categoryData }] = await Promise.all([
        fetchAllProducts(),
        fetchAllCategories(),
      ])

      if (error) throw error

      const categoriesById = Object.fromEntries(
        (categoryData || []).map(category => [String(category.id), String(category.name_en || '').trim()]),
      )
      const normalized = (data || []).map(product => mapDbProduct(product, categoriesById))

      set({ products: normalized, loading: false, lastFetch: Date.now() })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unable to fetch products',
        loading: false,
      })
    }
  }
}))

export const useProductModalStore = create<ProductModalState>()((set) => ({
  product: null,
  open: false,
  openProduct: (product) => set({ product, open: true }),
  closeProduct: () => set({ open: false, product: null }),
}))

// --- Variant Store ---
export const useVariantStore = create<VariantStoreState>()((set, get) => ({
  variantsMap: {},
  fetched: false,
  fetchVariants: async () => {
    if (get().fetched) return
    const { data } = await fetchAllVariants()
    const map: Record<string, ProductVariant[]> = {}
    for (const v of data) {
      if (!map[v.productId]) map[v.productId] = []
      map[v.productId].push(v)
    }
    set({ variantsMap: map, fetched: true })
  },
  refetchVariants: async () => {
    set({ fetched: false })
    const { data } = await fetchAllVariants()
    const map: Record<string, ProductVariant[]> = {}
    for (const v of data) {
      if (!map[v.productId]) map[v.productId] = []
      map[v.productId].push(v)
    }
    set({ variantsMap: map, fetched: true })
  },
  getVariants: (productId) => get().variantsMap[String(productId)] || [],
  getDefaultVariant: (productId) => {
    const variants = get().variantsMap[String(productId)] || []
    return variants.find(v => v.isDefault) || variants[0] || null
  },
  hasVariants: (productId) => (get().variantsMap[String(productId)] || []).length > 0,
}))

// --- Variant Selector Modal Store ---
export const useVariantModalStore = create<VariantModalState>()((set) => ({
  product: null,
  open: false,
  openVariantModal: (product) => set({ product, open: true }),
  closeVariantModal: () => set({ open: false, product: null }),
}))

// --- Store Settings State ---
// public.store_settings (id = 1) is the single source of truth for the shop /
// company profile. Loading or saving it also refreshes the brand bindings and
// the card-colour theme, so every existing shop display follows automatically.
const SETTINGS_FALLBACK: StoreSettings = {
  ...DEFAULT_SHOP_PROFILE,
  gstEnabled: false,
  cardColor: DEFAULT_CARD_COLOR,
}

const rowToSettings = (data: Record<string, unknown>): StoreSettings => ({
  name: String(data.name ?? ''),
  ownerName: String(data.owner_name ?? ''),
  businessType: String(data.business_type ?? ''),
  phone: String(data.phone ?? ''),
  shopContact: String(data.shop_contact ?? data.phone ?? ''),
  email: String(data.email ?? ''),
  address: String(data.address ?? ''),
  instagramId: String(data.instagram_id ?? ''),
  logoUrl: String(data.logo_url ?? ''),
  gstEnabled: Boolean(data.gst_enabled),
  cardColor: normalizeHex(String(data.card_color ?? '')) || DEFAULT_CARD_COLOR,
})

const applySettings = (settings: StoreSettings) => {
  applyShopProfile(settings)
  applyShopTheme(settings.cardColor)
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: null,
  loading: false,
  saving: false,
  fetchSettings: async () => {
    set({ loading: true })
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).single()
      if (!error && data) {
        const settings = rowToSettings(data as Record<string, unknown>)
        applySettings(settings)
        set({ settings, loading: false })
        return
      }
    }
    // Fallback/Demo settings
    const fallback: StoreSettings = { ...SETTINGS_FALLBACK, cardColor: readCachedCardColor() }
    applySettings(fallback)
    set({ settings: fallback, loading: false })
  },
  saveSettings: async (patch) => {
    const current = get().settings ?? SETTINGS_FALLBACK
    const next: StoreSettings = {
      ...current,
      ...patch,
      cardColor: normalizeHex(String(patch.cardColor ?? current.cardColor)) || DEFAULT_CARD_COLOR,
    }
    set({ saving: true })

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('store_settings')
        .update({
          name: next.name,
          owner_name: next.ownerName,
          business_type: next.businessType,
          phone: next.phone,
          shop_contact: next.shopContact,
          email: next.email,
          address: next.address,
          instagram_id: next.instagramId,
          logo_url: next.logoUrl,
          card_color: next.cardColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
        .select('*')
        .single()

      if (error) {
        set({ saving: false })
        return { ok: false, error: error.message }
      }
      const saved = rowToSettings(data as Record<string, unknown>)
      applySettings(saved)
      set({ settings: saved, saving: false })
      return { ok: true }
    }

    applySettings(next)
    set({ settings: next, saving: false })
    return { ok: true }
  },
}))

// --- Admin Auth Store ---
const getEnv = (key: string, fallback: string) => {
  const val = import.meta.env[key] as string | undefined
  // If it's missing, empty, or the literal string 'undefined' (Vercel bug)
  return val && val.trim() !== '' && val !== 'undefined' ? val : fallback
}

const ADMIN_PORTAL_ID = getEnv('VITE_ADMIN_ID', 'admin')
const ADMIN_PORTAL_PASSWORD = getEnv('VITE_ADMIN_PASSWORD', 'admin123')
const STAFF_PORTAL_ID = getEnv('VITE_STAFF_ID', 'staff')
const STAFF_PORTAL_PASSWORD = getEnv('VITE_STAFF_PASSWORD', 'staff123')

export type AdminRole = 'admin' | 'staff' | null

interface AdminAuthState {
  isLoggedIn: boolean
  role: AdminRole
  login: (portalId: string, password: string) => Promise<AdminRole | false>
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      role: null,
      login: async (portalId: string, password: string) => {
        const id = portalId.trim()
        const pwd = password.trim()
        if (ADMIN_PORTAL_ID && ADMIN_PORTAL_PASSWORD && id === ADMIN_PORTAL_ID && pwd === ADMIN_PORTAL_PASSWORD) {
          try { sessionStorage.setItem('ssp_tex_fresh_login', '1') } catch { /* ignore */ }
          set({ isLoggedIn: true, role: 'admin' })
          return 'admin'
        }
        if (STAFF_PORTAL_ID && STAFF_PORTAL_PASSWORD && id === STAFF_PORTAL_ID && pwd === STAFF_PORTAL_PASSWORD) {
          try { sessionStorage.setItem('ssp_tex_fresh_login', '1') } catch { /* ignore */ }
          set({ isLoggedIn: true, role: 'staff' })
          return 'staff'
        }
        return false
      },
      logout: () => set({ isLoggedIn: false, role: null }),
    }),
    {
      name: 'ssp-tex-admin-session',
      // Using sessionStorage so the session is cleared when the tab is closed
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name)
          if (!str) return null
          return JSON.parse(str)
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name)
        }
      }
    }
  )
)
