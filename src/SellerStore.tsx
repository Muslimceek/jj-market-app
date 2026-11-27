import { useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, BadgeCheck, Star, MessageCircleMore, Users, Check,
  Sparkles, Flame, Search, X, Share2, LayoutGrid, BadgePercent,
  PlayCircle, ArrowUpDown, Clock, UserPlus, UserCheck, ShieldCheck,
} from 'lucide-react'
import { useApp, tx } from './store'
import { Grid } from './ui'

/* ---------- ПРЕМИАЛЬНАЯ ВИТРИНА МАГАЗИНА ПРОДАВЦА (Motion UI + поиск + хиты + сортировка) ---------- */
export function SellerStore({ seller }: { seller: string }) {
  const { cat, s, set, t, lang, pop, push, toast, money } = useApp()
  const ext = t.ext
  const [tab, setTab] = useState<'all' | 'sale' | 'top' | 'video'>('all')
  const [sort, setSort] = useState<'pop' | 'cheap' | 'exp'>('pop')
  const [query, setQuery] = useState('')
  const [popFollow, setPopFollow] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const following = s.followedSellers.includes(seller)
  const storeProducts = useMemo(() => {
    const exact = cat.products.filter(
      (p) => (p.seller || '').toLowerCase() === seller.toLowerCase() || (p.brand || '').toLowerCase() === seller.toLowerCase(),
    )
    return exact.length > 0 ? exact : cat.products.slice(0, 12)
  }, [cat.products, seller])

  const saleCount = useMemo(() => storeProducts.filter((p) => p.pct > 0).length, [storeProducts])
  const videoCount = useMemo(() => storeProducts.filter((p) => p.hasVideo).length, [storeProducts])
  const featuredHits = useMemo(
    () => [...storeProducts].sort((a, b) => (b.pct - a.pct) || ((b.rating || 4.8) - (a.rating || 4.8))).slice(0, 6),
    [storeProducts],
  )

  const shown = useMemo(() => {
    let list = storeProducts
    if (tab === 'sale') list = list.filter((p) => p.pct > 0)
    else if (tab === 'top') list = [...list].sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8))
    else if (tab === 'video') list = list.filter((p) => p.hasVideo)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) => tx(p.name, lang).toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q),
      )
    }

    if (sort === 'cheap') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'exp') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [storeProducts, tab, query, sort, lang])

  const initials = useMemo(() => {
    const parts = seller.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return seller.slice(0, 2).toUpperCase() || 'JJ'
  }, [seller])

  const baseFollowers = useMemo(() => {
    let h = 0
    for (let i = 0; i < seller.length; i++) h = (h * 31 + seller.charCodeAt(i)) % 4200
    return 840 + h
  }, [seller])
  const followers = baseFollowers + (following ? 1 : 0)

  const toggleFollow = () => {
    setPopFollow(true)
    window.setTimeout(() => setPopFollow(false), 400)
    set((x) => ({
      ...x,
      followedSellers: following
        ? x.followedSellers.filter((n) => n !== seller)
        : [...x.followedSellers, seller],
    }))
    toast(
      <span className="toast-row">
        <Check size={15} color="#16a34a" strokeWidth={3} />
        {following ? seller : `${ext.storeFollowing} · ${seller}`}
      </span>,
    )
  }

  const shareStore = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/#/seller/${encodeURIComponent(seller)}`)
    toast(<span className="toast-row"><Check size={15} color="#16a34a" />{t.share}</span>)
  }

  const cycleSort = () => {
    setSort((cur) => (cur === 'pop' ? 'cheap' : cur === 'cheap' ? 'exp' : 'pop'))
  }

  const sortLabel = sort === 'pop'
    ? (lang === 'tr' ? 'Popüler' : 'Популярные')
    : sort === 'cheap'
      ? (lang === 'tr' ? 'Önce ucuz' : 'Дешевле')
      : (lang === 'tr' ? 'Önce pahalı' : 'Дороже')

  return (
    <div className="screen home-screen ss-v2-screen">
      {/* Плавная липкая шапка при прокрутке */}
      <div className={'ss-sticky-bar' + (scrolled ? ' show' : '')}>
        <button type="button" className="ss-st-back" onClick={pop} aria-label={t.back}>
          <ChevronLeft size={21} />
        </button>
        <div className="ss-st-mid">
          <b>{seller}</b>
          <small>{storeProducts.length} {t.items}</small>
        </div>
        <button
          type="button"
          className={'ss-st-follow' + (following ? ' on' : '')}
          onClick={toggleFollow}
        >
          {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
          <span>{following ? ext.storeFollowing : ext.storeFollow}</span>
        </button>
      </div>

      <div
        className="scroll ss-v2-scroll"
        ref={scrollRef}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 140)}
      >
        {/* 1. Фирменная брендовая моушн-обложка */}
        <div className="ss-cover">
          <div className="jja-orb a" />
          <div className="jja-orb b" />
          <div className="ss-cover-grid" />
          <div className="ss-cover-shine" />

          <div className="ss-cover-bar">
            <button type="button" className="jja-back" onClick={pop} aria-label={t.back}>
              <ChevronLeft size={20} />
            </button>
            <span className="ss-official-v2">
              <ShieldCheck size={13} />
              <span>{ext.storeOfficial}</span>
            </span>
            <div className="ss-cover-acts">
              <button type="button" className="ss-glass-ic" onClick={shareStore} aria-label="Share">
                <Share2 size={16} />
              </button>
              <button
                type="button"
                className="ss-glass-ic"
                onClick={() => push('sellerChat', { seller, productId: storeProducts[0]?.id })}
                aria-label={ext.writeSeller}
              >
                <MessageCircleMore size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Приподнятая белая карточка магазина с метриками и кнопками */}
        <div className="ss-body-pad">
          <div className="ss-id-card">
            <div className="ss-id-head">
              <div className="ss-emblem-v2">
                <span>{initials}</span>
                <em className="ss-online-pulse" />
              </div>
              <div className="ss-id-txt">
                <div className="ss-id-name">
                  <h1>{seller}</h1>
                  <BadgeCheck size={18} fill="#AE33FF" color="#fff" />
                </div>
                <small className="ss-id-status">
                  <i />{ext.sellerOnline}
                </small>
              </div>
            </div>

            {/* 3 визуальные метрики с красивыми иконками */}
            <div className="ss-metrics">
              <div className="ss-m-tile">
                <span className="ss-m-ic amber"><Star size={14} fill="#F59E0B" color="#F59E0B" /></span>
                <b>4.9</b>
                <small>{lang === 'tr' ? 'Puan' : 'Рейтинг'}</small>
              </div>
              <div className="ss-m-tile">
                <span className="ss-m-ic violet"><Users size={14} /></span>
                <b key={followers} className="price-morph">{followers.toLocaleString('ru-RU')}</b>
                <small>{ext.storeFollowers}</small>
              </div>
              <div className="ss-m-tile">
                <span className="ss-m-ic green"><Clock size={14} /></span>
                <b>~5 мин</b>
                <small>{lang === 'tr' ? 'Yanıt' : 'Ответ в чате'}</small>
              </div>
            </div>

            {/* Две удобные 44px кнопки действий */}
            <div className="ss-cta-row">
              <button
                type="button"
                className={'ss-btn-follow' + (following ? ' on' : '') + (popFollow ? ' burst' : '')}
                onClick={toggleFollow}
              >
                {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                <span>{following ? ext.storeFollowing : ext.storeFollow}</span>
              </button>
              <button
                type="button"
                className="ss-btn-chat"
                onClick={() => push('sellerChat', { seller, productId: storeProducts[0]?.id })}
              >
                <MessageCircleMore size={16} />
                <span>{ext.writeSeller}</span>
              </button>
            </div>
          </div>

          {/* 3. Поиск внутри магазина */}
          <div className="ss-search-box">
            <Search size={16} className="ss-s-ic" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'tr' ? `${seller} içinde ara…` : `Поиск в магазине ${seller}…`}
            />
            {query && (
              <button type="button" className="ss-s-clr" onClick={() => setQuery('')} aria-label="Clear">
                <X size={14} />
              </button>
            )}
          </div>

          {/* 4. Горизонтальная карусель «Хиты магазина» (показывается, когда поиск пуст) */}
          {!query && featuredHits.length > 2 && (
            <div className="ss-hits-sec">
              <div className="ss-sec-head">
                <b><Sparkles size={14} color="#AE33FF" />{lang === 'tr' ? 'Mağazanın favorileri' : 'Хиты магазина'}</b>
                <small>{storeProducts.length} {t.items}</small>
              </div>
              <div className="ss-hits-strip">
                {featuredHits.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className="ss-hit-card"
                    style={{ animationDelay: `${idx * 45}ms` }}
                    onClick={() => push('product', { id: p.id })}
                  >
                    <div className="ssh-media">
                      {p.images[0] && <img src={'/' + p.images[0]} loading="lazy" decoding="async" alt="" />}
                      {p.pct > 0 && <em>−{p.pct}%</em>}
                    </div>
                    <div className="ssh-info">
                      <b>{money(p.price)}</b>
                      <span>{tx(p.name, lang)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Красивые фильтры с иконками + быстрая сортировка */}
          <div className="ss-controls-row">
            <div className="ss-tabs-v2">
              <button type="button" className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
                <LayoutGrid size={13} />
                <span>{t.homeUI.allCatsTile}</span>
                <em>{storeProducts.length}</em>
              </button>
              {saleCount > 0 && (
                <button type="button" className={tab === 'sale' ? 'on' : ''} onClick={() => setTab('sale')}>
                  <BadgePercent size={13} />
                  <span>{t.discount}</span>
                  <em>{saleCount}</em>
                </button>
              )}
              <button type="button" className={tab === 'top' ? 'on' : ''} onClick={() => setTab('top')}>
                <Flame size={13} />
                <span>{t.homeUI.feedPop}</span>
              </button>
              {videoCount > 0 && (
                <button type="button" className={tab === 'video' ? 'on' : ''} onClick={() => setTab('video')}>
                  <PlayCircle size={13} />
                  <span>{t.video}</span>
                </button>
              )}
            </div>
          </div>

          <div className="ss-list-meta">
            <span>{ext.storeItemsCount(shown.length)}</span>
            <button type="button" className="ss-sort-pill" onClick={cycleSort}>
              <ArrowUpDown size={12} />
              <span>{sortLabel}</span>
            </button>
          </div>

          <div className="ss-grid-anim" key={`${tab}-${sort}-${query ? 'q' : 'all'}`}>
            <Grid items={shown} />
          </div>
          <div style={{ height: 28 }} />
        </div>
      </div>
    </div>
  )
}
