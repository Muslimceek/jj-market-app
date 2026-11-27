import { useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, X, Heart, Star, Flag, Leaf, Play, Check, ChevronRight, ShoppingBag, Plus, Minus, Sparkles, CircleCheck, Flame } from 'lucide-react'
import { useApp, tx, sizeAxis, colorAxis, hexOf, type Product } from './store'
import { COUNTRIES } from './geo'
import { LANGS } from './i18n'

export function TopBar({ title, right, onBack, sub, noBack }: { title: ReactNode; right?: ReactNode; onBack?: () => void; sub?: ReactNode; noBack?: boolean }) {
  const { pop } = useApp()
  return (
    <div className="topbar">
      {noBack ? <span style={{ width: 6 }} /> : <button className="tb-back" onClick={onBack ?? pop} aria-label="Back"><ChevronLeft size={23} /></button>}
      <h1>{title}</h1>
      {sub}
      {right}
    </div>
  )
}

export function Sheet({ title, children, footer, onClose }: { title?: ReactNode; children: ReactNode; footer?: ReactNode; onClose?: () => void }) {
  const { sheet } = useApp()
  const close = () => { onClose?.(); sheet(null) }
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {title && <div className="sh"><span>{title}</span><button className="sh-x" onClick={close} aria-label="Close"><X size={16} /></button></div>}
        <div className="sh-body">{children}</div>
        {footer && <div className="sh-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function LangSheet() {
  const { s, set, sheet, t, toast } = useApp()
  return (
    <Sheet title={t.language}>
      {LANGS.map((l) => (
        <button key={l.code} className={'opt' + (s.lang === l.code ? ' on' : '')} onClick={() => {
          set((x) => ({ ...x, lang: l.code }))
          sheet(null)
          toast(<span className="toast-row"><Sparkles size={15} color="#AE33FF" />{l.label}</span>)
        }}>
          <span className="opt-l"><span className="pill">{l.short}</span>{l.label}</span>{s.lang === l.code && <Check size={18} />}
        </button>
      ))}
    </Sheet>
  )
}

/** Быстрый переключатель страны и валюты (UZS · KZT · RUB · KGS) */
export function CurrencySheet() {
  const { s, set, sheet, t, lang, toast } = useApp()
  return (
    <Sheet title={t.ext.currencyTitle}>
      <div className="curr-list">
        {COUNTRIES.map((co) => {
          const active = s.country === co.code
          return (
            <button
              key={co.code}
              className={'curr-opt' + (active ? ' on' : '')}
              onClick={() => {
                set((x) => ({ ...x, country: co.code, pay: co.payments[0]?.title ?? x.pay }))
                sheet(null)
                toast(
                  <span className="toast-row">
                    <span>{co.flag}</span>
                    <span>{t.ext.currencyChanged(co.name[lang], co.symbol)}</span>
                  </span>,
                )
              }}
            >
              <span className="co-flag-lg">{co.flag}</span>
              <span className="co-meta">
                <b>{co.name[lang]}</b>
                <small>{co.currency} · {co.dial}</small>
              </span>
              <span className={'co-sym' + (active ? ' on' : '')}>{co.symbol}</span>
              {active && <Check size={17} color="#AE33FF" strokeWidth={2.8} />}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

export function Seg({ items, value, onChange }: { items: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="seg">
      <i style={{ width: `calc(${100 / items.length}% - 4px)`, transform: `translateX(${value * 100}%)` }} />
      {items.map((l, i) => <button key={l} type="button" className={i === value ? 'on' : ''} onClick={() => onChange(i)}>{l}</button>)}
    </div>
  )
}

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="−">−</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="+">+</button>
    </div>
  )
}

export function Empty({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return <div className="empty"><div className="empty-ic">{icon}</div><b>{title}</b>{sub && <p>{sub}</p>}{action}</div>
}

export function Row({ label, onClick, right, danger }: { label: ReactNode; onClick?: () => void; right?: ReactNode; danger?: boolean }) {
  return <button className={'row' + (danger ? ' danger' : '')} onClick={onClick}><span>{label}</span>{right ?? <ChevronRight size={18} />}</button>
}

/** Фото с горизонтальным свайп-листанием прямо в ленте (WB / Ozon / Trendyol) */
export function Gallery({ images, className, onTap, ratio = '4 / 4.4' }: { images: string[]; className?: string; onTap?: () => void; ratio?: string }) {
  const [i, setI] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const swiped = useRef(false)
  const imgs = images.length ? images : ['']

  const jump = (e: React.MouseEvent, k: number) => {
    e.stopPropagation()
    setI(k)
    const el = ref.current
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className={'gal ' + (className ?? '')} style={{ aspectRatio: ratio }}>
      <div
        className="gal-track"
        ref={ref}
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; swiped.current = false }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - startX.current) > 10) swiped.current = true }}
        onClick={(e) => {
          if (swiped.current) { e.stopPropagation(); swiped.current = false; return }
          onTap?.()
        }}
        onScroll={(e) => { const el = e.currentTarget; if (el.clientWidth > 0) setI(Math.round(el.scrollLeft / el.clientWidth)) }}
      >
        {imgs.map((src, k) => (
          <div className="gal-slide" key={k}>
            {src ? <img src={'/' + src} loading="lazy" decoding="async" alt="" /> : null}
          </div>
        ))}
      </div>
      {imgs.length > 1 && (
        <div className="gal-dots" onClick={(e) => e.stopPropagation()}>
          {imgs.map((_, k) => (
            <button key={k} type="button" className={k === i ? 'on' : ''} onClick={(e) => jump(e, k)} aria-label={`Photo ${k + 1}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Badges({ p }: { p: Product }) {
  if (!p.badges.length) return null
  return (
    <div className="pc-badges">
      {p.badges.slice(0, 2).map((b) => (
        <span key={b.slug} className="pc-badge" style={{ color: b.color || '#C8102E' }} title={b.slug}>
          {b.slug.includes('organic') || b.slug.includes('natural') || b.slug.includes('vegan') ? <Leaf size={10} fill="currentColor" /> : <Flag size={10} fill="currentColor" />}
        </span>
      ))}
    </div>
  )
}

export function FavBtn({ id, big }: { id: string; big?: boolean }) {
  const { s, set, t, toast } = useApp()
  const on = s.favs.includes(id)
  const [pop, setPop] = useState(false)
  return (
    <button
      className={'fav' + (on ? ' on' : '') + (big ? ' big' : '') + (pop ? ' burst' : '')}
      aria-label={t.favorites}
      onClick={(e) => {
        e.stopPropagation()
        setPop(true)
        window.setTimeout(() => setPop(false), 380)
        set((x) => ({ ...x, favs: on ? x.favs.filter((f) => f !== id) : [...x.favs, id] }))
        if (!on) toast(<span className="toast-row"><Heart size={15} fill="#d92d53" color="#d92d53" />{t.favorites}</span>)
      }}
    >
      <Heart size={big ? 20 : 16} fill={on ? '#d92d53' : 'none'} color={on ? '#d92d53' : big ? '#161224' : '#2f2940'} strokeWidth={2} />
    </button>
  )
}

/** Чистая мультивалютная цена (UZS · KZT · RUB · KGS) с плавной сменой */
export function Price({ p, big }: { p: Product; big?: boolean }) {
  const { money, s } = useApp()
  return (
    <div className={'price-wrap' + (big ? ' big' : '')}>
      <div className={'price' + (p.pct > 0 ? ' sale' : '') + (big ? ' big' : '')} key={s.country}>
        <b className="price-morph">{money(p.price)}</b>
        {p.old > 0 && <s>{money(p.old)}</s>}
      </div>
    </div>
  )
}

/** Рейтинг и отзывы — без выдуманных сроков доставки «завтра» */
export function Rating({ p }: { p: Product }) {
  const { t } = useApp()
  const ratingVal = p.rating > 0 ? p.rating.toFixed(1) : '4.9'
  const revCnt = p.reviews > 0 ? p.reviews : 0
  return (
    <div className="rating">
      <span className="rat-star"><Star size={12} fill="#e59e0b" color="#e59e0b" /><b>{ratingVal}</b></span>
      {revCnt > 0 && <span className="rat-cnt">· {revCnt} {t.reviewsShort}</span>}
    </div>
  )
}

/** Быстрый выбор размера и цвета (работает и на главной, и в корзине) */
export function QuickSizeSheet({ p, onReplaceKey }: { p: Product; onReplaceKey?: string }) {
  const { t, lang, addToCart, set, sheet, toast, push, money } = useApp()
  const cAx = colorAxis(p)
  const sAx = sizeAxis(p)
  const [color, setColor] = useState(cAx?.values[0]?.id)
  const [selVar, setSelVar] = useState<string | null>(null)
  const vars = p.variants.filter((v) => !color || v.values.includes(color))
  const sizeOf = (vId: string) => sAx?.values.find((x) => p.variants.find((v) => v.id === vId)?.values.includes(x.id))
  const colorName = tx(cAx?.values.find((v) => v.id === color)?.name, lang)

  const confirm = () => {
    const v = vars.find((x) => x.id === selVar)
    if (!v) return
    const szLabel = tx(sizeOf(v.id)?.name, lang)
    const label = [colorName, szLabel].filter(Boolean).join(' · ')
    if (onReplaceKey) {
      set((x) => {
        const old = x.cart.find((c) => c.key === onReplaceKey)
        const nextKey = p.id + '|' + v.id
        const filtered = x.cart.filter((c) => c.key !== onReplaceKey)
        const ex = filtered.findIndex((c) => c.key === nextKey)
        if (ex >= 0) filtered[ex] = { ...filtered[ex], qty: filtered[ex].qty + (old?.qty ?? 1) }
        else filtered.push({ key: nextKey, productId: p.id, variantId: v.id, label, qty: old?.qty ?? 1, selected: old?.selected ?? true })
        return { ...x, cart: filtered }
      })
      sheet(null)
      toast(<span className="toast-row"><CircleCheck size={16} color="#16a34a" />{label || t.saved}</span>)
      return
    }
    addToCart(p.id, [{ variantId: v.id, label, qty: 1 }])
    sheet(null)
    toast(
      <span className="added">
        <img src={'/' + p.images[0]} alt="" />
        <span><small>{t.added}{label ? ` · ${label}` : ''}</small>{tx(p.name, lang)}</span>
        <CircleCheck size={22} color="#16a34a" fill="#e9f9ef" />
      </span>,
    )
  }

  return (
    <Sheet title={t.homeUI.quickSizeTitle}>
      <div className="qs-head">
        <img src={'/' + p.images[0]} alt="" />
        <div className="qs-info">
          <div className="qs-brand">{p.brand || p.seller}</div>
          <div className="qs-name">{tx(p.name, lang)}</div>
          <div className="qs-price">
            <b>{money(p.price)}</b>
            {p.old > 0 && <s>{money(p.old)}</s>}
            {p.pct > 0 && <em>-{p.pct}%</em>}
          </div>
        </div>
      </div>

      {cAx && cAx.values.length > 0 && (
        <div className="qs-colors">
          <span className="muted small">{t.color}: <b>{colorName}</b></span>
          <div className="qs-swatches">
            {cAx.values.map((v) => (
              <button key={v.id} className={'sw-btn' + (v.id === color ? ' on' : '')} onClick={() => { setColor(v.id); setSelVar(null) }}>
                <i style={{ background: hexOf(v.slug) }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="qs-sizes">
        {vars.map((v) => {
          const sz = sizeOf(v.id)
          const disabled = v.stock <= 0
          const active = selVar === v.id
          return (
            <button
              key={v.id}
              disabled={disabled}
              className={'qs-sz' + (active ? ' on' : '') + (disabled ? ' out' : '')}
              onClick={() => setSelVar(v.id)}
            >
              <b>{tx(sz?.name, lang) || 'ONE'}</b>
              <small>{v.stock > 0 ? `${v.stock} ${t.pcs}` : '0'}</small>
            </button>
          )
        })}
      </div>

      <div className="qs-actions">
        <button className="qs-detail" onClick={() => { sheet(null); push('product', { id: p.id }) }}>{t.homeUI.openProduct}</button>
        <button className={'btn' + (selVar ? '' : ' dis')} disabled={!selVar} onClick={confirm}>
          <ShoppingBag size={17} />{onReplaceKey ? t.save : t.addToCart}
        </button>
      </div>
    </Sheet>
  )
}

/** Карточка товара JJ Market — чистая, просторная, без надуманных бейджей */
export function ProductCard({ p, w, flash, idx = 0 }: { p: Product; w?: number; flash?: boolean; idx?: number }) {
  const { push, t, lang, s, set, addToCart, sheet, toast } = useApp()
  const cAx = colorAxis(p)
  const sAx = sizeAxis(p)
  const hasMultiSizes = !!(sAx && sAx.values.length > 1)
  const cartLines = s.cart.filter((c) => c.productId === p.id)
  const inCartQty = cartLines.reduce((a, c) => a + c.qty, 0)
  const singleLine = cartLines.length === 1 ? cartLines[0] : null
  const stockLeft = Math.max(1, Math.min(99, p.stock || p.variants.reduce((a, v) => a + (v.stock || 0), 0) || 7))

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasMultiSizes) {
      sheet(<QuickSizeSheet p={p} />)
      return
    }
    const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0]
    const cName = tx(cAx?.values[0]?.name, lang)
    addToCart(p.id, [{ variantId: v?.id, label: cName, qty: 1 }])
    toast(
      <span className="added">
        <img src={'/' + p.images[0]} alt="" />
        <span><small>{t.added}</small>{tx(p.name, lang)}</span>
        <CircleCheck size={22} color="#16a34a" fill="#e9f9ef" />
      </span>,
    )
  }

  const changeQty = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation()
    if (hasMultiSizes && delta > 0) {
      sheet(<QuickSizeSheet p={p} />)
      return
    }
    if (!singleLine) {
      if (delta < 0 && cartLines.length > 0) {
        const last = cartLines[cartLines.length - 1]
        set((x) => ({
          ...x,
          cart: x.cart.map((c) => (c.key === last.key ? { ...c, qty: c.qty - 1 } : c)).filter((c) => c.qty > 0),
        }))
      }
      return
    }
    const nextQty = singleLine.qty + delta
    set((x) => ({
      ...x,
      cart: nextQty <= 0
        ? x.cart.filter((c) => c.key !== singleLine.key)
        : x.cart.map((c) => (c.key === singleLine.key ? { ...c, qty: Math.min(stockLeft, nextQty) } : c)),
    }))
  }

  return (
    <div
      className={'pc' + (flash ? ' pc-flash' : '')}
      style={{ ...(w ? { width: w } : {}), animationDelay: `${Math.min(idx, 7) * 35}ms` }}
      onClick={() => push('product', { id: p.id })}
    >
      <div className="pc-img">
        <Gallery images={p.images.slice(0, 5)} ratio="4 / 4.4" />
        <FavBtn id={p.id} />

        <div className="pc-top-tags">
          {p.pct > 0 && <span className="pc-pct-pill">-{p.pct}%</span>}
          {p.pct === 0 && p.rating >= 4.7 && <span className="pc-tag-hit"><Flame size={10} />{t.homeUI.hitBadge}</span>}
          {p.hasVideo && <span className="pc-video"><Play size={9} fill="#fff" />{t.video}</span>}
        </div>
        <Badges p={p} />
      </div>

      <div className="pc-body">
        <Price p={p} />
        <div className="pc-brand-row">
          <span className="pc-brand">{p.brand || p.seller}</span>
          {cAx && cAx.values.length > 1 && (
            <span className="pc-swatches" onClick={(e) => e.stopPropagation()}>
              {cAx.values.slice(0, 4).map((v) => <i key={v.id} style={{ background: hexOf(v.slug) }} />)}
              {cAx.values.length > 4 && <span>+{cAx.values.length - 4}</span>}
            </span>
          )}
        </div>
        <div className="pc-name">{tx(p.name, lang)}</div>
        <Rating p={p} />

        {flash && (
          <div className="pc-stock-bar">
            <div className="pc-stock-track"><i style={{ width: `${Math.max(18, Math.min(88, 100 - stockLeft * 4))}%` }} /></div>
            <span>{t.homeUI.leftPcs(Math.min(stockLeft, 15))}</span>
          </div>
        )}

        {inCartQty > 0 ? (
          <div className="pc-qty" onClick={(e) => e.stopPropagation()}>
            <button onClick={(e) => changeQty(e, -1)} aria-label="−"><Minus size={15} /></button>
            <span>{inCartQty} {t.pcs}</span>
            <button onClick={(e) => changeQty(e, 1)} aria-label="+"><Plus size={15} /></button>
          </div>
        ) : (
          <button className="pc-add" onClick={quickAdd}>
            <ShoppingBag size={14} strokeWidth={2.2} />
            <span>{t.addToCart}</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function Grid({ items }: { items: Product[] }) {
  return <div className="grid">{items.map((p, i) => <ProductCard key={p.id} p={p} idx={i} />)}</div>
}

export function HScroll({ items, flash }: { items: Product[]; flash?: boolean }) {
  return <div className="hscroll">{items.map((p, i) => <ProductCard key={p.id} p={p} w={164} flash={flash} idx={i} />)}</div>
}

export function SectionHead({ title, sub, onAll, badge }: { title: string; sub?: string; onAll?: () => void; badge?: ReactNode }) {
  const { t } = useApp()
  return (
    <div className="sec-h">
      <div className="sec-h-l">
        <div className="sec-h-row">
          <h2>{title}</h2>
          {badge}
        </div>
        {sub && <small>{sub}</small>}
      </div>
      {onAll && <button onClick={onAll}><span>{t.seeAll}</span><ChevronRight size={15} /></button>}
    </div>
  )
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="pc-skel" key={i}>
          <div className="skel-img shimmer" />
          <div className="skel-line w60 shimmer" />
          <div className="skel-line w90 shimmer" />
          <div className="skel-line w40 shimmer" />
          <div className="skel-btn shimmer" />
        </div>
      ))}
    </div>
  )
}

export const Spinner = () => <div className="spin-wrap"><div className="spin" /></div>
