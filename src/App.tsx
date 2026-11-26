import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Home as HomeIc, LayoutGrid, Heart, ShoppingCart, User as UserIc, Wifi, Signal, BatteryFull } from 'lucide-react'
import { AppCtx, loadState, STORE_KEY, dict, fmtMoney, type Catalog, type Ctx, type Route, type State } from './store'
import { Splash, Onboarding, Login } from './Auth'
import { Home, SearchScreen } from './Home'
import { Categories, SubCats, ProductList, Filters } from './Catalog'
import { Favorites } from './Favorites'
import { ProductPage } from './ProductPage'
import { SellerChat, SellerChats } from './SellerChat'
import { SellerStore } from './SellerStore'
import { Cart, Checkout, OrderOk } from './Cart'
import { Profile, EditProfile, Addresses, AddressForm, Orders, OrderDetail, Reviews, Campaigns, News, Assistant, Country, Support, Settings, Doc } from './Profile'

function render(r: Route): ReactNode {
  const p = r.p ?? {}
  switch (r.name) {
    case 'home': return <Home />
    case 'cats': return <Categories />
    case 'favs': return <Favorites />
    case 'cart': return <Cart />
    case 'checkout': return <Checkout promo={p.promo} />
    case 'profile': return <Profile />
    case 'search': return <SearchScreen />
    case 'subcats': return <SubCats id={p.id} />
    case 'list': return <ProductList kind={p.kind} id={p.id} title={p.title} f0={p.f0} />
    case 'filters': return <Filters f={p.f} onApply={p.onApply} from={p.from} />
    case 'product': return <ProductPage id={p.id} key={p.id} />
    case 'sellerChat': return <SellerChat seller={p.seller} productId={p.productId} key={p.seller + (p.productId || '')} />
    case 'sellerChats': return <SellerChats />
    case 'sellerStore': return <SellerStore seller={p.seller} key={p.seller} />
    case 'orderOk': return <OrderOk id={p.id} />
    case 'editProfile': return <EditProfile />
    case 'addresses': return <Addresses />
    case 'addressForm': return <AddressForm id={p.id} />
    case 'orders': return <Orders />
    case 'order': return <OrderDetail id={p.id} />
    case 'reviews': return <Reviews />
    case 'campaigns': return <Campaigns />
    case 'news': return <News />
    case 'ai': return <Assistant />
    case 'country': return <Country />
    case 'support': return <Support />
    case 'settings': return <Settings />
    case 'doc': return <Doc kind={r.p} />
    default: return <Home />
  }
}

function hashFor(tab: string, stack: Route[]): string {
  const top = stack[stack.length - 1]
  if (!top) return `#/${tab}`
  if (top.name === 'product' && top.p?.id) return `#/product/${top.p.id}`
  if (top.name === 'sellerStore' && top.p?.seller) return `#/seller/${encodeURIComponent(top.p.seller)}`
  if (top.name === 'order' && top.p?.id) return `#/order/${top.p.id}`
  if (top.name === 'checkout') return '#/checkout'
  return `#/${top.name}`
}

function parseInitialHash(): { tab: string; stack: Route[] } | null {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (!h) return null
  const [seg, arg] = h.split('/')
  if (['home', 'cats', 'favs', 'cart', 'profile'].includes(seg)) return { tab: seg, stack: [] }
  if (seg === 'product' && arg) return { tab: 'home', stack: [{ name: 'product', p: { id: arg } }] }
  if (seg === 'seller' && arg) return { tab: 'home', stack: [{ name: 'sellerStore', p: { seller: decodeURIComponent(arg) } }] }
  if (seg === 'order' && arg) return { tab: 'profile', stack: [{ name: 'order', p: { id: arg } }] }
  if (seg === 'checkout') return { tab: 'cart', stack: [{ name: 'checkout' }] }
  return null
}

function Clock() {
  const [d, setD] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setD(new Date()), 20000); return () => clearInterval(i) }, [])
  return <>{d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</>
}

