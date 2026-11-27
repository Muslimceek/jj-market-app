import { useEffect, useRef, useState } from 'react'
import {
  Bell, User as UserIc, ChevronLeft, MapPin, Pencil, Trash2, Plus, Package, Star,
  Megaphone, Send, Sparkles, ChevronDown, MessageCircle, Check, LogOut, Phone, Mail,
  ChevronRight, Percent, Heart, Globe, Settings as SettingsIc, FileText, Shield,
  HelpCircle, LogIn, UserPlus, Truck, Copy, QrCode, Store, MessageCircleMore,
} from 'lucide-react'
import { useApp, tx, type Address, type User } from './store'
import { TopBar, Row, Empty, Seg, Sheet, LangSheet, Grid } from './ui'
import { AddressSheet } from './Home'
import { COUNTRIES, countryByCode } from './geo'
import { LANGS } from './i18n'

/* ---------- ПРОФИЛЬ С НУЛЯ: Apple iOS-группы + виджеты + рабочие кнопки даже для гостей ---------- */
export function Profile() {
  const { s, set, t, push, tab, sheet, toast } = useApp()
  const ext = t.ext
  const u = s.user
  const curLangLabel = LANGS.find((l) => l.code === s.lang)?.label ?? 'Русский'

  const head = (
    <div className="prof-header">
      <h1>{t.profile}</h1>
      <div className="ph-acts">
        <button className="jj-lang-btn" onClick={() => sheet(<LangSheet />)}>
          <Globe size={13} />
          <span>{LANGS.find((l) => l.code === s.lang)?.short}</span>
        </button>
        <button className="jj-notif-btn" onClick={() => push('news')} aria-label={t.news}>
          <Bell size={18} strokeWidth={1.9} />
          <i className="notif-dot" />
        </button>
      </div>
    </div>
  )

  const M = t.menu

  return (
    <div className="screen home-screen">
      {head}
      <div className="scroll prof-scroll">
        {!u ? (
          /* Гостевая Apple-карточка входа и регистрации */
          <div className="prof-hero-guest">
            <div className="phg-top">
              <span className="phg-logo"><img src="/brand/JJ_symbol_white.svg" alt="JJ" /></span>
              <div>
                <h2>{ext.profWelcome}</h2>
                <p>{t.guestS}</p>
              </div>
            </div>
            <div className="phg-perks">
              {ext.profBenefits.map((b) => (
                <span key={b}><Check size={12} strokeWidth={3} />{b}</span>
              ))}
            </div>
            <div className="phg-btns">
              <button className="phg-btn primary" onClick={() => push('login', { mode: 'login' })}>
                <LogIn size={16} />{t.signIn}
              </button>
              <button className="phg-btn secondary" onClick={() => push('login', { mode: 'reg' })}>
                <UserPlus size={16} />{ext.profCreateAcc}
              </button>
            </div>
          </div>
        ) : (
          /* Карточка авторизованного пользователя + 3 живых виджета */
          <div className="prof-user-box">
            <button className="prof-user-card" onClick={() => push('editProfile')}>
              <span className="prof-av">
                {(u.first?.[0] || 'J').toUpperCase()}{(u.last?.[0] || '').toUpperCase()}
              </span>
              <div className="puc-txt">
                <b>{u.first} {u.last}</b>
                <small>{u.phone || u.email}</small>
              </div>
              <span className="puc-edit"><Pencil size={14} /></span>
            </button>

            <div className="prof-stats-row">
              <button className="ps-tile" onClick={() => push('orders')}>
                <b>{s.orders.length}</b>
                <small>{ext.profStatsOrders}</small>
              </button>
              <button className="ps-tile" onClick={() => tab('favs')}>
                <b>{s.favs.length}</b>
                <small>{ext.profStatsFavs}</small>
              </button>
              <button className="ps-tile" onClick={() => sheet(<AddressSheet />)}>
                <b>{s.addresses.length}</b>
                <small>{ext.profStatsAddrs}</small>
              </button>
            </div>
          </div>
        )}

        {/* 2×2 Быстрые виджеты — все кнопки работают для всех пользователей */}
        <div className="prof-widgets">
          <button className="pw-card" onClick={() => tab('favs')}>
            <span className="pw-ic rose"><Heart size={18} /></span>
            <b>{M.favs}</b>
            <small>{s.favs.length} {t.pcs}</small>
          </button>
          <button className="pw-card" onClick={() => sheet(<AddressSheet />)}>
            <span className="pw-ic violet"><MapPin size={18} /></span>
            <b>{M.addresses}</b>
            <small>{s.addresses.length > 0 ? `${s.addresses.length}` : t.addAddress}</small>
          </button>
          <button className="pw-card" onClick={() => push('campaigns')}>
            <span className="pw-ic amber"><Percent size={18} /></span>
            <b>{M.campaigns}</b>
            <small>−60% SALE</small>
          </button>
          <button className="pw-card" onClick={() => push('ai')}>
            <span className="pw-ic dark"><Sparkles size={18} /></span>
            <b>{M.ai}</b>
            <small>24/7</small>
          </button>
        </div>

        {/* iOS Inset Grouped List 1: Покупки и помощь */}
        <div className="ios-sec-lbl">{ext.profSectionShop}</div>
        <div className="ios-group">
          {u && (
            <>
              <button className="ios-row" onClick={() => push('orders')}>
                <span className="ir-l"><i className="ir-ic violet"><Package size={16} /></i>{M.orders}</span>
                <span className="ir-r">{s.orders.length > 0 && <em>{s.orders.length}</em>}<ChevronRight size={16} className="ios-chev" /></span>
              </button>
              <button className="ios-row" onClick={() => push('reviews')}>
                <span className="ir-l"><i className="ir-ic amber"><Star size={16} /></i>{M.reviews}</span>
                <ChevronRight size={16} className="ios-chev" />
              </button>
            </>
          )}
          <button className="ios-row" onClick={() => push('sellerChats')}>
            <span className="ir-l"><i className="ir-ic violet"><MessageCircle size={16} /></i>{ext.sellerChats}</span>
            <span className="ir-r">{Object.keys(s.chats || {}).length > 0 && <em>{Object.keys(s.chats || {}).length}</em>}<ChevronRight size={16} className="ios-chev" /></span>
          </button>
          <button className="ios-row" onClick={() => push('news')}>
            <span className="ir-l"><i className="ir-ic rose"><Bell size={16} /></i>{M.news}</span>
            <ChevronRight size={16} className="ios-chev" />
          </button>
          <button className="ios-row" onClick={() => push('country')}>
            <span className="ir-l"><i className="ir-ic green"><Globe size={16} /></i>{M.country}</span>
            <span className="ir-r"><small>UZ · KZ · RU · KG</small><ChevronRight size={16} className="ios-chev" /></span>
          </button>
          <button className="ios-row" onClick={() => push('support')}>
            <span className="ir-l"><i className="ir-ic slate"><HelpCircle size={16} /></i>{M.support}</span>
            <ChevronRight size={16} className="ios-chev" />
          </button>
        </div>

        {/* iOS Inset Grouped List 2: Приложение и документы */}
        <div className="ios-sec-lbl">{ext.profSectionApp}</div>
        <div className="ios-group">
          <button className="ios-row" onClick={() => sheet(<LangSheet />)}>
            <span className="ir-l"><i className="ir-ic violet"><Globe size={16} /></i>{M.lang}</span>
            <span className="ir-r"><small>{curLangLabel}</small><ChevronRight size={16} className="ios-chev" /></span>
          </button>
          <button className="ios-row" onClick={() => push('settings')}>
            <span className="ir-l"><i className="ir-ic slate"><SettingsIc size={16} /></i>{M.settings}</span>
            <ChevronRight size={16} className="ios-chev" />
          </button>
          <button className="ios-row" onClick={() => push('doc', 'offer')}>
            <span className="ir-l"><i className="ir-ic dark"><FileText size={16} /></i>{M.offer}</span>
            <ChevronRight size={16} className="ios-chev" />
          </button>
          <button className="ios-row" onClick={() => push('doc', 'privacy')}>
            <span className="ir-l"><i className="ir-ic green"><Shield size={16} /></i>{s.lang === 'tr' ? 'Gizlilik Politikası' : s.lang === 'kk' ? 'Құпиялық саясаты' : 'Политика конфиденциальности'}</span>
            <ChevronRight size={16} className="ios-chev" />
          </button>
        </div>

        {u && (
          <button
            className="prof-logout-btn"
            onClick={() => { set((x) => ({ ...x, user: null })); toast(t.logoutQ) }}
          >
            <LogOut size={17} />{M.logout}
          </button>
        )}

        <div className="version">{t.version}</div>
      </div>
    </div>
  )
}

