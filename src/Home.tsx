import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, Bell, SlidersHorizontal, Search as SearchIc, X, MapPin, Plus, Check,
  ChevronLeft, Globe, Sparkles, Flame, Percent, Store, Home as HomeIc, Briefcase,
  Navigation, Trash2, Pencil, ArrowRight, Zap, LayoutGrid, Clock, Star, ShoppingBag, CircleCheck,
} from 'lucide-react'
import { useApp, tx, code, fmt, productsIn, type Address, type Product } from './store'
import { Grid, HScroll, SectionHead, Sheet, LangSheet, Empty, Seg, SkeletonGrid } from './ui'
import { emptyF } from './Catalog'
import { COUNTRIES, PICKUP_POINTS, findCountryByName, type CountryInfo } from './geo'
import { LANGS } from './i18n'

/* ---------- Интерактивная шторка адреса: 4 страны (UZ/KZ/RU/KG) + умный автоподбор городов ---------- */
export function AddressSheet() {
  const { s, set, sheet, t, toast, lang } = useApp()
  const ui = t.homeUI
  const [mode, setMode] = useState<0 | 1>(() => {
    const cur = s.addresses.find((a) => a.id === s.addressId)
    return cur?.kind === 'pickup' ? 1 : 0
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [pvzCountry, setPvzCountry] = useState<CountryInfo['code']>('KZ')
  const [locating, setLocating] = useState(false)

  // поля формы адреса
  const [title, setTitle] = useState(ui.quickLabels[0])
  const [countryCode, setCountryCode] = useState<CountryInfo['code']>('UZ')
  const [city, setCity] = useState('')
  const [cityConfirmed, setCityConfirmed] = useState(false)
  const [cityFocus, setCityFocus] = useState(false)
  const [street, setStreet] = useState('')
  const [apt, setApt] = useState('')
  const [comment, setComment] = useState('')
  const [homeType, setHomeType] = useState<'flat' | 'house'>('flat')

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]

  const openAdd = () => {
    setEditId(null)
    setTitle(ui.quickLabels[0])
    setCountryCode('UZ')
    setCity('')
    setCityConfirmed(false)
    setCityFocus(false)
    setStreet('')
    setApt('')
    setComment('')
    setHomeType('flat')
    setFormOpen(true)
  }

  const openEdit = (a: Address) => {
    const cObj = findCountryByName(a.country)
    setEditId(a.id)
    setTitle(a.title)
    setCountryCode(cObj.code)
    setCity(a.city)
    setCityConfirmed(!!a.city)
    setCityFocus(false)
    setStreet(a.street)
    setApt(a.apt || '')
    setComment(a.comment || '')
    setHomeType(a.home)
    setFormOpen(true)
  }

  const detectGeo = () => {
    if (locating) return
    setLocating(true)
    window.setTimeout(() => {
      setCountryCode('KZ')
      setCity('Алматы')
      setCityConfirmed(true)
      setCityFocus(false)
      setStreet('пр. Абая, 52В')
      setApt('14')
      setLocating(false)
      toast(<span className="toast-row"><Navigation size={15} color="#AE33FF" />{ui.geoFound}</span>)
    }, 550)
  }

  // Умный автоподбор городов по введённым буквам (приоритет выбранной стране + поиск по всем 4 странам)
  const citySuggestions = useMemo(() => {
    const q = city.trim().toLowerCase()
    if (!q) {
      return selectedCountry.cities.slice(0, 6).map((name) => ({ name, country: selectedCountry }))
    }
    const primary = selectedCountry.cities
      .filter((c) => c.toLowerCase().includes(q))
      .sort((a, b) => (a.toLowerCase().startsWith(q) ? -1 : 1) - (b.toLowerCase().startsWith(q) ? -1 : 1))
      .map((name) => ({ name, country: selectedCountry }))

    const secondary = COUNTRIES.filter((co) => co.code !== selectedCountry.code).flatMap((co) =>
      co.cities
        .filter((c) => c.toLowerCase().includes(q))
        .map((name) => ({ name, country: co })),
    )
    return [...primary, ...secondary].slice(0, 8)
  }, [city, selectedCountry])

  const pickCity = (name: string, co: CountryInfo) => {
    setCountryCode(co.code)
    setCity(name)
    setCityConfirmed(true)
    setCityFocus(false)
  }

  const saveAddress = () => {
    if (!city.trim() || !street.trim()) return
    const next: Address = {
      id: editId ?? `addr-${Date.now()}`,
      title: title.trim() || ui.quickLabels[0],
      type: 'individual',
      country: selectedCountry.name[lang],
      city: city.trim(),
      street: apt.trim() ? `${street.trim()}, ${apt.trim()}` : street.trim(),
      apt: apt.trim(),
      comment: comment.trim(),
      home: homeType,
      kind: 'courier',
      name: s.user ? `${s.user.first} ${s.user.last}`.trim() : 'Покупатель JJ',
      phone: s.user?.phone || `${selectedCountry.dial} 000 00 00`,
    }
    set((x) => ({
      ...x,
      addresses: editId ? x.addresses.map((y) => (y.id === editId ? next : y)) : [next, ...x.addresses],
      addressId: next.id,
    }))
    sheet(null)
    toast(<span className="toast-row"><MapPin size={15} color="#AE33FF" />{ui.addrSaved}</span>)
  }

  const pickPickup = (pt: (typeof PICKUP_POINTS)[number]) => {
    const co = COUNTRIES.find((c) => c.code === pt.country) ?? COUNTRIES[1]
    const addr: Address = {
      id: pt.id,
      title: pt.title,
      type: 'individual',
      country: co.name[lang],
      city: pt.city,
      street: pt.street,
      home: 'house',
      kind: 'pickup',
      name: s.user ? `${s.user.first} ${s.user.last}`.trim() : 'Покупатель JJ',
      phone: s.user?.phone || `${co.dial} 000 00 00`,
    }
    set((x) => ({
      ...x,
      addresses: x.addresses.some((y) => y.id === pt.id) ? x.addresses : [...x.addresses, addr],
      addressId: pt.id,
    }))
    sheet(null)
    toast(<span className="toast-row"><Store size={15} color="#AE33FF" />{pt.city} · {pt.title}</span>)
  }

  const removeAddr = (id: string) => {
    set((x) => {
      const rest = x.addresses.filter((y) => y.id !== id)
      return { ...x, addresses: rest, addressId: x.addressId === id ? (rest[0]?.id ?? null) : x.addressId }
    })
  }

  const courierAddresses = s.addresses.filter((a) => a.kind !== 'pickup')
  const pvzList = PICKUP_POINTS.filter((p) => p.country === pvzCountry)

  const highlightMatch = (name: string) => {
    const q = city.trim()
    if (!q) return name
    const idx = name.toLowerCase().indexOf(q.toLowerCase())
    if (idx < 0) return name
    return (
      <>
        {name.slice(0, idx)}
        <mark className="city-hl">{name.slice(idx, idx + q.length)}</mark>
        {name.slice(idx + q.length)}
      </>
    )
  }

  if (formOpen) {
    const canSave = city.trim().length > 1 && street.trim().length > 2
    return (
      <Sheet title={
        <span className="sh-back-t">
          <button className="sh-back" onClick={() => setFormOpen(false)} aria-label={t.back}><ChevronLeft size={20} /></button>
          {editId ? t.edit : ui.addNewAddr}
        </span>
      }>
        <button type="button" className={'geo-btn' + (locating ? ' busy' : '')} onClick={detectGeo}>
          <Navigation size={15} className={locating ? 'spinning' : ''} />
          <span>{ui.detectGeo}</span>
        </button>

        {/* Выбор одной из 4 стран (UZ / KZ / RU / KG) */}
        <div className="af-sec-lbl">{ui.selectCountry}</div>
        <div className="country-grid">
          {COUNTRIES.map((co) => {
            const on = co.code === countryCode
            return (
              <button
                key={co.code}
                type="button"
                className={'co-card' + (on ? ' on' : '')}
                onClick={() => {
                  setCountryCode(co.code)
                  if (!co.cities.includes(city)) { setCity(''); setCityConfirmed(false) }
                }}
              >
                <span className="co-flag">{co.flag}</span>
                <span className="co-name">{co.name[lang]}</span>
                {on && <span className="co-chk"><Check size={12} strokeWidth={3} /></span>}
              </button>
            )
          })}
        </div>

        {/* Выбранные страна и город — наглядный статус «Выбран» */}
        {cityConfirmed && city.trim() ? (
          <div className="chosen-loc-pill">
            <CircleCheck size={17} color="#16a34a" />
            <div className="cl-txt">
              <small>{ui.selectedBadge}</small>
              <b>{selectedCountry.flag} {selectedCountry.name[lang]} · {city}</b>
            </div>
            <button type="button" className="cl-edit" onClick={() => { setCityConfirmed(false); setCityFocus(true) }}>
              {ui.changeBtn}
            </button>
          </div>
        ) : (
          <div className="city-auto-wrap">
            <label className="af-field">
              <span>{t.city}</span>
              <div className="city-inp-box">
                <SearchIc size={15} className="ci-ic" />
                <input
                  value={city}
                  onFocus={() => setCityFocus(true)}
                  onChange={(e) => { setCity(e.target.value); setCityConfirmed(false); setCityFocus(true) }}
                  placeholder={ui.cityPh}
                />
                {city && (
                  <button type="button" className="ci-clr" onClick={() => { setCity(''); setCityConfirmed(false) }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </label>

            {/* Живые подсказки городов при вводе */}
            {(cityFocus || city.trim().length > 0) && (
              <div className="city-drop">
                {citySuggestions.length > 0 ? (
                  citySuggestions.map((item) => (
                    <button
                      key={item.country.code + '-' + item.name}
                      type="button"
                      className="city-sug"
                      onClick={() => pickCity(item.name, item.country)}
                    >
                      <span className="cs-left">
                        <MapPin size={14} />
                        <span>{highlightMatch(item.name)}</span>
                      </span>
                      <span className="cs-co">{item.country.flag} {item.country.name[lang]}</span>
                    </button>
                  ))
                ) : (
                  <div className="city-empty">{ui.cityNotFound}</div>
                )}
              </div>
            )}

            {/* Быстрые популярные города выбранной страны */}
            <div className="addr-cities">
              {selectedCountry.cities.slice(0, 6).map((c) => (
                <button key={c} type="button" className={'ac-chip' + (city === c ? ' on' : '')} onClick={() => pickCity(c, selectedCountry)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Метка адреса (Дом / Работа / Другое) */}
        <div className="addr-label-pills" style={{ marginTop: 10 }}>
          {ui.quickLabels.map((lbl, idx) => (
            <button key={lbl} type="button" className={'al-pill' + (title === lbl ? ' on' : '')} onClick={() => setTitle(lbl)}>
              {idx === 0 ? <HomeIc size={14} /> : idx === 1 ? <Briefcase size={14} /> : <MapPin size={14} />}
              {lbl}
            </button>
          ))}
        </div>

        <div className="addr-fields">
          <label className="af-field">
            <span>{t.street}</span>
            <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder={ui.streetPh} />
          </label>
          <label className="af-field">
            <span>{t.flat} / {t.house}</span>
            <input value={apt} onChange={(e) => setApt(e.target.value)} placeholder={ui.aptPh} />
          </label>
          <Seg items={[t.flat, t.house]} value={homeType === 'flat' ? 0 : 1} onChange={(i) => setHomeType(i ? 'house' : 'flat')} />
          <label className="af-field">
            <span>{ui.commentPh}</span>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Подъезд 2, домофон 14…" />
          </label>
        </div>

        <button className={'btn' + (canSave ? '' : ' dis')} disabled={!canSave} onClick={saveAddress} style={{ marginTop: 14 }}>
          <Check size={18} />{t.save}
        </button>
      </Sheet>
    )
  }

  return (
    <Sheet title={t.chooseAddress}>
      <Seg items={[ui.courier, ui.pickup]} value={mode} onChange={(i) => setMode(i as 0 | 1)} />

      {mode === 0 ? (
        <>
          {courierAddresses.length === 0 ? (
            <div className="addr-empty-box">
              <div className="addr-empty-ic"><MapPin size={24} /></div>
              <b>{t.noAddress}</b>
              <p>🇺🇿 🇰🇿 🇷🇺 🇰🇬 · {ui.freeShip}</p>
            </div>
          ) : (
            <div className="addr-list">
              {courierAddresses.map((a) => {
                const active = s.addressId === a.id
                const co = findCountryByName(a.country)
                return (
                  <div key={a.id} className={'addr-opt' + (active ? ' on' : '')} onClick={() => {
                    set((x) => ({ ...x, addressId: a.id }))
                    sheet(null)
                    toast(<span className="toast-row"><MapPin size={15} color="#6d28d9" />{ui.addrSelected}</span>)
                  }}>
                    <span className="ao-ic">{a.title === ui.quickLabels[1] ? <Briefcase size={17} /> : <HomeIc size={17} />}</span>
                    <div className="ao-txt">
                      <b>{a.title} <span className="ao-flag">{co.flag}</span></b>
                      <small>{a.country}, {a.city}, {a.street}</small>
                    </div>
                    <div className="ao-acts" onClick={(e) => e.stopPropagation()}>
                      <button className="ao-btn" onClick={() => openEdit(a)} aria-label={t.edit}><Pencil size={14} /></button>
                      <button className="ao-btn red" onClick={() => removeAddr(a.id)} aria-label={t.del}><Trash2 size={14} /></button>
                    </div>
                    {active && <span className="ao-chk"><Check size={14} strokeWidth={2.8} /></span>}
                  </div>
                )
              })}
            </div>
          )}
          <button className="btn" onClick={openAdd} style={{ marginTop: 12 }}>
            <Plus size={18} />{ui.addNewAddr}
          </button>
        </>
      ) : (
        <>
          <div className="addr-cities" style={{ marginBottom: 10 }}>
            {COUNTRIES.map((co) => (
              <button key={co.code} type="button" className={'ac-chip' + (pvzCountry === co.code ? ' on' : '')} onClick={() => setPvzCountry(co.code)}>
                {co.flag} {co.name[lang]}
              </button>
            ))}
          </div>
          <div className="addr-list">
            {pvzList.map((pt) => {
              const active = s.addressId === pt.id
              return (
                <button key={pt.id} type="button" className={'pvz-card' + (active ? ' on' : '')} onClick={() => pickPickup(pt)}>
                  <div className="pvz-top">
                    <span className="pvz-ic"><Store size={17} /></span>
                    <div className="pvz-txt">
                      <b>{pt.title}</b>
                      <small>{pt.city}, {pt.street}</small>
                    </div>
                    {active && <span className="ao-chk"><Check size={14} strokeWidth={2.8} /></span>}
                  </div>
                  <div className="pvz-meta">
                    <span className="pvz-free">{ui.pickupFree}</span>
                    <span><Clock size={12} />{pt.hours}</span>
                    <span><Star size={12} fill="#e59e0b" color="#e59e0b" />{pt.rating}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </Sheet>
  )
}

export const addrLabel = (s: ReturnType<typeof useApp>['s']) => {
  const a = s.addresses.find((x) => x.id === s.addressId)
  return a ? `${a.city}, ${a.street}` : ''
}

export const addrMeta = (s: ReturnType<typeof useApp>['s']) => {
  const a = s.addresses.find((x) => x.id === s.addressId)
  if (!a) return null
  const co = findCountryByName(a.country)
  return { title: `${co.flag} ${a.title}`, short: `${a.city}, ${a.street}`, isPickup: a.kind === 'pickup', full: `${a.country}, ${a.city}, ${a.street}` }
}

/* ---------- Полноэкранный просмотрщик историй (благородные матовые тона без WB-градиента) ---------- */
interface StoryItem {
  id: string; label: string; title: string; subtitle: string; bg: string; thumb: string
  products: Product[]; onAction: () => void; cta: string
}

function StoryViewer({ stories, startIdx, onSeen }: { stories: StoryItem[]; startIdx: number; onSeen: (id: string) => void }) {
  const { sheet, push, lang } = useApp()
  const [idx, setIdx] = useState(startIdx)
  const cur = stories[idx]

  useEffect(() => {
    if (cur) onSeen(cur.id)
    const timer = window.setTimeout(() => {
      if (idx < stories.length - 1) setIdx(idx + 1)
      else sheet(null)
    }, 5500)
    return () => window.clearTimeout(timer)
  }, [idx])

  if (!cur) return null

  return (
    <div className="story-overlay" style={{ background: cur.bg }}>
      <div className="story-bars">
        {stories.map((st, i) => (
          <div className="story-bar" key={st.id}>
            <i className={i < idx ? 'done' : i === idx ? 'run' : ''} key={i === idx ? `run-${idx}` : st.id} />
          </div>
        ))}
      </div>

      <div className="story-head">
        <div className="story-brand">
          <span className="story-av"><img src="/brand/JJ_symbol_white.svg" alt="JJ" /></span>
          <div><b>JJ Market</b><small>{cur.label}</small></div>
        </div>
        <button className="story-close" onClick={() => sheet(null)} aria-label="Close"><X size={20} /></button>
      </div>

      <div className="story-tap-l" onClick={() => setIdx(Math.max(0, idx - 1))} />
      <div className="story-tap-r" onClick={() => (idx < stories.length - 1 ? setIdx(idx + 1) : sheet(null))} />

      <div className="story-content">
        <span className="story-pill"><Sparkles size={13} />{cur.label}</span>
        <h2>{cur.title}</h2>
        <p>{cur.subtitle}</p>

        <div className="story-prods">
          {cur.products.slice(0, 3).map((p) => (
            <button key={p.id} className="story-prod" onClick={() => { sheet(null); push('product', { id: p.id }) }}>
              <img src={'/' + p.images[0]} alt="" />
              <div className="sp-info">
                <span className="sp-name">{tx(p.name, lang)}</span>
                <div className="sp-price">
                  <b>{fmt(p.price)} ₸</b>
                  {p.pct > 0 && <em>-{p.pct}%</em>}
                </div>
              </div>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="story-foot">
        <button className="story-cta" onClick={() => { sheet(null); cur.onAction() }}>
          <span>{cur.cta}</span><ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

/* ---------- Живой таймер обратного отсчёта ---------- */
function FlashTimer() {
  const [sec, setSec] = useState(2 * 3600 + 41 * 60 + 18)
  useEffect(() => {
    const i = window.setInterval(() => setSec((v) => (v > 0 ? v - 1 : 3 * 3600)), 1000)
    return () => window.clearInterval(i)
  }, [])
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return (
    <div className="flash-timer">
      <span>{h}</span><i>:</i><span>{m}</span><i>:</i><span>{s}</span>
    </div>
  )
}

/* ---------- ГЛАВНЫЙ ЭКРАН JJ MARKET ---------- */
export function Home() {
  const { cat, push, tab, t, lang, s, sheet } = useApp()
  const ui = t.homeUI
  const [ready, setReady] = useState(false)
  const [slide, setSlide] = useState(0)
  const [hintIdx, setHintIdx] = useState(0)
  const [feedTab, setFeedTab] = useState<string>('foryou')
  const [feedLimit, setFeedLimit] = useState(14)
  const [seenStories, setSeenStories] = useState<string[]>([])
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { const x = window.setTimeout(() => setReady(true), 220); return () => window.clearTimeout(x) }, [])
  useEffect(() => {
    const i = window.setInterval(() => setHintIdx((v) => (v + 1) % ui.searchHints.length), 3200)
    return () => window.clearInterval(i)
  }, [ui.searchHints.length])

  const P = cat.products
  const forYouProds = useMemo(() => {
    const score = (p: Product) =>
      (p.images.length > 1 ? 6 : 0) +
      (p.pct > 0 ? 5 : 0) +
      (p.brand ? 4 : 0) +
      ((p.name.ru?.length || 0) > 8 ? 5 : 0) +
      Math.min(5, p.rating)
    const sorted = [...P].sort((a, b) => score(b) - score(a))
    const seen = new Set<string>()
    const diverse: Product[] = []
    const rest: Product[] = []
    for (const p of sorted) {
      const k = (p.name.ru || p.name.tr || p.id).trim().toLowerCase()
      if (!seen.has(k)) { seen.add(k); diverse.push(p) } else rest.push(p)
    }
    return [...diverse, ...rest]
  }, [P])
  const saleProds = useMemo(() => [...P].filter((p) => p.pct > 0 || p.old > 0).sort((a, b) => b.pct - a.pct || b.reviews - a.reviews), [P])
  const popProds = useMemo(() => [...P].sort((a, b) => (b.rating * 10 + b.reviews + (b.pct ? 4 : 0)) - (a.rating * 10 + a.reviews + (a.pct ? 4 : 0)) || b.stock - a.stock), [P])
  const newProds = useMemo(() => [...P].sort((a, b) => (b.created || '').localeCompare(a.created || '')), [P])
  const activeCats = useMemo(() => cat.categories.filter((c) => c.count > 0), [cat.categories])

  const topBrands = useMemo(() => {
    return [...cat.filters.brands]
      .filter((b) => b.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((b) => ({
        ...b,
        thumb: P.find((p) => p.brand === b.name && p.images[0])?.images[0] || '',
      }))
  }, [cat.filters.brands, P])

  // Истории с благородными тёмными матовыми фонами (без WB-градиента)
  const stories: StoryItem[] = useMemo(() => {
    const shoesCat = activeCats.find((c) => /shoe|footwear/i.test(c.slug))
    const bagsCat = activeCats.find((c) => /accessories/i.test(c.slug))
    const beautyCat = activeCats.find((c) => /beauty/i.test(c.slug))
    const womenCat = activeCats.find((c) => c.slug === 'women')
    return [
      {
        id: 'sale', label: ui.storySale, title: ui.salePromoTitle, subtitle: ui.salePromoSub,
        bg: '#1c1229',
        thumb: saleProds[0]?.images[0] || P[0]?.images[0] || '',
        products: saleProds.slice(0, 3), cta: ui.salePromoBtn,
        onAction: () => push('list', { kind: 'sale', title: t.discount }),
      },
      {
        id: 'new', label: ui.storyNew, title: ui.newPromoTitle, subtitle: ui.newPromoSub,
        bg: '#151320',
        thumb: newProds[0]?.images[0] || P[1]?.images[0] || '',
        products: newProds.slice(0, 3), cta: ui.newPromoBtn,
        onAction: () => push('list', { kind: 'new', title: t.newest }),
      },
      {
        id: 'hit', label: ui.storyHit, title: t.popular, subtitle: ui.flashSub,
        bg: '#231636',
        thumb: popProds[0]?.images[0] || P[2]?.images[0] || '',
        products: popProds.slice(0, 3), cta: ui.storyCta,
        onAction: () => push('list', { kind: 'popular', title: t.popular }),
      },
      ...(shoesCat ? [{
        id: 'shoes', label: ui.storyShoes, title: tx(shoesCat.name, lang), subtitle: t.ext.catalogSub,
        bg: '#181826',
        thumb: shoesCat.image || productsIn(cat, shoesCat)[0]?.images[0] || '',
        products: productsIn(cat, shoesCat).slice(0, 3), cta: ui.storyCta,
        onAction: () => push('subcats', { id: shoesCat.id }),
      }] : []),
      ...(bagsCat ? [{
        id: 'bags', label: ui.storyBags, title: tx(bagsCat.name, lang), subtitle: t.ext.catalogSub,
        bg: '#241528',
        thumb: bagsCat.image || productsIn(cat, bagsCat)[0]?.images[0] || '',
        products: productsIn(cat, bagsCat).slice(0, 3), cta: ui.storyCta,
        onAction: () => push('subcats', { id: bagsCat.id }),
      }] : []),
      ...(beautyCat ? [{
        id: 'beauty', label: ui.storyBeauty, title: tx(beautyCat.name, lang), subtitle: t.ext.catalogSub,
        bg: '#1c1829',
        thumb: beautyCat.image || productsIn(cat, beautyCat)[0]?.images[0] || '',
        products: productsIn(cat, beautyCat).slice(0, 3), cta: ui.storyCta,
        onAction: () => push('subcats', { id: beautyCat.id }),
      }] : []),
      ...(womenCat ? [{
        id: 'women', label: ui.storyBrands, title: tx(womenCat.name, lang), subtitle: t.ext.catalogSub,
        bg: '#191426',
        thumb: womenCat.image || productsIn(cat, womenCat)[0]?.images[0] || '',
        products: productsIn(cat, womenCat).slice(0, 3), cta: ui.storyCta,
        onAction: () => push('subcats', { id: womenCat.id }),
      }] : []),
    ]
  }, [activeCats, saleProds, newProds, popProds, P, lang, ui, t, cat, push])

  // Герой-баннеры в официальной палитре JJ Market (#AE33FF + #484848 + #FFFFFF — БЕЗ WB-градиента!)
  const heroSlides = useMemo(() => {
    const list: { id: string; render: () => JSX.Element }[] = [
      {
        id: 'jj-sale',
        render: () => (
          <div className="hero-card hero-brand" onClick={() => push('list', { kind: 'sale', title: t.discount })}>
            <div className="hero-left">
              <span className="hero-badge light"><Percent size={11} />JJ SALE · −60%</span>
              <h3>{ui.salePromoTitle}</h3>
              <p>{ui.salePromoSub}</p>
              <span className="hero-btn">{ui.salePromoBtn}<ArrowRight size={14} /></span>
            </div>
            <div className="hero-collage">
              {saleProds.slice(0, 2).map((p, i) => (
                <img key={p.id} src={'/' + p.images[0]} alt="" className={'hc-img hc-' + i} />
              ))}
            </div>
          </div>
        ),
      },
      ...cat.sliders.map((b) => ({
        id: `api-${b.id}`,
        render: () => (
          <div className="hero-card hero-api" onClick={() => push('list', { kind: 'sale', title: t.discount })}>
            <img src={'/' + b.image} alt="" />
          </div>
        ),
      })),
      {
        id: 'jj-new',
        render: () => (
          <div className="hero-card hero-grey" onClick={() => push('list', { kind: 'new', title: t.newest })}>
            <div className="hero-left">
              <span className="hero-badge purple"><Zap size={11} />NEW COLLECTION</span>
              <h3>{ui.newPromoTitle}</h3>
              <p>{ui.newPromoSub}</p>
              <span className="hero-btn">{ui.newPromoBtn}<ArrowRight size={14} /></span>
            </div>
            <div className="hero-collage">
              {newProds.slice(0, 2).map((p, i) => (
                <img key={p.id} src={'/' + p.images[0]} alt="" className={'hc-img hc-' + i} />
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'jj-ai',
        render: () => (
          <div className="hero-card hero-soft" onClick={() => push('ai')}>
            <div className="hero-left">
              <span className="hero-badge purple"><Sparkles size={11} />JJ AI STYLIST</span>
              <h3>{ui.aiPromoTitle}</h3>
              <p>{ui.aiPromoSub}</p>
              <span className="hero-btn purple">{ui.aiPromoBtn}<ArrowRight size={14} /></span>
            </div>
            <div className="hero-ai-orb">
              <Sparkles size={32} />
            </div>
          </div>
        ),
      },
    ]
    return list
  }, [cat.sliders, saleProds, newProds, ui, t, push])

  useEffect(() => {
    if (heroSlides.length <= 1) return
    const timer = window.setInterval(() => {
      setSlide((prev) => {
        const next = (prev + 1) % heroSlides.length
        const el = bannerRef.current
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
        return next
      })
    }, 5500)
    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  const feedTabs = useMemo(() => [
    { k: 'foryou', l: ui.feedForYou },
    { k: 'sale', l: ui.feedSale },
    { k: 'pop', l: ui.feedPop },
    { k: 'new', l: ui.feedNew },
    ...activeCats.slice(0, 5).map((c) => ({ k: 'cat:' + c.id, l: tx(c.name, lang) })),
  ], [ui, activeCats, lang])

  const feedProducts = useMemo(() => {
    if (feedTab === 'sale') return saleProds
    if (feedTab === 'pop') return popProds
    if (feedTab === 'new') return newProds
    if (feedTab.startsWith('cat:')) {
      const id = feedTab.slice(4)
      const c = activeCats.find((x) => x.id === id)
      return c ? productsIn(cat, c) : forYouProds
    }
    return forYouProds
  }, [feedTab, forYouProds, saleProds, popProds, newProds, activeCats, cat])

  const addr = addrMeta(s)
  const shortLang = LANGS.find((l) => l.code === s.lang)?.short || 'RU'

  const openStory = (i: number) => {
    sheet(
      <StoryViewer
        stories={stories}
        startIdx={i}
        onSeen={(id) => setSeenStories((prev) => (prev.includes(id) ? prev : [...prev, id]))}
      />,
    )
  }

  return (
    <div className="screen home-screen">
      <header className={'jj-header' + (scrolled ? ' stuck' : '')}>
        <div className="jj-top-row">
          <button
            className="jj-logo-btn"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="JJ Market"
          >
            <img src="/brand/JJ_symbol_white.svg" alt="JJ" />
          </button>

          <button className="jj-addr-pill" onClick={() => sheet(<AddressSheet />)}>
            <span className="jj-addr-pin">
              {addr?.isPickup ? <Store size={14} /> : <MapPin size={14} />}
            </span>
            <span className="jj-addr-txt">
              <small>{addr ? (addr.isPickup ? ui.pickupPoint : addr.title) : ui.deliverTo}</small>
              <b>{addr ? addr.short : t.chooseAddress}</b>
            </span>
            <ChevronDown size={15} className="jj-addr-chev" />
          </button>

          <button className="jj-lang-btn" onClick={() => sheet(<LangSheet />)} aria-label={t.language}>
            <Globe size={13} />
            <span>{shortLang}</span>
          </button>

          <button className="jj-notif-btn" onClick={() => push('news')} aria-label={t.news}>
            <Bell size={19} strokeWidth={1.9} />
            <i className="notif-dot" />
          </button>
        </div>

        <div className="jj-search-row">
          <div className="jj-search-bar" onClick={() => push('search')} role="button" tabIndex={0}>
            <SearchIc size={18} className="jj-s-ic" />
            <span className="jj-s-ph" key={hintIdx}>{ui.searchHints[hintIdx]}</span>
            <button
              type="button"
              className="jj-s-ai"
              onClick={(e) => { e.stopPropagation(); push('ai') }}
              aria-label={t.ai}
              title={t.ai}
            >
              <Sparkles size={15} />
            </button>
          </div>
          <button className="jj-filter-btn" onClick={() => push('filters', { from: 'home' })} aria-label={t.filters}>
            <SlidersHorizontal size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div
        className="scroll home-scroll"
        ref={scrollRef}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 12)}
      >
        {/* 1. Истории */}
        <div className="stories-strip">
          {stories.map((st, i) => {
            const seen = seenStories.includes(st.id)
            return (
              <button key={st.id} className={'story-item' + (seen ? ' seen' : '')} onClick={() => openStory(i)}>
                <span className="story-ring">
                  <span className="story-inner">
                    {st.thumb ? <img src={'/' + st.thumb} alt="" /> : <Sparkles size={20} color="#6d28d9" />}
                  </span>
                  {st.id === 'sale' && <em className="story-badge">%</em>}
                </span>
                <span className="story-lbl">{st.label}</span>
              </button>
            )
          })}
        </div>

        {/* 2. Главный баннер-карусель */}
        <div className="hero-wrap">
          <div
            className="hero-track"
            ref={bannerRef}
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.clientWidth > 0) setSlide(Math.round(el.scrollLeft / el.clientWidth))
            }}
          >
            {heroSlides.map((sl) => (
              <div className="hero-slide" key={sl.id}>{sl.render()}</div>
            ))}
          </div>
          <div className="hero-dots">
            {heroSlides.map((sl, i) => (
              <button
                key={sl.id}
                aria-label={`Slide ${i + 1}`}
                className={i === slide ? 'on' : ''}
                onClick={() => {
                  setSlide(i)
                  const el = bannerRef.current
                  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        </div>

        {/* 3. Категории — чистые, эстетичные, БЕЗ цифр остатков */}
        <SectionHead title={ui.catsTitle} onAll={() => tab('cats')} />
        <div className="bento-cats">
          <button className="bcat bcat-sale" onClick={() => push('list', { kind: 'sale', title: t.discount })}>
            <span className="bcat-ic-box"><Percent size={22} strokeWidth={2.4} /></span>
            <b>{t.discount}</b>
          </button>
          {activeCats.map((c) => (
            <button key={c.id} className="bcat" onClick={() => push('subcats', { id: c.id })}>
              <div className="bcat-img">
                {c.image ? <img src={'/' + c.image} alt="" loading="lazy" /> : <ShoppingBag size={20} color="#6d28d9" />}
              </div>
              <b>{tx(c.name, lang)}</b>
            </button>
          ))}
          <button className="bcat bcat-all" onClick={() => tab('cats')}>
            <span className="bcat-ic-box dark"><LayoutGrid size={20} /></span>
            <b>{ui.allCatsTile}</b>
          </button>
        </div>

        {/* 4. Горящие скидки */}
        {saleProds.length > 0 && (
          <section className="flash-section">
            <div className="flash-head">
              <div className="flash-title-wrap">
                <span className="flash-ic"><Flame size={17} fill="#d92d53" color="#d92d53" /></span>
                <div>
                  <h2>{ui.flashTitle}</h2>
                  <small>{ui.flashSub}</small>
                </div>
              </div>
              <div className="flash-right">
                <FlashTimer />
                <button className="flash-all" onClick={() => push('list', { kind: 'sale', title: ui.flashTitle })}>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
            {ready ? <HScroll items={saleProds.slice(0, 10)} flash /> : <SkeletonGrid count={2} />}
          </section>
        )}

        {/* 5. Топ бренды */}
        {topBrands.length > 0 && (
          <>
            <SectionHead title={ui.brandsTitle} onAll={() => push('filters', { from: 'home' })} />
            <div className="brands-strip">
              {topBrands.map((b) => (
                <button
                  key={b.id}
                  className="brand-pill"
                  onClick={() => push('list', { kind: 'all', title: b.name, f0: { ...emptyF(cat), brands: [b.id] } })}
                >
                  <span className="bp-img">
                    {b.thumb ? <img src={'/' + b.thumb} alt="" loading="lazy" /> : <Sparkles size={14} />}
                  </span>
                  <span className="bp-txt">
                    <b>{b.name}</b>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 6. Интерактивная лента рекомендаций */}
        <div className="feed-tabs-wrap">
          <div className="feed-tabs">
            {feedTabs.map((ft) => (
              <button
                key={ft.k}
                className={'ftab' + (feedTab === ft.k ? ' on' : '')}
                onClick={() => { setFeedTab(ft.k); setFeedLimit(14) }}
              >
                {ft.l}
              </button>
            ))}
          </div>
        </div>

        <div className="feed-body" key={feedTab}>
          {ready ? (
            <>
              <Grid items={feedProducts.slice(0, feedLimit)} />
              {feedLimit < feedProducts.length && (
                <button className="load-more-btn" onClick={() => setFeedLimit((n) => n + 16)}>
                  <span>{ui.loadMore}</span>
                  <small>({feedProducts.length - feedLimit})</small>
                </button>
              )}
            </>
          ) : (
            <SkeletonGrid count={4} />
          )}
        </div>

        {/* 7. Новинки */}
        <SectionHead title={t.newest} onAll={() => push('list', { kind: 'new', title: t.newest })} />
        {ready && <HScroll items={newProds.slice(0, 10)} />}

        <div style={{ height: 26 }} />
      </div>
    </div>
  )
}

/* ---------- Поиск ---------- */
const RECENT = 'jj-market-recent-search'
export function SearchScreen() {
  const { cat, pop, t, lang, push } = useApp()
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(RECENT) || '[]') } catch { return [] } })
  useEffect(() => { ref.current?.focus() }, [])
  const norm = (x: string) => x.toLocaleLowerCase('tr').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  const res: Product[] = useMemo(() => {
    const n = norm(q.trim())
    if (n.length < 2) return []
    return cat.products.filter((p) => code(p).includes(n) || Object.values(p.name).some((v) => v && norm(v).includes(n)) || norm(p.brand).includes(n))
  }, [q, cat])
  const remember = (v: string) => { const r = [v, ...recent.filter((x) => x !== v)].slice(0, 6); setRecent(r); localStorage.setItem(RECENT, JSON.stringify(r)) }
  const topBrands = useMemo(() => [...cat.filters.brands].sort((a, b) => b.count - a.count).slice(0, 6), [cat.filters.brands])

  return (
    <div className="screen">
      <div className="search-top">
        <button className="tb-back" onClick={pop}><ChevronLeft size={24} /></button>
        <div className="search-box live">
          <SearchIc size={17} color="#6d28d9" />
          <input ref={ref} placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && q.trim() && remember(q.trim())} />
          {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={17} /></button>}
        </div>
      </div>
      <div className="scroll">
        {q.trim().length < 2 ? (
          <>
            {recent.length > 0 && (
              <div className="recent">{recent.map((r) => <button key={r} className="chip" onClick={() => setQ(r)}>{r}</button>)}</div>
            )}
            <div className="sec-h" style={{ marginTop: 8 }}><h2>{t.homeUI.brandsTitle}</h2></div>
            <div className="chips wrap" style={{ marginBottom: 14 }}>
              {topBrands.map((b) => <button key={b.id} className="chip" onClick={() => setQ(b.name)}>{b.name}</button>)}
            </div>
            <div className="sec-h" style={{ marginTop: 8 }}><h2>{t.homeUI.catsTitle}</h2></div>
            <div className="chips wrap">{cat.categories.filter((c) => c.count > 0).map((c) => <button key={c.id} className="chip" onClick={() => push('subcats', { id: c.id })}>{tx(c.name, lang)}</button>)}</div>
          </>
        ) : res.length ? (
          <><div className="muted small" style={{ margin: '4px 0 12px' }}>{res.length} {t.items}</div><Grid items={res} /></>
        ) : <Empty icon={<SearchIc size={26} />} title={t.noProducts} sub={t.noProductsSub} />}
      </div>
    </div>
  )
}