export default function App() {
  const [cat, setCat] = useState<Catalog | null>(null)
  const [s, setS] = useState<State>(loadState)
  const [splash, setSplash] = useState(true)
  const initNav = useRef(parseInitialHash())
  const [tab, setTab] = useState(() => initNav.current?.tab ?? 'home')
  const [stack, setStack] = useState<Route[]>(() => initNav.current?.stack ?? [])
  const [sheet, setSheet] = useState<ReactNode | null>(null)
  const [toastNode, setToast] = useState<ReactNode | null>(null)
  const [loginBar, setLoginBar] = useState<string | null>(null)
  const toastTimer = useRef<number>()
  const skipHashSync = useRef(false)

  useEffect(() => { fetch('/data/catalog.json').then((r) => r.json()).then(setCat) }, [])
  useEffect(() => { const x = setTimeout(() => setSplash(false), 1400); return () => clearTimeout(x) }, [])
  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(s)) }, [s])
  useEffect(() => { document.documentElement.lang = s.lang }, [s.lang])

  // Deep-link: если открыли прямую ссылку на товар (#/product/...), пропускаем онбординг прямо к товару
  useEffect(() => {
    if (initNav.current?.stack.length) {
      setS((x) => (x.onboarded && x.authSeen ? x : { ...x, onboarded: true, authSeen: true }))
    }
  }, [])

  // Синхронизация URL hash и системной кнопки «Назад»
  useEffect(() => {
    if (skipHashSync.current) { skipHashSync.current = false; return }
    const nextHash = hashFor(tab, stack)
    if (window.location.hash !== nextHash) {
      try { window.history.pushState(null, '', nextHash) } catch {}
    }
  }, [tab, stack])

  useEffect(() => {
    const onHash = () => {
      const parsed = parseInitialHash()
      if (!parsed) return
      skipHashSync.current = true
      setSheet(null)
      setTab(parsed.tab)
      setStack(parsed.stack)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const t = dict(s.lang)
  const top = stack[stack.length - 1]
  const showLogin = top?.name === 'login'

  const ctx: Ctx = {
    cat: cat!, s, set: (fn) => setS((x) => fn(x)), t, lang: s.lang,
    push: (name, p) => { setSheet(null); setLoginBar(null); setStack((st) => [...st, { name, p }]) },
    pop: () => setStack((st) => st.slice(0, -1)),
    tab: (k) => { setStack([]); setSheet(null); setTab(k) },
    curTab: tab,
    sheet: setSheet,
    toast: (m) => { window.clearTimeout(toastTimer.current); setToast(m); toastTimer.current = window.setTimeout(() => setToast(null), 2200) },
    requireLogin: (msg) => { if (s.user) return true; setLoginBar(msg ?? t.loginToAdd); return false },
    addToCart: (productId, lines) => setS((x) => {
      const cart = [...x.cart]
      for (const l of lines) {
        const key = productId + '|' + (l.variantId ?? '')
        const i = cart.findIndex((c) => c.key === key)
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + l.qty }
        else cart.push({ key, productId, variantId: l.variantId, label: l.label, qty: l.qty, selected: true })
      }
      return { ...x, cart }
    }),
    money: (kzt) => fmtMoney(kzt, s.country),
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (sheet) setSheet(null); else setStack((st) => st.slice(0, -1)) } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })

  const [authStartView, setAuthStartView] = useState<'login' | 'reg'>('login')
  const login = (u: State['user']) => { setS((x) => ({ ...x, user: u, onboarded: true, authSeen: true })); setStack((st) => st.filter((r) => r.name !== 'login')); setLoginBar(null); ctx.toast(t.loggedIn) }

  const cartCount = s.cart.reduce((a, c) => a + c.qty, 0)
  const favCount = s.favs.length
  const TABS = [
    { k: 'home', l: t.tabs.home, ic: HomeIc },
    { k: 'cats', l: t.tabs.cats, ic: LayoutGrid },
    { k: 'favs', l: t.tabs.favs, ic: Heart },
    { k: 'cart', l: t.tabs.cart, ic: ShoppingCart },
    { k: 'profile', l: t.tabs.profile, ic: UserIc },
  ]

  const isAuthStage = !splash && !!cat && (!s.onboarded || (!s.user && !s.authSeen) || showLogin)
  const isPurpleBar = isAuthStage || top?.name === 'sellerStore'

  let body: ReactNode
  if (splash || !cat) body = <Splash />
  else if (!s.onboarded) {
    body = (
      <Onboarding
        onDone={() => { setAuthStartView('login'); setS((x) => ({ ...x, onboarded: true, authSeen: false })) }}
        onRegister={() => { setAuthStartView('reg'); setS((x) => ({ ...x, onboarded: true, authSeen: false })) }}
        onSkip={() => setS((x) => ({ ...x, onboarded: true, authSeen: true }))}
      />
    )
  }
  else if (!s.user && !s.authSeen) {
    body = (
      <Login
        initialView={authStartView}
        onDone={login}
        onGuide={() => setS((x) => ({ ...x, onboarded: false }))}
        canSkip={() => setS((x) => ({ ...x, authSeen: true }))}
      />
    )
  }
  else if (showLogin) {
    body = (
      <Login
        initialView={top?.p?.mode === 'reg' ? 'reg' : 'login'}
        onDone={login}
        onGuide={() => { setStack((st) => st.filter((r) => r.name !== 'login')); setS((x) => ({ ...x, onboarded: false })) }}
        canSkip={() => setStack((st) => st.filter((r) => r.name !== 'login'))}
      />
    )
  }
  else if (top) body = <div className="screen enter" key={stack.length + top.name}>{render(top)}</div>
  else body = (
    <>
      <div className="screen" key={tab}>{render({ name: tab })}</div>
      {loginBar && <button className="login-bar" onClick={() => { setLoginBar(null); ctx.push('login') }}>{loginBar}</button>}
      <nav className="tabbar">
        {TABS.map(({ k, l, ic: Ic }) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setLoginBar(null); setTab(k) }}>
            <span className="tb-ic">
              <Ic size={22} strokeWidth={tab === k ? 2.2 : 1.7} fill={tab === k && (k === 'home' || k === 'favs' || k === 'cats') ? 'currentColor' : 'none'} />
              {k === 'cart' && cartCount > 0 && <em key={cartCount} className="badge-pop">{cartCount}</em>}
              {k === 'favs' && favCount > 0 && <i className="fav-dot" />}
            </span>
            <span className="tb-lbl">{l}</span>
          </button>
        ))}
      </nav>
    </>
  )

  return (
    <AppCtx.Provider value={ctx}>
      <div className="device">
        <div className="phone">
          <div className={'statusbar' + (isPurpleBar ? ' hero-bar' : '')}><Clock /><span className="island" /><span className="icons"><Signal size={14} /><Wifi size={14} /><BatteryFull size={20} /></span></div>
          {body}
          {top && !showLogin && loginBar && <button className="login-bar float" onClick={() => { setLoginBar(null); ctx.push('login') }}>{loginBar}</button>}
          <div className="homebar"><i /></div>
          {sheet}
          {toastNode && <div className="toast">{toastNode}</div>}
        </div>
      </div>
    </AppCtx.Provider>
  )
}
