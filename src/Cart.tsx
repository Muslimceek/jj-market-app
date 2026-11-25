import { useMemo, useState } from 'react'
import {
  ChevronRight, Heart, CreditCard, ShoppingCart, Check, PartyPopper, Trash2,
  MapPin, Store, Tag, Sparkles, RotateCcw, Smartphone, Wallet, ShieldCheck, SlidersHorizontal,
} from 'lucide-react'
import { useApp, tx, fmt, sizeAxis } from './store'
import { Sheet, Stepper, QuickSizeSheet, HScroll, SectionHead } from './ui'
import { AddressSheet, addrMeta } from './Home'

export function PaySheet() {
  const { t, s, set, sheet } = useApp()
  return (
    <Sheet title={t.payMethod}>
      {t.pays.map((p) => (
        <button key={p} className="radio-row" onClick={() => { set((x) => ({ ...x, pay: p })); sheet(null) }}>
          <span className="opt-l"><CreditCard size={18} />{p}</span><span className={'radio' + (s.pay === p ? ' on' : '')} />
        </button>
      ))}
    </Sheet>
  )
}

const FREE_SHIP_THRESHOLD = 15000

/* ---------- КОРЗИНА С НУЛЯ: Apple-дизайн + выгода + промокод + undo + смена размера ---------- */
export function Cart() {
  const { s, set, t, lang, cat, sheet, toast, push, tab, requireLogin } = useApp()
  const ext = t.ext
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState<string | null>(null)
  const [promoErr, setPromoErr] = useState(false)

  const lines = s.cart
    .map((l) => ({ l, p: cat.products.find((p) => p.id === l.productId) }))
    .filter((x): x is { l: (typeof s.cart)[number]; p: NonNullable<typeof x.p> } => !!x.p)

  const sel = lines.filter((x) => x.l.selected)
  const selQty = sel.reduce((a, { l }) => a + l.qty, 0)

  const rawOldSum = sel.reduce((a, { l, p }) => {
    const curPrice = p.variants.find((v) => v.id === l.variantId)?.price || p.price
    const origPrice = p.old > curPrice ? p.old : curPrice
    return a + origPrice * l.qty
  }, 0)

  const subSum = sel.reduce((a, { l, p }) => {
    const curPrice = p.variants.find((v) => v.id === l.variantId)?.price || p.price
    return a + curPrice * l.qty
  }, 0)

  const itemSavings = Math.max(0, rawOldSum - subSum)
  const promoCut = promoApplied ? Math.round(subSum * 0.1) : 0
  const finalSum = Math.max(0, subSum - promoCut)
  const totalSavings = itemSavings + promoCut
  const allSel = lines.length > 0 && sel.length === lines.length
  const addr = addrMeta(s)

  const shipProgress = Math.min(100, Math.round((finalSum / FREE_SHIP_THRESHOLD) * 100))
  const shipNeed = Math.max(0, FREE_SHIP_THRESHOLD - finalSum)

  // Подборка «С этим часто берут»
  const crossSell = useMemo(() => {
    const inCartIds = new Set(s.cart.map((c) => c.productId))
    return cat.products
      .filter((p) => !inCartIds.has(p.id) && p.images.length > 0 && (p.name.ru?.length || 0) > 6)
      .sort((a, b) => b.pct - a.pct || b.rating - a.rating)
      .slice(0, 8)
  }, [cat.products, s.cart])

  const upd = (key: string, fn: (l: (typeof s.cart)[number]) => (typeof s.cart)[number] | null) =>
    set((x) => ({ ...x, cart: x.cart.map((l) => (l.key === key ? fn(l) : l)).filter(Boolean) as typeof x.cart }))

  // Удаление с возможностью мгновенно отменить (Undo — решает боль WB/Ozon!)
  const removeWithUndo = (line: (typeof s.cart)[number]) => {
    set((x) => ({ ...x, cart: x.cart.filter((c) => c.key !== line.key) }))
    toast(
      <span className="toast-undo">
        <span>{ext.cartRemoved}</span>
        <button
          onClick={() => set((x) => ({ ...x, cart: [line, ...x.cart.filter((c) => c.key !== line.key)] }))}
        >
          <RotateCcw size={13} />{ext.cartUndo}
        </button>
      </span>,
    )
  }

  const applyPromo = (codeStr?: string) => {
    const v = (codeStr ?? promoInput).trim().toUpperCase()
    if (!v) return
    if (v === 'JJ10' || v === 'WELCOME' || v === 'JJ2026') {
      setPromoApplied(v)
      setPromoInput(v)
      setPromoErr(false)
      toast(<span className="toast-row"><Tag size={15} color="#16a34a" />{ext.promoApplied}</span>)
    } else {
      setPromoErr(true)
      toast(ext.promoInvalid)
    }
  }

  const order = () => {
    if (!requireLogin()) return
    if (!sel.length) return toast(t.needSelect)
    if (!addr) { toast(t.needAddress); sheet(<AddressSheet />); return }
    const payMethod = s.pay ?? t.pays[0]
    const id = String(Math.floor(100000000 + Math.random() * 899999999))
    const now = new Date()
    set((x) => ({
      ...x,
      pay: payMethod,
      orders: [{
        id, date: now.toISOString(), total: finalSum, address: addr.full, pay: payMethod, status: 0,
        lines: sel.map(({ l, p }) => ({
          productId: p.id, label: l.label, qty: l.qty,
          price: p.variants.find((v) => v.id === l.variantId)?.price || p.price,
        })),
      }, ...x.orders],
      cart: x.cart.filter((l) => !l.selected),
    }))
    push('orderOk', { id })
  }

  const payIcons = [Wallet, CreditCard, Smartphone, Smartphone]

  return (
    <div className="screen home-screen">
      <header className="cart-header">
        <div>
          <h1>{t.cart}</h1>
          {lines.length > 0 && <small>{ext.cartSelected(selQty)}</small>}
        </div>
        {lines.length > 0 && (
          <button className="cart-clear-btn" onClick={() => set((x) => ({ ...x, cart: [] }))}>
            <Trash2 size={14} />{t.clearAll}
          </button>
        )}
      </header>

      {lines.length === 0 ? (
        <div className="scroll">
          <div className="fav-empty-card">
            <div className="fec-orb"><ShoppingCart size={28} color="#AE33FF" strokeWidth={1.9} /></div>
            <h2>{t.cartEmpty}</h2>
            <p>{t.cartEmptySub}</p>
            <button className="btn small" onClick={() => tab('cats')}>
              <Sparkles size={15} />{t.goShopping}
            </button>
          </div>
          <SectionHead title={ext.cartAlsoBuy} onAll={() => push('list', { kind: 'all' })} />
          <HScroll items={crossSell} />
          <div style={{ height: 22 }} />
        </div>
      ) : (
        <>
          <div className="scroll cart-scroll">
            {/* 1. Прогресс бесплатной доставки */}
            <div className={'ship-bar-card' + (shipNeed === 0 ? ' ok' : '')}>
              <div className="sb-top">
                <ShieldCheck size={16} color={shipNeed === 0 ? '#16a34a' : '#AE33FF'} />
                <span>{shipNeed === 0 ? ext.cartFreeShipOk : ext.cartFreeShipNeed(fmt(shipNeed))}</span>
              </div>
              <div className="sb-track"><i style={{ width: `${shipProgress}%` }} /></div>
            </div>

            {/* 2. Карточка адреса доставки */}
            <button className="cart-addr-card" onClick={() => sheet(<AddressSheet />)}>
              <span className="cac-ic">{addr?.isPickup ? <Store size={17} /> : <MapPin size={17} />}</span>
              <div className="cac-txt">
                <small>{addr ? (addr.isPickup ? t.homeUI.pickupPoint : addr.title) : t.homeUI.deliverTo}</small>
                <b>{addr ? addr.full : t.chooseAddress}</b>
              </div>
              <span className="cac-act">{t.homeUI.changeBtn}</span>
              <ChevronRight size={16} color="#968fa8" />
            </button>

            {/* 3. Панель «Выбрать все / Удалить выбранные» */}
            <div className="cart-select-bar">
              <label className="cb-row">
                <input type="checkbox" checked={allSel} onChange={() => set((x) => ({ ...x, cart: x.cart.map((l) => ({ ...l, selected: !allSel })) }))} />
                <span className="cb">{allSel && <Check size={13} strokeWidth={3} />}</span>
                <span>{t.selectAll}</span>
              </label>
              {sel.length > 0 && (
                <button className="cart-del-sel" onClick={() => set((x) => ({ ...x, cart: x.cart.filter((l) => !l.selected) }))}>
                  {t.deleteSelected} ({sel.length})
                </button>
              )}
            </div>

            {/* 4. Список товаров в отдельных аккуратных Apple-карточках */}
            <div className="cart-cards">
              {lines.map(({ l, p }) => {
                const price = p.variants.find((v) => v.id === l.variantId)?.price || p.price
                const fav = s.favs.includes(p.id)
                const max = p.variants.find((v) => v.id === l.variantId)?.stock || p.stock || 99
                const hasSizes = !!(sizeAxis(p)?.values.length)
                return (
                  <div className={'cart-card' + (l.selected ? '' : ' dim')} key={l.key}>
                    <div className="cc-row">
                      <label className="cb-row">
                        <input type="checkbox" checked={l.selected} onChange={() => upd(l.key, (x) => ({ ...x, selected: !x.selected }))} />
                        <span className="cb">{l.selected && <Check size={13} strokeWidth={3} />}</span>
                      </label>
                      <div className="cc-img-wrap" onClick={() => push('product', { id: p.id })}>
                        <img src={'/' + p.images[0]} alt="" />
                        {p.pct > 0 && <em>-{p.pct}%</em>}
                      </div>
                      <div className="cc-body">
                        <div className="cc-price-row">
                          <b>{fmt(price * l.qty)} ₸</b>
                          {p.old > price && <s>{fmt(p.old * l.qty)} ₸</s>}
                        </div>
                        <div className="cc-brand">{p.brand || p.seller}</div>
                        <div className="cc-name" onClick={() => push('product', { id: p.id })}>{tx(p.name, lang)}</div>

                        {/* Кнопка смены размера/цвета прямо в корзине */}
                        {(l.label || hasSizes) && (
                          <button className="cc-var-pill" onClick={() => sheet(<QuickSizeSheet p={p} onReplaceKey={l.key} />)}>
                            <span>{l.label || ext.cartChangeVar}</span>
                            <SlidersHorizontal size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="cc-foot">
                      <button
                        className={'cc-act-btn' + (fav ? ' fav-on' : '')}
                        onClick={() => set((x) => ({ ...x, favs: fav ? x.favs.filter((f) => f !== p.id) : [...x.favs, p.id] }))}
                        aria-label={t.favorites}
                      >
                        <Heart size={15} fill={fav ? '#d92d53' : 'none'} color={fav ? '#d92d53' : '#5d5670'} />
                      </button>
                      <button className="cc-act-btn" onClick={() => removeWithUndo(l)} aria-label={t.del}>
                        <Trash2 size={15} />
                      </button>
                      <div className="cc-step-wrap">
                        <Stepper value={l.qty} max={max} onChange={(n) => upd(l.key, (x) => ({ ...x, qty: n }))} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 5. Промокод (рабочий: JJ10 / WELCOME) */}
            <div className="promo-card">
              <div className={'promo-row' + (promoErr ? ' err' : '')}>
                <Tag size={16} color="#AE33FF" />
                <input
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoErr(false) }}
                  placeholder={ext.promoPh}
                  onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                />
                {promoApplied ? (
                  <button className="promo-clear" onClick={() => { setPromoApplied(null); setPromoInput('') }}>{t.reset}</button>
                ) : (
                  <button className="promo-btn" onClick={() => applyPromo()}>{ext.promoApply}</button>
                )}
              </div>
              {!promoApplied && (
                <button className="promo-hint" onClick={() => applyPromo('JJ10')}>
                  <Sparkles size={12} />Нажмите, чтобы применить <b>JJ10</b> (−10%)
                </button>
              )}
            </div>

            {/* 6. Способ оплаты — визуальные Apple-карточки прямо на экране */}
            <div className="pay-section">
              <div className="ps-title">{t.payMethod}</div>
              <div className="pay-grid">
                {t.pays.map((pm, idx) => {
                  const active = (s.pay ?? t.pays[0]) === pm
                  const Ic = payIcons[idx] ?? CreditCard
                  return (
                    <button key={pm} className={'pay-card' + (active ? ' on' : '')} onClick={() => set((x) => ({ ...x, pay: pm }))}>
                      <span className="pc-ic"><Ic size={17} /></span>
                      <b>{pm}</b>
                      {active && <span className="pc-chk"><Check size={12} strokeWidth={3} /></span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 7. Прозрачная детализация суммы и выгоды */}
            <div className="summary-card">
              <div className="sum-row">
                <span>{t.products} ({selQty})</span>
                <b>{fmt(rawOldSum)} ₸</b>
              </div>
              {itemSavings > 0 && (
                <div className="sum-row green">
                  <span>{ext.cartSavings}</span>
                  <b>−{fmt(itemSavings)} ₸</b>
                </div>
              )}
              {promoCut > 0 && (
                <div className="sum-row green">
                  <span>{ext.promoDiscount} ({promoApplied})</span>
                  <b>−{fmt(promoCut)} ₸</b>
                </div>
              )}
              <div className="sum-row">
                <span>{t.delivery}</span>
                <b className="green-txt">{shipNeed === 0 ? '0 ₸' : '0 ₸'}</b>
              </div>
              <div className="sum-divider" />
              <div className="sum-total">
                <span>{t.toPay}</span>
                <b>{fmt(finalSum)} ₸</b>
              </div>
            </div>

            {/* 8. С этим часто берут */}
            {crossSell.length > 0 && (
              <>
                <SectionHead title={ext.cartAlsoBuy} />
                <HScroll items={crossSell} />
              </>
            )}

            <div style={{ height: 18 }} />
          </div>

          {/* Липкий футер оформления заказа */}
          <div className="cart-checkout-bar">
            <div className="ccb-info">
              <b>{fmt(finalSum)} ₸</b>
              <small>
                {selQty} {t.pcs}
                {totalSavings > 0 && <span className="ccb-save"> · −{fmt(totalSavings)} ₸</span>}
              </small>
            </div>
            <button className={'btn' + (sel.length ? '' : ' dis')} onClick={order}>
              {t.placeOrder}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function OrderOk({ id }: { id: string }) {
  const { t, push, tab } = useApp()
  const [x] = useState(id)
  return (
    <div className="screen ok-screen">
      <div className="ok-ic"><PartyPopper size={38} /></div>
      <h1>{t.orderOk}</h1>
      <p className="muted">{t.orderOkSub(x)}</p>
      <button className="btn" onClick={() => { tab('profile'); push('orders') }}>{t.toOrders}</button>
      <button className="ghost" onClick={() => tab('home')}>{t.continueShop}</button>
    </div>
  )
}
