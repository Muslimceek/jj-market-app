import { useMemo, useState } from 'react'
import {
  ChevronRight, SlidersHorizontal, ArrowUpDown, Bell, PackageSearch, Check, Heart,
  Search as SearchIc, X, Percent, Sparkles, MapPin, ChevronDown, Star,
  Sun, Snowflake, CloudRain, Layers, ChevronUp, Store, ShoppingBag,
} from 'lucide-react'
import { useApp, tx, findCat, productsIn, catIds, hexOf, fmt, type Product, type Catalog } from './store'
import { TopBar, Grid, Sheet, Empty } from './ui'
import { AddressSheet, addrMeta } from './Home'

/* ---------- КОМПАКТНЫЙ ДВУХПАНЕЛЬНЫЙ КАТАЛОГ (как в Ozon / Trendyol / Kaspi — поиск за 1 секунду) ---------- */
export function Categories() {
  const { cat, push, t, lang, s, sheet } = useApp()
  const addr = addrMeta(s)
  const activeCats = useMemo(() => cat.categories.filter((c) => c.count > 0), [cat.categories])
  const [selId, setSelId] = useState<string>('sale')

  const selectedCat = useMemo(() => activeCats.find((c) => c.id === selId) ?? null, [activeCats, selId])
  const saleProds = useMemo(() => [...cat.products].filter((p) => p.pct > 0 || p.old > 0).sort((a, b) => b.pct - a.pct), [cat.products])

  // Товары и подкатегории для выбранного раздела в правой панели
  const rightProds = useMemo(() => {
    if (selId === 'sale') return saleProds
    if (selId === 'favs') return cat.products.filter((p) => s.favs.includes(p.id))
    return selectedCat ? productsIn(cat, selectedCat) : cat.products
  }, [selId, selectedCat, saleProds, cat, s.favs])

  const rightSubs = useMemo(() => {
    if (!selectedCat) return []
    const subs = selectedCat.children.filter((ch) => ch.count > 0 || ch.children.length > 0)
    return subs.map((sub) => {
      const sample = productsIn(cat, sub).find((p) => p.images[0])
      const validSubImg = sub.image && /\.(webp|jpe?g|png)$/i.test(sub.image) && !sub.image.includes('1F454') ? sub.image : null
      return { sub, img: sample?.images[0] || validSubImg || selectedCat.image }
    })
  }, [selectedCat, cat])

  // Бренды именно этого раздела
  const sectionBrands = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of rightProds) {
      if (p.brand) map.set(p.brand, (map.get(p.brand) || 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => cat.filters.brands.find((b) => b.name === name))
      .filter((b): b is NonNullable<typeof b> => !!b)
  }, [rightProds, cat.filters.brands])

  // Короткое название для левой компактной панели
  const shortCatName = (name: string) => {
    const map: Record<string, string> = {
      'Женская одежда': 'Женщинам',
      'Мужская одежда': 'Мужчинам',
      'Женская обувь': 'Жен. обувь',
      'Мужская обувь': 'Муж. обувь',
      'Детская обувь': 'Дет. обувь',
      'Сумки и аксессуары': 'Сумки',
      'Красота и уход': 'Красота',
      'Товары для дома': 'Для дома',
      'Продукты питания': 'Продукты',
      'Бытовая химия': 'Химия',
    }
    return map[name] || name
  }

  return (
    <div className="screen home-screen">
      <header className="jj-header stuck">
        <div className="jj-top-row">
          <div className="cat-head-title">
            <h1>{t.tabs.cats}</h1>
          </div>
          <button className="jj-addr-pill compact" onClick={() => sheet(<AddressSheet />)}>
            <span className="jj-addr-pin">{addr?.isPickup ? <Store size={13} /> : <MapPin size={13} />}</span>
            <span className="jj-addr-txt">
              <b>{addr ? addr.short : t.chooseAddress}</b>
            </span>
            <ChevronDown size={14} className="jj-addr-chev" />
          </button>
          <button className="jj-notif-btn" onClick={() => push('news')} aria-label={t.news}>
            <Bell size={18} strokeWidth={1.9} />
          </button>
        </div>

        <div className="jj-search-row">
          <div className="jj-search-bar" onClick={() => push('search')} role="button" tabIndex={0}>
            <SearchIc size={17} className="jj-s-ic" />
            <span className="jj-s-ph">{t.search}</span>
            <button type="button" className="jj-s-ai" onClick={(e) => { e.stopPropagation(); push('ai') }} aria-label={t.ai}>
              <Sparkles size={14} />
            </button>
          </div>
          <button className="jj-filter-btn" onClick={() => push('filters', { from: 'cats' })} aria-label={t.filters}>
            <SlidersHorizontal size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Двухпанельный быстрый каталог: слева компактные категории, справа подкатегории + бренды + товары */}
      <div className="cat-split">
        <aside className="cat-rail">
          <button className={'cr-item' + (selId === 'sale' ? ' on' : '')} onClick={() => setSelId('sale')}>
            <span className="cr-ic sale"><Percent size={17} strokeWidth={2.5} /></span>
            <span>{t.discount}</span>
          </button>
          <button className={'cr-item' + (selId === 'favs' ? ' on' : '')} onClick={() => setSelId('favs')}>
            <span className="cr-ic heart"><Heart size={16} fill={selId === 'favs' ? '#fff' : '#d92d53'} color={selId === 'favs' ? '#fff' : '#d92d53'} /></span>
            <span>{t.favorites}</span>
          </button>
          {activeCats.map((c) => {
            const on = selId === c.id
            const fullName = tx(c.name, lang)
            return (
              <button key={c.id} className={'cr-item' + (on ? ' on' : '')} onClick={() => setSelId(c.id)}>
                <span className="cr-thumb">
                  {c.image ? <img src={'/' + c.image} alt="" loading="lazy" /> : <ShoppingBag size={16} color="#AE33FF" />}
                </span>
                <span>{shortCatName(fullName)}</span>
              </button>
            )
          })}
        </aside>

        <div className="cat-pane">
          {/* Верхняя карточка раздела */}
          <div
            className="cp-head-card"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (selId === 'sale') push('list', { kind: 'sale', title: t.discount })
              else if (selId === 'favs') push('list', { kind: 'favs', title: t.favorites })
              else if (selectedCat) push('list', { kind: 'cat', id: selectedCat.id, title: tx(selectedCat.name, lang) })
            }}
          >
            <div className="cph-txt">
              <b>{selId === 'sale' ? t.discount : selId === 'favs' ? t.favorites : tx(selectedCat?.name, lang)}</b>
              <small>{t.seeAll} →</small>
            </div>
            <button
              type="button"
              className="cph-flt"
              onClick={(e) => {
                e.stopPropagation()
                push('filters', {
                  f: { ...emptyF(cat), ...(selId === 'sale' ? { sale: true } : selectedCat ? { cats: [selectedCat.id] } : {}) },
                })
              }}
              aria-label={t.filters}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* Если выбран раздел «Скидки» — быстрая 3-колоночная сетка категорий со скидками */}
          {selId === 'sale' && (
            <div className="cp-sub-grid">
              {activeCats.slice(0, 6).map((c) => (
                <button key={c.id} className="cp-sub-tile" onClick={() => push('list', { kind: 'cat', id: c.id, title: tx(c.name, lang), f0: { ...emptyF(cat), sale: true } })}>
                  <span className="cps-img">
                    {c.image ? <img src={'/' + c.image} alt="" loading="lazy" /> : <Percent size={18} color="#AE33FF" />}
                  </span>
                  <span>{shortCatName(tx(c.name, lang))}</span>
                </button>
              ))}
            </div>
          )}

          {/* Компактная 3-колоночная сетка подкатегорий выбранной категории */}
          {rightSubs.length > 0 && (
            <div className="cp-sub-grid">
              {rightSubs.map(({ sub, img }) => (
                <button
                  key={sub.id}
                  className="cp-sub-tile"
                  onClick={() => push(sub.children.length ? 'subcats' : 'list', sub.children.length ? { id: sub.id } : { kind: 'cat', id: sub.id, title: tx(sub.name, lang) })}
                >
                  <span className="cps-img">
                    {img ? <img src={'/' + img} alt="" loading="lazy" /> : <ShoppingBag size={18} color="#AE33FF" />}
                  </span>
                  <span>{tx(sub.name, lang)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Новое: Топ бренды именно этого раздела */}
          {sectionBrands.length > 0 && (
            <div className="cp-sec">
              <div className="cp-sec-h">{t.homeUI.brandsTitle}</div>
              <div className="cp-brands">
                {sectionBrands.map((b) => (
                  <button
                    key={b.id}
                    className="cp-brand-chip"
                    onClick={() => push('list', { kind: 'all', title: b.name, f0: { ...emptyF(cat), brands: [b.id], ...(selectedCat ? { cats: [selectedCat.id] } : {}) } })}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Новое: Популярные товары прямо в каталоге (ускоряет выбор!) */}
          {rightProds.length > 0 ? (
            <div className="cp-sec">
              <div className="cp-sec-h">{t.popular}</div>
              <div className="cp-mini-grid">
                {rightProds.slice(0, 6).map((p) => (
                  <button key={p.id} className="cp-mini-card" onClick={() => push('product', { id: p.id })}>
                    <div className="cpm-img">
                      <img src={'/' + p.images[0]} alt="" loading="lazy" />
                      {p.pct > 0 && <em>-{p.pct}%</em>}
                    </div>
                    <b>{fmt(p.price)} ₸</b>
                    <span>{tx(p.name, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="cp-empty-mini">
              <Heart size={22} color="#AE33FF" />
              <span>{t.favEmpty}</span>
            </div>
          )}

          {/* Компактная кнопка AI-стилиста */}
          <button className="cp-ai-mini" onClick={() => push('ai')}>
            <Sparkles size={15} color="#AE33FF" />
            <span>{t.homeUI.aiPromoTitle}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Подкатегории: БЕЗ ПУСТОТЫ — визуальная сетка подкатегорий + бренды + товары раздела ---------- */
export function SubCats({ id }: { id: string }) {
  const { cat, push, t, lang } = useApp()
  const c = findCat(cat.categories, id)
  if (!c) return null
  const activeChildren = c.children.filter((x) => x.count > 0 || x.children.length > 0)
  const list = activeChildren.length ? activeChildren : c.children
  const catProds = useMemo(() => productsIn(cat, c), [cat, c])
  const brands = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of catProds) if (p.brand) map.set(p.brand, (map.get(p.brand) || 0) + 1)
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nm]) => cat.filters.brands.find((b) => b.name === nm))
      .filter((b): b is NonNullable<typeof b> => !!b)
  }, [catProds, cat.filters.brands])

  return (
    <div className="screen home-screen">
      <TopBar
        title={tx(c.name, lang)}
        right={<button className="tb-icon-btn" onClick={() => push('filters', { f: { ...emptyF(cat), cats: [c.id] } })} aria-label={t.filters}><SlidersHorizontal size={18} /></button>}
      />
      <div className="scroll">
        {/* Фирменная фиолетовая карточка «Все товары категории» */}
        <button className="sub-all-card" onClick={() => push('list', { kind: 'cat', id: c.id, title: tx(c.name, lang) })}>
          <div className="sac-left">
            {c.image && <img src={'/' + c.image} alt="" />}
            <div>
              <b>{t.allInCat}</b>
              <small>{tx(c.name, lang)}</small>
            </div>
          </div>
          <ChevronRight size={18} />
        </button>

        {/* Визуальная 2-колоночная сетка подкатегорий с фото товаров */}
        <div className="sub-visual-grid">
          {list.map((x) => {
            const validImg = x.image && /\.(webp|jpe?g|png)$/i.test(x.image) && !x.image.includes('1F454') ? x.image : null
            const sampleImg = productsIn(cat, x).find((p) => p.images[0])?.images[0] || validImg || c.image
            return (
              <button
                key={x.id}
                className="sub-vis-card"
                onClick={() => push(x.children.length ? 'subcats' : 'list', x.children.length ? { id: x.id } : { kind: 'cat', id: x.id, title: tx(x.name, lang) })}
              >
                <span className="svc-img">
                  {sampleImg ? <img src={'/' + sampleImg} alt="" loading="lazy" /> : <ShoppingBag size={18} color="#AE33FF" />}
                </span>
                <b>{tx(x.name, lang)}</b>
                <ChevronRight size={15} className="svc-arr" />
              </button>
            )
          })}
        </div>

        {/* Бренды этого раздела */}
        {brands.length > 0 && (
          <div style={{ margin: '14px 0 4px' }}>
            <div className="cat-sub-lbl">{t.homeUI.brandsTitle}</div>
            <div className="cat-quick-pills">
              {brands.map((b) => (
                <button key={b.id} className="cq-pill" onClick={() => push('list', { kind: 'all', title: b.name, f0: { ...emptyF(cat), cats: [c.id], brands: [b.id] } })}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Живая витрина товаров прямо на этом экране — никакой пустоты! */}
        {catProds.length > 0 && (
          <>
            <div className="sec-h" style={{ marginTop: 16 }}>
              <h2>{t.popular}</h2>
              <button onClick={() => push('list', { kind: 'cat', id: c.id, title: tx(c.name, lang) })}>
                <span>{t.seeAll}</span><ChevronRight size={15} />
              </button>
            </div>
            <Grid items={catProds.slice(0, 12)} />
          </>
        )}
        <div style={{ height: 22 }} />
      </div>
    </div>
  )
}

/* ---------- Фильтры (состояние + логика с inStock и rating45) ---------- */
export interface FState {
  sort: number; sale: boolean; inStock?: boolean; rating45?: boolean
  cats: string[]; min: number; max: number; brands: string[]; vals: string[]
}
export const emptyF = (c: Catalog): FState => ({
  sort: 0, sale: false, inStock: false, rating45: false,
  cats: [], min: c.filters.priceRange.min, max: c.filters.priceRange.max, brands: [], vals: [],
})

export function applyF(cat: Catalog, list: Product[], f: FState) {
  let r = list.filter((p) => p.price >= f.min && p.price <= f.max)
  if (f.sale) r = r.filter((p) => p.old > 0 || p.pct > 0)
  if (f.inStock) r = r.filter((p) => p.stock > 0 || p.variants.some((v) => v.stock > 0))
  if (f.rating45) r = r.filter((p) => p.rating >= 4.5 || p.rating === 0)
  if (f.cats.length) {
    const ids = new Set(f.cats.flatMap((id) => { const c = findCat(cat.categories, id); return c ? catIds(c) : [id] }))
    r = r.filter((p) => p.categories.some((c) => ids.has(c.id)))
  }
  if (f.brands.length) {
    const names = new Set(cat.filters.brands.filter((b) => f.brands.includes(b.id)).map((b) => b.name))
    r = r.filter((p) => names.has(p.brand))
  }
  if (f.vals.length) {
    const byGroup = new Map<string, Set<string>>()
    for (const g of cat.filters.groups) for (const v of g.values) if (f.vals.includes(v.id)) {
      if (!byGroup.has(g.key)) byGroup.set(g.key, new Set())
      byGroup.get(g.key)!.add(v.id)
    }
    r = r.filter((p) => {
      const have = new Set(p.variants.flatMap((v) => v.values))
      for (const a of p.axes) for (const v of a.values) have.add(v.id)
      const feat = new Set(p.features.map((x) => Object.values(x.value).join('|').toLowerCase()))
      return [...byGroup.entries()].every(([key, ids]) => {
        const g = cat.filters.groups.find((x) => x.key === key)!
        return [...ids].some((id) =>
          have.has(id) ||
          (g.kind !== 'size' && g.kind !== 'color' && [...feat].some((fv) => {
            const v = g.values.find((x) => x.id === id)
            return v && Object.values(v.name).some((n) => n && fv.includes(n.toLowerCase()))
          })),
        )
      })
    })
  }
  const s = [...r]
  switch (f.sort) {
    case 1: s.sort((a, b) => (b.created || '').localeCompare(a.created || '')); break
    case 2: s.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews); break
    case 3: s.sort((a, b) => b.price - a.price); break
    case 4: s.sort((a, b) => a.price - b.price); break
    case 5: s.sort((a, b) => b.pct - a.pct); break
    case 6: return s.filter((p) => p.stock > 0)
  }
  return s
}

export const activeCount = (cat: Catalog, f: FState) =>
  (f.sale ? 1 : 0) + (f.inStock ? 1 : 0) + (f.rating45 ? 1 : 0) +
  f.cats.length + f.brands.length + f.vals.length +
  (f.min > cat.filters.priceRange.min || f.max < cat.filters.priceRange.max ? 1 : 0)

/* ---------- Список товаров ---------- */
export function ProductList({ kind, id, title, f0, root }: { kind: string; id?: string; title?: string; f0?: FState; root?: boolean }) {
  const { cat, s, t, push, sheet } = useApp()
  const [f, setF] = useState<FState>(f0 ?? emptyF(cat))
  const base = useMemo(() => {
    const P = cat.products
    if (kind === 'sale') return P.filter((p) => p.old > 0 || p.pct > 0)
    if (kind === 'favs') return P.filter((p) => s.favs.includes(p.id))
    if (kind === 'cat' && id) { const c = findCat(cat.categories, id); return c ? productsIn(cat, c) : [] }
    if (kind === 'new') return [...P].sort((a, b) => (b.created || '').localeCompare(a.created || ''))
    if (kind === 'popular') return [...P].sort((a, b) => b.pct - a.pct || b.stock - a.stock)
    return P
  }, [kind, id, cat, s.favs])
  const list = applyF(cat, base, f)
  const n = activeCount(cat, f)
  return (
    <div className="screen home-screen">
      <TopBar noBack={root} title={<>{title ?? (kind === 'favs' ? t.favorites : t.seeAll)}<small className="cnt"> ({list.length})</small></>} />
      <div className="list-tools">
        <button onClick={() => sheet(<SortSheet value={f.sort} onPick={(v) => setF({ ...f, sort: v })} />)}><ArrowUpDown size={15} />{t.sortOpts[f.sort]}</button>
        <button className={n > 0 ? 'has-f' : ''} onClick={() => push('filters', { f, onApply: setF })}><SlidersHorizontal size={15} />{t.filters}{n > 0 && <i>{n}</i>}</button>
      </div>
      <div className="scroll">
        {list.length ? <Grid items={list} /> : kind === 'favs'
          ? <Empty icon={<Heart size={26} />} title={t.favEmpty} sub={t.favEmptySub} />
          : <Empty icon={<PackageSearch size={26} />} title={t.noProducts} sub={t.noProductsSub} />}
      </div>
    </div>
  )
}

export function SortSheet({ value, onPick }: { value: number; onPick: (v: number) => void }) {
  const { t, sheet } = useApp()
  return (
    <Sheet title={t.sort}>
      {t.sortOpts.map((o, i) => (
        <button key={o} className="radio-row" onClick={() => { onPick(i); sheet(null) }}>
          {o}<span className={'radio' + (i === value ? ' on' : '')} />
        </button>
      ))}
    </Sheet>
  )
}

/* ---------- Умная сортировка размеров (XXS → 7XL, 25 → 60) ---------- */
const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL']
function sortSizeVals<T extends { label: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const la = a.label.toUpperCase()
    const lb = b.label.toUpperCase()
    const ia = LETTER_ORDER.indexOf(la)
    const ib = LETTER_ORDER.indexOf(lb)
    if (ia >= 0 && ib >= 0) return ia - ib
    const na = parseFloat(la.replace(/[^\d.]/g, ''))
    const nb = parseFloat(lb.replace(/[^\d.]/g, ''))
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return la.localeCompare(lb)
  })
}

/* ---------- ПОЛНЫЙ ФИЛЬТР С НУЛЯ — Apple + конкурентные плюсы ---------- */
export function Filters({ f: f0, onApply, from }: { f?: FState; onApply?: (f: FState) => void; from?: string }) {
  const { cat, t, lang, pop, push } = useApp()
  const ext = t.ext
  const [f, setF] = useState<FState>(f0 ?? emptyF(cat))
  const [globalQ, setGlobalQ] = useState('')
  const [brandQ, setBrandQ] = useState('')
  const [matQ, setMatQ] = useState('')
  const [showAllColors, setShowAllColors] = useState(false)
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [sizeTab, setSizeTab] = useState(0)
  const [openExtra, setOpenExtra] = useState<Record<string, boolean>>({})

  const R = cat.filters.priceRange
  const tog = (k: 'cats' | 'brands' | 'vals', id: string) =>
    setF((x) => ({ ...x, [k]: x[k].includes(id) ? x[k].filter((y) => y !== id) : [...x[k], id] }))

  const count = useMemo(() => applyF(cat, cat.products, f).length, [cat, f])
  const nActive = activeCount(cat, f)
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - R.min) / Math.max(1, R.max - R.min)) * 100))

  const groups = useMemo(() => cat.filters.groups.filter((g) => g.values.some((v) => v.count > 0)), [cat.filters.groups])
  const sizeGroups = useMemo(() => groups.filter((g) => g.kind === 'size'), [groups])
  const colorGroup = useMemo(() => groups.find((g) => g.kind === 'color'), [groups])
  const materialGroup = useMemo(() => groups.find((g) => /material|материал/i.test(g.slug + ' ' + (g.name.ru || ''))), [groups])
  const genderGroup = useMemo(() => groups.find((g) => /gender|пол/i.test(g.slug + ' ' + (g.name.ru || ''))), [groups])
  const seasonGroup = useMemo(() => groups.find((g) => /season|сезон/i.test(g.slug + ' ' + (g.name.ru || ''))), [groups])

  const handledKeys = new Set([
    ...sizeGroups.map((g) => g.key),
    colorGroup?.key,
    materialGroup?.key,
    genderGroup?.key,
    seasonGroup?.key,
  ].filter(Boolean))
  const otherGroups = useMemo(() => groups.filter((g) => !handledKeys.has(g.key)), [groups, handledKeys])

  const gq = globalQ.trim().toLowerCase()
  const matchesGlobal = (label: string) => !gq || label.toLowerCase().includes(gq)

  // Список активных пилюль для 1-тап снятия (решает главную боль WB/Ozon!)
  const activePills = useMemo(() => {
    const res: { key: string; label: string; remove: () => void }[] = []
    if (f.inStock) res.push({ key: 'inStock', label: ext.onlyInStock, remove: () => setF((x) => ({ ...x, inStock: false })) })
    if (f.sale) res.push({ key: 'sale', label: t.discounted, remove: () => setF((x) => ({ ...x, sale: false })) })
    if (f.rating45) res.push({ key: 'r45', label: ext.highRating, remove: () => setF((x) => ({ ...x, rating45: false })) })
    if (f.min > R.min || f.max < R.max) {
      res.push({ key: 'price', label: `${fmt(f.min)}–${fmt(f.max)} ₸`, remove: () => setF((x) => ({ ...x, min: R.min, max: R.max })) })
    }
    for (const cid of f.cats) {
      const c = cat.categories.find((x) => x.id === cid)
      if (c) res.push({ key: 'c-' + cid, label: tx(c.name, lang), remove: () => tog('cats', cid) })
    }
    for (const bid of f.brands) {
      const b = cat.filters.brands.find((x) => x.id === bid)
      if (b) res.push({ key: 'b-' + bid, label: b.name, remove: () => tog('brands', bid) })
    }
    for (const vid of f.vals) {
      for (const g of groups) {
        const v = g.values.find((x) => x.id === vid)
        if (v) { res.push({ key: 'v-' + vid, label: tx(v.name, lang), remove: () => tog('vals', vid) }); break }
      }
    }
    return res
  }, [f, R, cat, groups, lang, ext, t])

  const pricePresets: [string, number, number][] = [
    [ext.pricePresets[0], R.min, Math.min(R.max, 10000)],
    [ext.pricePresets[1], Math.max(R.min, 10000), Math.min(R.max, 30000)],
    [ext.pricePresets[2], Math.max(R.min, 30000), Math.min(R.max, 60000)],
    [ext.pricePresets[3], Math.max(R.min, 60000), R.max],
  ]

  const filteredBrands = useMemo(() => {
    const q = (brandQ || globalQ).trim().toLowerCase()
    const base = [...cat.filters.brands].sort((a, b) => b.count - a.count)
    return q ? base.filter((b) => b.name.toLowerCase().includes(q)) : base
  }, [cat.filters.brands, brandQ, globalQ])

  const filteredMaterials = useMemo(() => {
    if (!materialGroup) return []
    const q = (matQ || globalQ).trim().toLowerCase()
    const base = materialGroup.values.filter((v) => v.count > 0)
    return q ? base.filter((v) => tx(v.name, lang).toLowerCase().includes(q)) : base
  }, [materialGroup, matQ, globalQ, lang])

  const curSizeGroup = sizeGroups[sizeTab] ?? sizeGroups[0]
  const apply = () => { if (onApply) { onApply(f); pop() } else { pop(); push('list', { kind: 'all', f0: f }) } }
  void from

  return (
    <div className="screen home-screen">
      <TopBar
        title={t.filters}
        right={nActive > 0 ? <button className="tb-link" onClick={() => setF(emptyF(cat))}>{t.reset}</button> : undefined}
      />

      {/* Живой глобальный поиск внутри фильтров */}
      <div className="flt-search-bar">
        <div className="flt-search-inp">
          <SearchIc size={16} color="#6d28d9" />
          <input value={globalQ} onChange={(e) => setGlobalQ(e.target.value)} placeholder={ext.filterSearchPh} />
          {globalQ && <button onClick={() => setGlobalQ('')}><X size={15} /></button>}
        </div>
      </div>

      {/* Липкая полоса выбранных фильтров с 1-тап удалением */}
      {activePills.length > 0 && (
        <div className="flt-active-bar">
          {activePills.map((p) => (
            <button key={p.key} className="flt-act-pill" onClick={p.remove}>
              <span>{p.label}</span>
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      <div className="scroll flt-scroll">
        {/* 1. Умные переключатели (решаем жалобы на WB/Ozon: наличие + скидки + рейтинг 4.5+) */}
        {!gq && (
          <div className="flt-card">
            <div className="flt-tog-row" onClick={() => setF({ ...f, inStock: !f.inStock })}>
              <span>{ext.onlyInStock}</span>
              <button type="button" className={'switch' + (f.inStock ? ' on' : '')}><i /></button>
            </div>
            <div className="flt-tog-row" onClick={() => setF({ ...f, sale: !f.sale })}>
              <span>{t.discounted}</span>
              <button type="button" className={'switch' + (f.sale ? ' on' : '')}><i /></button>
            </div>
            <div className="flt-tog-row" onClick={() => setF({ ...f, rating45: !f.rating45 })}>
              <span className="flt-star-lbl"><Star size={14} fill="#e59e0b" color="#e59e0b" />{ext.highRating}</span>
              <button type="button" className={'switch' + (f.rating45 ? ' on' : '')}><i /></button>
            </div>
          </div>
        )}

        {/* 2. Сортировка — горизонтальные чипы прямо в фильтре */}
        {!gq && (
          <div className="flt-card">
            <div className="flt-card-h">{t.sortSet}</div>
            <div className="flt-h-pills">
              {t.sortOpts.slice(0, 6).map((opt, idx) => (
                <button key={opt} className={'flt-pill' + (f.sort === idx ? ' on' : '')} onClick={() => setF({ ...f, sort: idx })}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Пол + Сезон — наглядные мобильные карточки */}
        {(genderGroup || seasonGroup) && (!gq || matchesGlobal('пол сезон gender season')) && (
          <div className="flt-card">
            {genderGroup && (
              <>
                <div className="flt-card-h">{tx(genderGroup.name, lang)}</div>
                <div className="flt-2col" style={{ marginBottom: seasonGroup ? 14 : 0 }}>
                  {genderGroup.values.filter((v) => v.count > 0).map((v) => {
                    const on = f.vals.includes(v.id)
                    return (
                      <button key={v.id} className={'flt-tile' + (on ? ' on' : '')} onClick={() => tog('vals', v.id)}>
                        <b>{tx(v.name, lang)}</b>
                        {on && <Check size={15} />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            {seasonGroup && (
              <>
                <div className="flt-card-h">{tx(seasonGroup.name, lang)}</div>
                <div className="flt-2col">
                  {seasonGroup.values.filter((v) => v.count > 0).map((v) => {
                    const on = f.vals.includes(v.id)
                    const nm = tx(v.name, lang)
                    const ic = /зим|winter|kış/i.test(nm) ? <Snowflake size={15} />
                      : /лет|summer|yaz/i.test(nm) ? <Sun size={15} />
                      : /деми/i.test(nm) ? <CloudRain size={15} />
                      : <Layers size={15} />
                    return (
                      <button key={v.id} className={'flt-tile' + (on ? ' on' : '')} onClick={() => tog('vals', v.id)}>
                        <span className="ft-ic">{ic}</span>
                        <b>{nm}</b>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. Цена — быстрые пресеты + аккуратные поля + слайдер */}
        {!gq && (
          <div className="flt-card">
            <div className="flt-card-h">{t.price}</div>
            <div className="flt-presets">
              {pricePresets.map(([lbl, a, b]) => {
                const on = f.min === a && f.max === b
                return (
                  <button key={lbl} className={'flt-preset' + (on ? ' on' : '')} onClick={() => setF({ ...f, min: a, max: b })}>
                    {lbl}
                  </button>
                )
              })}
            </div>
            <div className="price-in">
              <label><span>{t.from}</span><input inputMode="numeric" value={f.min.toLocaleString('ru-RU')} onChange={(e) => setF({ ...f, min: Math.min(f.max, Number(e.target.value.replace(/\D/g, '')) || R.min) })} /><span>₸</span></label>
              <label><span>{t.to}</span><input inputMode="numeric" value={f.max.toLocaleString('ru-RU')} onChange={(e) => setF({ ...f, max: Math.max(f.min, Math.min(R.max, Number(e.target.value.replace(/\D/g, '')) || R.max)) })} /><span>₸</span></label>
            </div>
            <div className="range">
              <i style={{ left: pct(f.min) + '%', right: 100 - pct(f.max) + '%' }} />
              <input type="range" min={R.min} max={R.max} step={500} value={f.min} onChange={(e) => setF({ ...f, min: Math.min(Number(e.target.value), f.max - 500) })} />
              <input type="range" min={R.min} max={R.max} step={500} value={f.max} onChange={(e) => setF({ ...f, max: Math.max(Number(e.target.value), f.min + 500) })} />
            </div>
          </div>
        )}

        {/* 5. РАЗМЕРЫ — ровная мобильная сетка с вкладками типов (Одежда / Обувь / Джинсы) */}
        {sizeGroups.length > 0 && (
          <div className="flt-card">
            <div className="flt-card-h">{ext.allSizes}</div>
            {sizeGroups.length > 1 && (
              <div className="flt-h-pills" style={{ marginBottom: 10 }}>
                {sizeGroups.map((sg, i) => (
                  <button key={sg.key} className={'flt-pill sm' + (sizeTab === i ? ' on' : '')} onClick={() => setSizeTab(i)}>
                    {tx(sg.name, lang)}
                  </button>
                ))}
              </div>
            )}
            {curSizeGroup && (
              <div className="flt-size-grid">
                {sortSizeVals(curSizeGroup.values.filter((v) => v.count > 0).map((v) => ({ id: v.id, label: tx(v.name, lang) }))).map((sz) => {
                  const on = f.vals.includes(sz.id)
                  return (
                    <button key={sz.id} className={'flt-sz-cell' + (on ? ' on' : '')} onClick={() => tog('vals', sz.id)}>
                      {sz.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. ЦВЕТ — современная визуальная палитра кружков 4 в ряд с галочкой внутри */}
        {colorGroup && (
          <div className="flt-card">
            <div className="flt-card-h">{tx(colorGroup.name, lang)}</div>
            <div className="flt-color-grid">
              {(showAllColors ? colorGroup.values.filter((v) => v.count > 0) : colorGroup.values.filter((v) => v.count > 0).slice(0, 12))
                .filter((v) => matchesGlobal(tx(v.name, lang)))
                .map((v) => {
                  const on = f.vals.includes(v.id)
                  const hex = hexOf(v.slug)
                  const isLight = hex === '#ffffff' || hex === '#f5ecd7' || hex === '#e8d9c0' || hex === '#efe6d2' || hex === '#fdd835'
                  return (
                    <button key={v.id} className={'flt-col-item' + (on ? ' on' : '')} onClick={() => tog('vals', v.id)}>
                      <span className="flt-col-dot" style={{ background: hex }}>
                        {on && <Check size={15} strokeWidth={3} color={isLight ? '#161224' : '#fff'} />}
                      </span>
                      <small>{tx(v.name, lang)}</small>
                    </button>
                  )
                })}
            </div>
            {colorGroup.values.filter((v) => v.count > 0).length > 12 && !gq && (
              <button className="more" onClick={() => setShowAllColors(!showAllColors)}>
                {showAllColors ? t.showLess : t.showMore(colorGroup.values.filter((v) => v.count > 0).length - 12)}
              </button>
            )}
          </div>
        )}

        {/* 7. МАТЕРИАЛ — с собственным быстрым поиском! */}
        {materialGroup && filteredMaterials.length > 0 && (
          <div className="flt-card">
            <div className="flt-card-h">{tx(materialGroup.name, lang)}</div>
            <div className="flt-mini-search">
              <SearchIc size={14} />
              <input value={matQ} onChange={(e) => setMatQ(e.target.value)} placeholder={ext.searchMaterialPh} />
              {matQ && <button onClick={() => setMatQ('')}><X size={13} /></button>}
            </div>
            <div className="fchips">
              {filteredMaterials.map((v) => {
                const on = f.vals.includes(v.id)
                return (
                  <button key={v.id} className={on ? 'on' : ''} onClick={() => tog('vals', v.id)}>
                    {tx(v.name, lang)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 8. БРЕНД — с собственным поиском по брендам! */}
        {filteredBrands.length > 0 && (
          <div className="flt-card">
            <div className="flt-card-h">{t.brand}</div>
            <div className="flt-mini-search">
              <SearchIc size={14} />
              <input value={brandQ} onChange={(e) => setBrandQ(e.target.value)} placeholder={ext.searchBrandPh} />
              {brandQ && <button onClick={() => setBrandQ('')}><X size={13} /></button>}
            </div>
            <div className="fchips">
              {(showAllBrands || brandQ || globalQ ? filteredBrands : filteredBrands.slice(0, 10)).map((b) => (
                <button key={b.id} className={f.brands.includes(b.id) ? 'on' : ''} onClick={() => tog('brands', b.id)}>
                  {b.name}
                </button>
              ))}
            </div>
            {!brandQ && !globalQ && filteredBrands.length > 10 && (
              <button className="more" onClick={() => setShowAllBrands(!showAllBrands)}>
                {showAllBrands ? t.showLess : t.showMore(filteredBrands.length - 10)}
              </button>
            )}
          </div>
        )}

        {/* 9. КАТЕГОРИЯ (только активные категории с товарами) */}
        <div className="flt-card">
          <div className="flt-card-h">{t.category}</div>
          <div className="fchips">
            {cat.categories.filter((c) => c.count > 0 && matchesGlobal(tx(c.name, lang))).map((c) => (
              <button key={c.id} className={f.cats.includes(c.id) ? 'on' : ''} onClick={() => tog('cats', c.id)}>
                {tx(c.name, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* 10. Дополнительные атрибуты — компактные аккордеоны */}
        {otherGroups.map((g) => {
          const vals = g.values.filter((v) => v.count > 0 && matchesGlobal(tx(v.name, lang)))
          if (!vals.length) return null
          const isOpen = !!openExtra[g.key] || !!gq || vals.some((v) => f.vals.includes(v.id))
          return (
            <div className="flt-card compact" key={g.key}>
              <button className="flt-acc-h" onClick={() => setOpenExtra((x) => ({ ...x, [g.key]: !isOpen }))}>
                <span>{tx(g.name, lang)}</span>
                {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {isOpen && (
                <div className="fchips" style={{ marginTop: 10 }}>
                  {vals.map((v) => (
                    <button key={v.id} className={f.vals.includes(v.id) ? 'on' : ''} onClick={() => tog('vals', v.id)}>
                      {tx(v.name, lang)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ height: 24 }} />
      </div>

      <div className="foot-cta flt-foot">
        <button className="btn" onClick={apply}>
          {t.showProducts} <small>({count})</small>
        </button>
      </div>
    </div>
  )
}
