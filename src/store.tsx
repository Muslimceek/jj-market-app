import { createContext, useContext, type ReactNode } from 'react'
import { DICTS, type Dict, type Lang } from './i18n'

/* ---------- типы каталога (public/data/catalog.json, см. scripts/fetch_catalog.py) ---------- */
export type I18n = Partial<Record<'ru' | 'tr' | 'kk' | 'en', string>>
export interface Cat { id: string; slug: string; name: I18n; count: number; image: string | null; children: Cat[] }
export interface AxisValue { id: string; slug: string; name: I18n }
export interface Axis { slug: string; kind: string; name: I18n; values: AxisValue[] }
export interface Variant { id: string; values: string[]; stock: number; price: number; old: number }
export interface Product {
  id: string; slug: string; name: I18n; brand: string; seller: string; price: number; old: number; pct: number; stock: number
  rating: number; reviews: number; badges: { slug: string; name: I18n; color: string }[]; hasVideo: boolean; images: string[]
  categories: { id: string; slug: string; name: I18n }[]; desc: I18n; fit: string | null
  features: { name: I18n; value: I18n; slug: string }[]; axes: Axis[]; variants: Variant[]; minQty: number; maxQty: number; created: string
}
export interface FilterGroup { key: string; slug: string; name: I18n; kind: string; values: { id: string; slug: string; name: I18n; count: number }[] }
export interface Catalog {
  fetched: string; categories: Cat[]; sliders: { id: number; image: string }[]; products: Product[]
  filters: { brands: { id: string; name: string; count: number }[]; groups: FilterGroup[]; priceRange: { min: number; max: number } }
}

/* ---------- состояние покупателя ---------- */
export interface CartLine { key: string; productId: string; variantId?: string; label: string; qty: number; selected: boolean }
export interface Address {
  id: string; title: string; type: 'individual' | 'corporate'; country: string; city: string; street: string
  home: 'house' | 'flat'; name: string; phone: string; kind?: 'courier' | 'pickup'; apt?: string; comment?: string
}
export interface Order { id: string; date: string; lines: { productId: string; label: string; qty: number; price: number }[]; total: number; address: string; pay: string; status: number }
export interface User { first: string; last: string; email: string; phone: string; gender: string; birth: string }
export interface State {
  onboarded: boolean; authSeen: boolean; lang: Lang; user: User | null; favs: string[]; cart: CartLine[]; addresses: Address[]; addressId: string | null
  orders: Order[]; pay: string | null; notif: { push: boolean; mail: boolean; sms: boolean }
}
export const initialState: State = {
  onboarded: false, authSeen: false, lang: 'ru', user: null, favs: [], cart: [], addresses: [], addressId: null, orders: [], pay: null,
  notif: { push: true, mail: false, sms: true },
}
export const STORE_KEY = 'jj-market-demo-v1'
export const loadState = (): State => {
  try { return { ...initialState, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') } } catch { return initialState }
}

/* ---------- навигация ---------- */
export type Route = { name: string; p?: any }
export interface Ctx {
  cat: Catalog; s: State; set: (fn: (s: State) => State) => void; t: Dict; lang: Lang
  push: (name: string, p?: any) => void; pop: () => void; tab: (k: string) => void; curTab: string
  sheet: (n: ReactNode | null) => void; toast: (m: ReactNode) => void
  requireLogin: (msg?: string) => boolean
  addToCart: (productId: string, lines: { variantId?: string; label: string; qty: number }[]) => void
}
export const AppCtx = createContext<Ctx>(null as any)
export const useApp = () => useContext(AppCtx)

/* ---------- помощники ---------- */
export const tx = (o: I18n | undefined, lang: Lang) => {
  const raw = o ? o[lang] || o.ru || o.tr || o.en || o.kk || '' : ''
  return raw === 'Женская одежа' ? 'Женская одежда' : raw
}
export const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/ |,/g, ' ')
export const code = (p: Product) => p.slug.split('-').pop() || ''
export const dict = (l: Lang) => DICTS[l]

/** Все товары категории (включая подкатегории) */
export function catIds(c: Cat): string[] { return [c.id, ...c.children.flatMap(catIds)] }
export function findCat(cats: Cat[], id: string): Cat | null {
  for (const c of cats) { if (c.id === id) return c; const f = findCat(c.children, id); if (f) return f }
  return null
}
export const productsIn = (cat: Catalog, c: Cat) => {
  const ids = new Set(catIds(c))
  return cat.products.filter((p) => p.categories.some((x) => ids.has(x.id)))
}

/** Цвет и размеры товара */
export const colorAxis = (p: Product) => p.axes.find((a) => a.kind === 'color' || a.slug === 'color')
export const sizeAxis = (p: Product) => p.axes.find((a) => a.kind !== 'color' && a.slug !== 'color')

export const COLOR_HEX: Record<string, string> = {
  'color-white': '#ffffff', 'color-black': '#111111', 'color-grey': '#9e9e9e', 'color-gray': '#9e9e9e', 'color-dark-grey': '#4a4a4a', 'color-light-grey': '#d4d4d4',
  'color-red': '#e53935', 'color-burgundy': '#7b1027', 'color-pink': '#f48fb1', 'color-powder': '#f3c9c0', 'color-fuchsia': '#e91e63', 'color-orange': '#fb8c00',
  'color-brown': '#6d4c41', 'color-khaki': '#b5a46a', 'color-navy': '#1a237e', 'color-blue': '#1e88e5', 'color-light-blue': '#81d4fa', 'color-green': '#43a047',
  'color-beige': '#e8d9c0', 'color-cream': '#f5ecd7', 'color-yellow': '#fdd835', 'color-purple': '#8e24aa', 'color-lilac': '#c5a3e0', 'color-gold': '#d4af37',
  'color-silver': '#c0c0c0', 'color-mint': '#a5e3c9', 'color-ecru': '#efe6d2', 'color-mustard': '#d4a017', 'color-anthracite': '#3a3a3c', 'color-camel': '#c19a6b',
  'color-multicolor': 'conic-gradient(#e53935,#fdd835,#43a047,#1e88e5,#8e24aa,#e53935)', 'color-melange': '#bdbdbd', 'color-coffee': '#6f4e37', 'color-mink': '#8b7d70',
}
export const hexOf = (slug: string) => COLOR_HEX[slug] ?? (slug.includes('black') ? '#111' : slug.includes('white') ? '#fff' : '#cfcfd6')
