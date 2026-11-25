import { useEffect, useRef, useState } from 'react'
import {
  Bell, User as UserIc, ChevronLeft, MapPin, Pencil, Trash2, Plus, Package, Star,
  Megaphone, Send, Sparkles, ChevronDown, MessageCircle, Check, LogOut, Phone, Mail,
  ChevronRight, Percent, Heart, Globe, Settings as SettingsIc, FileText, Shield,
  HelpCircle, LogIn, UserPlus,
} from 'lucide-react'
import { useApp, tx, fmt, type Address, type User } from './store'
import { TopBar, Row, Empty, Seg, Sheet, LangSheet, Grid } from './ui'
import { AddressSheet } from './Home'
import { COUNTRIES } from './geo'
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
  const { s, t, push, lang, cat } = useApp()
  return (
    <div className="screen home-screen">
      <TopBar title={t.ordersT} />
      <div className="scroll">
        {s.orders.length === 0 && <Empty icon={<Package size={26} />} title={t.noOrders} />}
        {s.orders.map((o) => (
          <button className="order-card" key={o.id} onClick={() => push('order', { id: o.id })}>
            <div className="oc-h"><b>{t.order} №{o.id}</b><span className={'st s' + o.status}>{t.statuses[o.status]}</span></div>
            <div className="muted small">{dfmt(o.date, lang)}</div>
            <div className="oc-imgs">{o.lines.map((l, i) => { const p = cat.products.find((x) => x.id === l.productId); return p ? <img key={i} src={'/' + p.images[0]} alt="" /> : null })}</div>
            <div className="oc-sum">{fmt(o.total)} ₸</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrderDetail({ id }: { id: string }) {
  const { s, set, t, lang, cat, push, toast } = useApp()
  const o = s.orders.find((x) => x.id === id)
  if (!o) return null
  return (
    <div className="screen">
      <TopBar title={`${t.order} №${o.id}`} />
      <div className="scroll">
        <div className={'od-status s' + o.status}>{t.statuses[o.status]}</div>
        <div className="od-bars">{[0, 1, 2].map((i) => <i key={i} className={o.status !== 3 && i <= o.status ? 'on' : ''} />)}</div>
        <div className="muted small">{dfmt(o.date, lang)}</div>
        <div className="od-addr">{o.address}</div>
        {o.lines.map((l, i) => {
          const p = cat.products.find((x) => x.id === l.productId)
          if (!p) return null
          return (
            <div className="od-line" key={i} onClick={() => push('product', { id: p.id })}>
              <img src={'/' + p.images[0]} alt="" />
              <div><b>{fmt(l.price)} ₸</b><span>{tx(p.name, lang)}</span><small>{l.label}</small></div>
              <span className="od-q">{l.qty} {t.pcs} × {fmt(l.price)} ₸</span>
            </div>
          )
        })}
        <div className="totals">
          <div><span>{t.orderSum}</span><span>{fmt(o.total)} ₸</span></div>
          <div><span>{t.delivery}</span><span>0 ₸</span></div>
          <div><span>{t.payMethod}</span><span>{o.pay}</span></div>
          <div className="big"><span>{t.toPay}</span><span>{fmt(o.total)} ₸</span></div>
        </div>
        <Row label={t.writeSupport} onClick={() => push('support')} />
        {o.status === 0 && <Row label={t.cancelOrder} onClick={() => { set((x) => ({ ...x, orders: x.orders.map((y) => (y.id === o.id ? { ...y, status: 3 } : y)) })); toast(t.cancelled) }} />}
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
  const { t, cat, lang, push } = useApp()
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
            {m.ids && <div className="chat-prods">{m.ids.map((id) => { const p = cat.products.find((x) => x.id === id)!; return <button key={id} onClick={() => push('product', { id })}><img src={'/' + p.images[0]} alt="" /><span>{tx(p.name, lang)}</span><b>{fmt(p.price)} ₸</b></button> })}</div>}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="chat-in"><input placeholder={t.aiPh} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} /><button onClick={send} aria-label="Send"><Send size={18} /></button></div>
    </div>
  )
}

/* ---------- 4 страны JJ Market (Узбекистан, Казахстан, Россия, Кыргызстан) ---------- */
export function Country() {
  const { t, lang, toast } = useApp()
  const [sel, setSel] = useState<'UZ' | 'KZ' | 'RU' | 'KG'>('KZ')
  return (
    <div className="screen home-screen">
      <TopBar title={t.countryT} />
      <div className="scroll">
        <div className="ios-sec-lbl">{t.ext.profCountriesTitle}</div>
        <div className="ios-group">
          {COUNTRIES.map((co) => {
            const on = sel === co.code
            return (
              <button
                key={co.code}
                className="ios-row"
                onClick={() => { setSel(co.code); toast(`${co.flag} ${co.name[lang]}`) }}
              >
                <span className="ir-l">
                  <span style={{ fontSize: 20 }}>{co.flag}</span>
                  <span>
                    <b>{co.name[lang]}</b>
                    <small style={{ display: 'block', fontSize: 12, color: '#968fa8' }}>{co.currency} · {co.dial}</small>
                  </span>
                </span>
                {on && <Check size={18} color="#AE33FF" />}
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
        ['3. Ödeme ve iade', 'Ödeme Kaspi Pay, banka kartı, Apple Pay ve Google Pay ile yapılabilir. Ürün iadesi teslimattan sonraki 14 gün içinde geçerlidir.'],
      ] : [
        ['1. Общие положения', 'Настоящая публичная оферта определяет условия покупки товаров на маркетплейсе JJ Market (ТОО «АСХАТ-ЖЖ»). Оформляя заказ, покупатель принимает условия оферты.'],
        ['2. География доставки', 'Доставка и пункты выдачи JJ Market работают в 4 странах: Узбекистан, Казахстан, Россия и Кыргызстан.'],
        ['3. Оплата, обмен и возврат', 'Оплата доступна через Kaspi Pay, банковскую карту, Apple Pay и Google Pay. Возврат и обмен товара надлежащего качества возможен в течение 14 дней с момента получения.'],
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

export const Reviews = () => { const { t } = useApp(); return <Simple title={t.myReviews} icon={<Star size={26} />} text={t.noReviews} /> }
export { ChevronLeft }
