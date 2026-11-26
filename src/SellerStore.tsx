import { useMemo, useState } from 'react'
import {
  ChevronLeft, Store, ShieldCheck, Star, MessageCircle, Users, Check,
  Sparkles, Package, Flame,
} from 'lucide-react'
import { useApp } from './store'
import { Grid } from './ui'

/* ---------- Витрина магазина продавца (вдохновлено Trendyol / Ozon) ---------- */
export function SellerStore({ seller }: { seller: string }) {
  const { cat, s, set, t, pop, push, toast } = useApp()
  const ext = t.ext
  const [tab, setTab] = useState<'all' | 'sale' | 'top'>('all')
  const [popFollow, setPopFollow] = useState(false)

  const following = s.followedSellers.includes(seller)
  const storeProducts = useMemo(() => {
    const exact = cat.products.filter(
      (p) => (p.seller || '').toLowerCase() === seller.toLowerCase() || (p.brand || '').toLowerCase() === seller.toLowerCase(),
    )
    return exact.length > 0 ? exact : cat.products.slice(0, 12)
  }, [cat.products, seller])

  const shown = useMemo(() => {
    if (tab === 'sale') return storeProducts.filter((p) => p.pct > 0)
    if (tab === 'top') return [...storeProducts].sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8))
    return storeProducts
  }, [storeProducts, tab])

  // Детерминированное число подписчиков на базе имени магазина + статус подписки
  const baseFollowers = useMemo(() => {
    let h = 0
    for (let i = 0; i < seller.length; i++) h = (h * 31 + seller.charCodeAt(i)) % 4200
    return 840 + h
  }, [seller])
  const followers = baseFollowers + (following ? 1 : 0)

  const toggleFollow = () => {
    setPopFollow(true)
    window.setTimeout(() => setPopFollow(false), 380)
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

  return (
    <div className="screen home-screen">
      {/* Фирменная брендовая шапка магазина */}
      <div className="ss-hero">
        <div className="jja-orb a" />
        <div className="jja-orb b" />
        <div className="ss-top">
          <button type="button" className="jja-back" onClick={pop} aria-label={t.back}>
            <ChevronLeft size={20} />
          </button>
          <span className="ss-official"><ShieldCheck size={12} />{ext.storeOfficial}</span>
          <button
            type="button"
            className="ss-chat-ic"
            onClick={() => push('sellerChat', { seller, productId: storeProducts[0]?.id })}
            aria-label={ext.writeSeller}
          >
            <MessageCircle size={17} />
          </button>
        </div>

        <div className="ss-card">
          <div className="jjo-card-shine" />
          <div className="ss-id-row">
            <span className="ss-av">
              <Store size={22} />
              <i />
            </span>
            <div className="ss-meta">
              <h1>{seller}</h1>
              <div className="ss-stats">
                <span><Star size={12} fill="#FBBF24" color="#FBBF24" /><b>4.9</b></span>
                <em>·</em>
                <span><Users size={12} /><b>{followers.toLocaleString('ru-RU')}</b> {ext.storeFollowers}</span>
              </div>
            </div>
          </div>

          <div className="ss-btns">
            <button
              type="button"
              className={'ss-follow-btn' + (following ? ' on' : '') + (popFollow ? ' burst' : '')}
              onClick={toggleFollow}
            >
              {following ? <Check size={15} strokeWidth={2.8} /> : <Sparkles size={14} />}
              <span>{following ? ext.storeFollowing : ext.storeFollow}</span>
            </button>
            <button
              type="button"
              className="ss-msg-btn"
              onClick={() => push('sellerChat', { seller, productId: storeProducts[0]?.id })}
            >
              <MessageCircle size={15} />
              <span>{ext.writeSeller}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Вкладки и витрина товаров */}
      <div className="scroll ss-scroll">
        <div className="ss-filter-bar">
          <div className="ss-tabs">
            <button type="button" className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
              <Package size={13} />{t.homeUI.allCatsTile} ({storeProducts.length})
            </button>
            <button type="button" className={tab === 'sale' ? 'on' : ''} onClick={() => setTab('sale')}>
              <Flame size={13} />{t.discount}
            </button>
            <button type="button" className={tab === 'top' ? 'on' : ''} onClick={() => setTab('top')}>
              <Star size={13} />{t.homeUI.feedPop}
            </button>
          </div>
        </div>

        <div className="ss-count">{ext.storeItemsCount(shown.length)}</div>
        <Grid items={shown} />
        <div style={{ height: 26 }} />
      </div>
    </div>
  )
}