export function EditProfile() {
  const { s, set, t, pop, toast, sheet } = useApp()
  const [u, setU] = useState<User>(s.user!)
  const field = (k: keyof User, label: string, type = 'text') => (
    <label className="ed-field"><span>{label}</span><input type={type} value={u[k]} onChange={(e) => setU({ ...u, [k]: e.target.value })} placeholder="—" /></label>
  )
  return (
    <div className="screen">
      <TopBar title={t.editProfile} />
      <div className="scroll">
        <div className="ed-top"><span className="avatar big"><UserIc size={30} /></span><span><b>{u.first} {u.last}</b><small>{u.email || u.phone}</small></span></div>
        {field('first', t.firstName)}
        {field('last', t.lastName)}
        <button className="ed-field sel" onClick={() => sheet(<Sheet title={t.gender}>{t.genders.map((g) => <button key={g} className={'opt' + (u.gender === g ? ' on' : '')} onClick={() => { setU((x) => ({ ...x, gender: g })); sheet(null) }}>{g}{u.gender === g && <Check size={18} />}</button>)}</Sheet>)}>
          <span>{t.gender}</span><b>{u.gender || '—'}</b><ChevronRight size={17} />
        </button>
        {field('birth', t.birth, 'date')}
        {field('phone', t.phone, 'tel')}
        {field('email', t.email, 'email')}
        <Row label={t.changePass} onClick={() => toast(t.sent)} />
        <button className="danger-btn" onClick={() => { set((x) => ({ ...x, user: null })); pop() }}>{t.deleteAcc}</button>
      </div>
      <div className="foot-cta"><button className="btn" onClick={() => { set((x) => ({ ...x, user: u })); toast(t.saved); pop() }}>{t.save}</button></div>
    </div>
  )
}

export function Addresses() {
  const { s, set, t, sheet } = useApp()
  return (
    <div className="screen home-screen">
      <TopBar title={t.addresses} right={<span className="muted small">{s.addresses.length} {t.address}</span>} />
      <div className="scroll">
        {s.addresses.length === 0 && <Empty icon={<MapPin size={26} />} title={t.noAddress} />}
        {s.addresses.map((a) => (
          <div className="addr-card" key={a.id}>
            <div className="ac-h"><MapPin size={18} color="#6d28d9" /><b>{a.title}</b><span className="tag">{a.country}</span></div>
            <div className="ac-b">{a.street}<br /><span className="muted">{a.city}, {a.country}</span><br /><span className="muted">{a.home === 'house' ? t.house : t.flat}</span><br /><span className="muted">{a.name}</span><br /><span className="muted">{a.phone}</span></div>
            <div className="ac-acts">
              <button onClick={() => sheet(<AddressSheet />)}><Pencil size={15} />{t.edit}</button>
              <button className="red" onClick={() => set((x) => ({ ...x, addresses: x.addresses.filter((y) => y.id !== a.id), addressId: x.addressId === a.id ? null : x.addressId }))}><Trash2 size={15} />{t.del}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="foot-cta"><button className="btn" onClick={() => sheet(<AddressSheet />)}><Plus size={18} />{t.addAddress}</button></div>
    </div>
  )
}

export function AddressForm({ id }: { id?: string }) {
  const { s, set, t, pop } = useApp()
  const ex = s.addresses.find((a) => a.id === id)
  const [a, setA] = useState<Address>(ex ?? { id: String(Date.now()), title: '', type: 'individual', country: 'Казахстан', city: '', street: '', home: 'flat', name: s.user ? `${s.user.first} ${s.user.last}`.trim() : '', phone: s.user?.phone || '' })
  const ok = a.title.trim() && a.city.trim() && a.street.trim() && a.name.trim() && a.phone.replace(/\D/g, '').length >= 10
  const f = (k: keyof Address, label: string, ph = '') => (
    <label className="ed-field"><span>{label}</span><input value={a[k] as string} placeholder={ph} onChange={(e) => setA({ ...a, [k]: e.target.value })} /></label>
  )
  return (
    <div className="screen">
      <TopBar title={ex ? t.edit : t.newAddress} />
      <div className="scroll">
        <div className="muted small" style={{ margin: '4px 0 6px' }}>{t.addrType}</div>
        <Seg items={[t.individual, t.corporate]} value={a.type === 'individual' ? 0 : 1} onChange={(i) => setA({ ...a, type: i ? 'corporate' : 'individual' })} />
        {f('title', t.addrTitle, t.addrTitlePh)}
        {f('country', t.country)}
        {f('city', t.city, 'Алматы')}
        {f('street', t.street, 'пр. Абая, 10')}
        <div className="muted small" style={{ margin: '12px 0 6px' }}>{t.homeType}</div>
        <Seg items={[t.flat, t.house]} value={a.home === 'flat' ? 0 : 1} onChange={(i) => setA({ ...a, home: i ? 'house' : 'flat' })} />
        {f('name', t.fullName)}
        {f('phone', t.phone, '+7 700 000 00 00')}
      </div>
      <div className="foot-cta"><button className={'btn' + (ok ? '' : ' dis')} onClick={() => {
        if (!ok) return
        set((x) => ({ ...x, addresses: ex ? x.addresses.map((y) => (y.id === a.id ? a : y)) : [...x.addresses, a], addressId: x.addressId ?? a.id }))
        pop()
      }}>{t.save}</button></div>
    </div>
  )
}

const dfmt = (iso: string, lang: string) => new Date(iso).toLocaleString(lang === 'tr' ? 'tr-TR' : lang === 'kk' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function Orders() {
  const { s, t, push, lang, cat, money } = useApp()
  return (
    <div className="screen home-screen">
      <TopBar title={t.ordersT} />
      <div className="scroll">
        {s.orders.length === 0 && <Empty icon={<Package size={26} />} title={t.noOrders} />}
        {s.orders.map((o) => (
          <button className="order-card" key={o.id} onClick={() => push('order', { id: o.id })}>
            <div className="oc-h"><b>{t.order} №{o.id}</b><span className={'st s' + o.status}>{t.statuses[o.status]}</span></div>
            <div className="muted small">{dfmt(o.date, lang)}</div>
            <div className="oc-imgs">{o.lines.map((l, i) => { const p = cat.products.find((x) => x.id === l.productId); return p ? <img key={i} src={'/' + p.images[0]} loading="lazy" alt="" /> : null })}</div>
            <div className="oc-sum">{money(o.total)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Детерминированный SVG QR-код для ПВЗ JJ (визуальное ТЗ для разработчиков) */
function PickupQr({ seed }: { seed: string }) {
  const cells: [number, number][] = []
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const isFinder = (r: number, c: number) =>
    (r < 5 && c < 5) || (r < 5 && c > 11) || (r > 11 && c < 5)
  for (let r = 0; r < 17; r++) {
    for (let c = 0; c < 17; c++) {
      if (isFinder(r, c)) continue
      h = Math.imul(h ^ (r * 31 + c * 17), 16777619)
      if ((h >>> 0) % 10 < 5) cells.push([c, r])
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={5} height={5} rx={0.9} fill="#222226" />
      <rect x={x + 1} y={y + 1} width={3} height={3} rx={0.4} fill="#fff" />
      <rect x={x + 1.7} y={y + 1.7} width={1.6} height={1.6} rx={0.3} fill="#AE33FF" />
    </g>
  )
  return (
    <svg viewBox="0 0 17 17" className="qr-svg" aria-hidden>
      {finder(0, 0)}
      {finder(12, 0)}
      {finder(0, 12)}
      {cells.map(([c, r], idx) => (
        <rect key={idx} x={c + 0.1} y={r + 0.1} width={0.82} height={0.82} rx={0.22} fill="#222226" />
      ))}
    </svg>
  )
}

export function OrderDetail({ id }: { id: string }) {
  const { s, set, t, lang, cat, push, toast, money } = useApp()
  const ext = t.ext
  const o = s.orders.find((x) => x.id === id)
  if (!o) return null
  const pickupCode = `${o.id.slice(0, 3)}-${o.id.slice(-3)}`
  const cancelled = o.status === 3
  const trackPct = cancelled ? 0 : o.status === 0 ? 28 : o.status === 1 ? 66 : 100

  const copyPickup = () => {
    navigator.clipboard?.writeText(pickupCode)
    toast(<span className="toast-row"><Check size={15} color="#16a34a" />{ext.qrCopied}: {pickupCode}</span>)
  }

  return (
    <div className="screen home-screen">
      <TopBar title={`${t.order} №${o.id}`} />
      <div className="scroll od-scroll">
        {/* Живой анимированный трекер маршрута доставки */}
        <div className="od-track-card">
          <div className="od-tc-top">
            <div>
              <span className={'od-status s' + o.status}>{t.statuses[o.status]}</span>
              <small>{dfmt(o.date, lang)}</small>
            </div>
            <span className="od-tc-ic"><Truck size={18} /></span>
          </div>

          {!cancelled && (
            <div className="od-live-route">
              <div className="od-lr-line"><i style={{ width: `${trackPct}%` }} /></div>
              <div className="od-lr-steps">
                {ext.onbOrderSteps.map((lbl, i) => {
                  const done = i < o.status || o.status === 2
                  const now = i === o.status && o.status < 2
                  return (
                    <span key={lbl} className={done ? 'done' : now ? 'now' : ''}>
                      <i>{done ? <Check size={10} strokeWidth={3} /> : null}</i>
                      {lbl}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="od-addr-row">
            <MapPin size={15} color="#AE33FF" />
            <span>{o.address}</span>
          </div>
        </div>

        {/* Интерактивный QR-код для получения в ПВЗ JJ (с лазерной анимацией) */}
        {!cancelled && (
          <div className="od-qr-card">
            <div className="od-qr-head">
              <QrCode size={16} color="#AE33FF" />
              <div>
                <b>{ext.qrTitle}</b>
                <small>{ext.qrSub}</small>
              </div>
            </div>
            <div className="od-qr-box">
              <div className="od-qr-frame">
                <PickupQr seed={o.id} />
                <span className="od-qr-laser" />
              </div>
              <div className="od-qr-code-info">
                <small>{ext.qrCodeLbl}</small>
                <strong>{pickupCode}</strong>
                <button type="button" className="od-copy-btn" onClick={copyPickup}>
                  <Copy size={13} />
                  <span>{pickupCode}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Прямой чат с продавцом заказа (доступно сразу после покупки!) */}
        {(() => {
          const sellerMap = new Map<string, string>()
          o.lines.forEach((l) => {
            const p = cat.products.find((x) => x.id === l.productId)
            if (p) {
              const name = p.seller || p.brand || 'JJ Market'
              if (!sellerMap.has(name)) sellerMap.set(name, p.id)
            }
          })
          const sellers = [...sellerMap.entries()]
          if (!sellers.length) return null
          return (
            <div className="od-sellers-wrap">
              {sellers.map(([sellerName, prodId]) => (
                <div className="od-seller-card" key={sellerName}>
                  <button type="button" className="od-sc-l" onClick={() => push('sellerStore', { seller: sellerName })}>
                    <span className="od-sc-av">
                      <Store size={17} />
                      <i />
                    </span>
                    <div className="od-sc-txt">
                      <b>{sellerName}</b>
                      <small>{ext.sellerOnline}</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="od-sc-chat"
                    onClick={() => push('sellerChat', { seller: sellerName, productId: prodId, orderId: o.id })}
                  >
                    <MessageCircleMore size={15} />
                    <span>{ext.writeSeller}</span>
                  </button>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Товары заказа */}
        <div className="chk-card">
          {o.lines.map((l, i) => {
            const p = cat.products.find((x) => x.id === l.productId)
            if (!p) return null
            const sName = p.seller || p.brand || 'JJ Market'
            return (
              <div className="od-line" key={i} onClick={() => push('product', { id: p.id })}>
                <img src={'/' + p.images[0]} loading="lazy" alt="" />
                <div><b>{money(l.price)}</b><span>{tx(p.name, lang)}</span><small>{l.label}</small></div>
                <div className="od-line-r">
                  <span className="od-q">{l.qty} {t.pcs}</span>
                  <button
                    type="button"
                    className="od-item-chat"
                    aria-label={ext.writeSeller}
                    onClick={(e) => {
                      e.stopPropagation()
                      push('sellerChat', { seller: sName, productId: p.id, orderId: o.id })
                    }}
                  >
                    <MessageCircleMore size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="summary-card">
          <div className="sum-row"><span>{t.orderSum}</span><b>{money(o.total)}</b></div>
          <div className="sum-row"><span>{t.delivery}</span><b className="green-txt">{money(0)}</b></div>
          <div className="sum-row"><span>{t.payMethod}</span><b>{o.pay}</b></div>
          <div className="sum-divider" />
          <div className="sum-total"><span>{t.toPay}</span><b>{money(o.total)}</b></div>
        </div>

        <div className="ios-group" style={{ marginTop: 10 }}>
          <Row label={t.writeSupport} onClick={() => push('support')} />
          {o.status === 0 && (
            <Row
              danger
              label={t.cancelOrder}
              onClick={() => {
                set((x) => ({ ...x, orders: x.orders.map((y) => (y.id === o.id ? { ...y, status: 3 } : y)) }))
                toast(t.cancelled)
              }}
            />
          )}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

export function Simple({ title, icon, text }: { title: string; icon: React.ReactNode; text: string }) {
  return <div className="screen"><TopBar title={title} /><Empty icon={icon} title={text} /></div>
}

export function Campaigns() {
  const { t, cat, push } = useApp()
  const sale = cat.products.filter((p) => p.old > 0 || p.pct > 0)
  return (
    <div className="screen home-screen">
      <TopBar title={t.campaigns} />
      <div className="scroll">
        {cat.sliders.map((b) => <img key={b.id} className="camp-img" src={'/' + b.image} alt="" />)}
        <button className="camp-card" onClick={() => push('list', { kind: 'sale', title: t.discount })}><Percent size={22} /><span><b>{t.discount}</b><small>{sale.length} {t.items}</small></span><ChevronRight size={18} /></button>
        <Grid items={sale.slice(0, 8)} />
      </div>
    </div>
  )
}

export function News() {
  const { t, s } = useApp()
  const items = s.orders.slice(0, 5)
  return (
    <div className="screen home-screen">
      <TopBar title={t.news} />
      {items.length ? (
        <div className="scroll">{items.map((o) => <div className="news-item" key={o.id}><span><Megaphone size={18} /></span><div><b>{t.order} №{o.id}</b><small>{t.statuses[o.status]}</small></div></div>)}</div>
      ) : <Empty icon={<Bell size={26} />} title={t.noNews} />}
    </div>
  )
}

export function Assistant() {
  const { t, cat, lang, push, money } = useApp()
  const [msgs, setMsgs] = useState<{ me?: boolean; text: string; ids?: string[] }[]>([{ text: t.aiHello }])
  const [q, setQ] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  const send = () => {
    const v = q.trim(); if (!v) return
    const words = v.toLocaleLowerCase('tr').split(/\s+/).filter((w) => w.length > 2)
    const hits = cat.products.map((p) => ({ p, s: words.filter((w) => Object.values(p.name).join(' ').toLocaleLowerCase('tr').includes(w) || p.categories.some((c) => Object.values(c.name).join(' ').toLocaleLowerCase('tr').includes(w))).length })).filter((x) => x.s).sort((a, b) => b.s - a.s).slice(0, 4)
    setMsgs((m) => [...m, { me: true, text: v }, hits.length ? { text: t.aiAnswer, ids: hits.map((h) => h.p.id) } : { text: t.noProducts + '. ' + t.noProductsSub }])
    setQ('')
  }
  return (
    <div className="screen">
      <TopBar title={<span className="opt-l"><Sparkles size={18} color="#AE33FF" />{t.ai}</span>} />
      <div className="scroll chat">
        {msgs.map((m, i) => (
          <div key={i} className={'bubble' + (m.me ? ' me' : '')}>
            {m.text}
            {m.ids && <div className="chat-prods">{m.ids.map((id) => { const p = cat.products.find((x) => x.id === id)!; return <button key={id} onClick={() => push('product', { id })}><img src={'/' + p.images[0]} alt="" /><span>{tx(p.name, lang)}</span><b>{money(p.price)}</b></button> })}</div>}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="chat-in"><input placeholder={t.aiPh} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} /><button onClick={send} aria-label="Send"><Send size={18} /></button></div>
    </div>
  )
}

/* ---------- 4 страны и валюты JJ Market (Узбекистан, Казахстан, Россия, Кыргызстан) ---------- */
export function Country() {
  const { s, set, t, lang, toast } = useApp()
  const active = countryByCode(s.country)
  return (
    <div className="screen home-screen">
      <TopBar title={t.countryT} />
      <div className="scroll">
        <div className="ios-sec-lbl">{t.ext.profCountriesTitle}</div>
        <div className="ios-group">
          {COUNTRIES.map((co) => {
            const on = active.code === co.code
            return (
              <button
                key={co.code}
                className="ios-row"
                onClick={() => {
                  set((x) => ({ ...x, country: co.code, pay: co.payments[0]?.title ?? x.pay }))
                  toast(`${co.flag} ${t.ext.currencyChanged(co.name[lang], co.symbol)}`)
                }}
              >
                <span className="ir-l">
                  <span style={{ fontSize: 21 }}>{co.flag}</span>
                  <span>
                    <b>{co.name[lang]}</b>
                    <small style={{ display: 'block', fontSize: 12, color: '#968fa8' }}>
                      {co.currency} · {co.dial}
                    </small>
                  </span>
                </span>
                {on && <Check size={18} color="#AE33FF" strokeWidth={2.6} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Support() {
  const { t, push } = useApp()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="screen home-screen">
      <TopBar title={t.support} />
      <div className="scroll">
        <h3 className="pd-h" style={{ marginTop: 6 }}>{t.faq}</h3>
        {t.faqs.map(([q, a], i) => (
          <div className="faq" key={i}>
            <button onClick={() => setOpen(open === i ? null : i)}>{q}<ChevronDown size={17} style={{ transform: open === i ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} /></button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
        <div className="sup-card">
          <b>{t.supportAlways}</b><p>{t.supportText}</p>
          <button className="btn" onClick={() => push('ai')}><MessageCircle size={17} />{t.chat}</button>
        </div>
        <div className="sup-contacts">
          <a href="tel:+905397837224"><Phone size={16} />+90 539 783 72 24</a>
          <a href="mailto:support@jjmarket.kz"><Mail size={16} />support@jjmarket.kz</a>
        </div>
      </div>
    </div>
  )
}

export function Settings() {
  const { t, s, set } = useApp()
  const tg = (k: keyof typeof s.notif) => set((x) => ({ ...x, notif: { ...x.notif, [k]: !x.notif[k] } }))
  return (
    <div className="screen home-screen">
      <TopBar title={t.settings} />
      <div className="scroll">
        <div className="ios-group" style={{ marginTop: 8 }}>
          {([['push', t.notifPush], ['mail', t.notifMail], ['sms', t.notifSms]] as const).map(([k, l]) => (
            <div className="ios-row" key={k} onClick={() => tg(k)}>
              <span>{l}</span>
              <button className={'switch' + (s.notif[k] ? ' on' : '')}><i /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Обновлённая Публичная оферта и Политика конфиденциальности (структурированный Apple-документ) ---------- */
export function Doc({ kind }: { kind: string }) {
  const { t, lang } = useApp()
  const isPrivacy = kind === 'privacy'
  const sections = isPrivacy
    ? (lang === 'tr' ? [
        ['1. Veri toplama', 'JJ Market yalnızca siparişlerin teslimatı ve müşteri desteği için ad, telefon numarası, e-posta ve teslimat adresini işler.'],
        ['2. Güvenlik', 'Kişisel veriler şifreli kanallar üzerinden aktarılır ve üçüncü taraflarla yalnızca teslimat ve ödeme ortaklarıyla paylaşılır.'],
        ['3. Kullanıcı hakları', 'Hesap ayarlarından verilerinizi güncelleyebilir veya silinmesini talep edebilirsiniz.'],
      ] : [
        ['1. Сбор и обработка данных', 'JJ Market обрабатывает только данные, необходимые для оформления и доставки заказов: имя, номер телефона, e-mail и адрес доставки.'],
        ['2. Защита информации', 'Все данные передаются по защищённому соединению и не передаются третьим лицам, за исключением служб доставки и платёжных провайдеров.'],
        ['3. Права пользователя', 'Вы в любой момент можете изменить данные профиля или запросить удаление аккаунта через раздел «Настройки» или службу поддержки.'],
      ])
    : (lang === 'tr' ? [
        ['1. Genel hükümler', 'Bu kamu ofertası, JJ Market platformu üzerinden sunulan ürünlerin satın alınması ve teslimatına ilişkin kuralları belirler.'],
        ['2. Hizmet bölgesi', 'Platform şu anda 4 ülkede hizmet vermektedir: Özbekistan, Kazakistan, Rusya ve Kırgızistan.'],
        ['3. Ödeme ve iade', 'Ödeme banka kartı, Apple Pay ve Google Pay ile yapılabilir. Ürün iadesi teslimattan sonraki 14 gün içinde geçerlidir.'],
      ] : [
        ['1. Общие положения', 'Настоящая публичная оферта определяет условия покупки товаров на маркетплейсе JJ Market (ТОО «АСХАТ-ЖЖ»). Оформляя заказ, покупатель принимает условия оферты.'],
        ['2. География доставки', 'Доставка и пункты выдачи JJ Market работают в 4 странах: Узбекистан, Казахстан, Россия и Кыргызстан.'],
        ['3. Оплата, обмен и возврат', 'Оплата доступна любой банковской картой, а также через Apple Pay и Google Pay. Возврат и обмен товара надлежащего качества возможен в течение 14 дней с момента получения.'],
        ['4. Служба заботы о клиентах', 'По любым вопросам обращайтесь в чат поддержки приложения или по адресу support@jjmarket.kz.'],
      ])

  return (
    <div className="screen home-screen">
      <TopBar title={isPrivacy ? t.consent[1] : t.offer} />
      <div className="scroll">
        <div className="doc-hero">
          <span className="dh-ic">{isPrivacy ? <Shield size={20} /> : <FileText size={20} />}</span>
          <div>
            <b>JJ Market · ТОО «АСХАТ-ЖЖ»</b>
            <small>{isPrivacy ? t.consent[1] : t.offer}</small>
          </div>
        </div>
        <div className="doc-cards">
          {sections.map(([h, body]) => (
            <div className="doc-card" key={h}>
              <h3>{h}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Reviews() {
  const { s, t, cat, lang, push } = useApp()
  const entries = Object.entries(s.userReviews).flatMap(([pid, list]) => {
    const prod = cat.products.find((p) => p.id === pid)
    return list.map((r) => ({ r, prod }))
  })
  return (
    <div className="screen home-screen">
      <TopBar title={t.myReviews} />
      <div className="scroll">
        {entries.length === 0 ? (
          <Empty icon={<Star size={26} />} title={t.noReviews} />
        ) : (
          <div className="rev-list" style={{ marginTop: 8 }}>
            {entries.map(({ r, prod }) => (
              <div className="rev-card" key={r.id} onClick={() => prod && push('product', { id: prod.id })}>
                <div className="rev-head">
                  <b>{prod ? tx(prod.name, lang) : r.author}</b>
                  <span className="rev-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={12} fill={n <= r.rating ? '#F59E0B' : 'none'} color={n <= r.rating ? '#F59E0B' : '#D1D5DB'} />
                    ))}
                  </span>
                </div>
                <p>{r.text}</p>
                <small>{r.date}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export { ChevronLeft }
