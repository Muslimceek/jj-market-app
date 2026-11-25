import { useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, Share, Star, Ruler, Sparkles, Flag, Leaf, Minus, Plus,
  CircleCheck, ShoppingBag, Store, Check, X, ShieldCheck, ZoomIn,
} from 'lucide-react'
import { useApp, tx, fmt, code, colorAxis, sizeAxis, hexOf, type Product } from './store'
import { FavBtn, Grid, Sheet, Seg } from './ui'
import { emptyF } from './Catalog'
import { SIZE_ROWS } from './sizes'

/* ---------- СТРАНИЦА ТОВАРА С НУЛЯ: WB/Trendyol скорость + Apple-чистота + фирменный #AE33FF ---------- */
export function ProductPage({ id }: { id: string }) {
  const { cat, t, lang, pop, push, toast, sheet, addToCart } = useApp()
  const p = cat.products.find((x) => x.id === id)!
  const cAx = colorAxis(p)
  const sAx = sizeAxis(p)
  const [color, setColor] = useState(cAx?.values[0]?.id)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [scrolled, setScrolled] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [infoTab, setInfoTab] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const vars = p.variants.filter((v) => !color || v.values.includes(color))
  const sizeOf = (vId: string) => sAx?.values.find((x) => p.variants.find((v) => v.id === vId)?.values.includes(x.id))
  const stockTotal = p.variants.reduce((a, v) => a + (v.stock || 0), 0) || p.stock
  const picked = Object.entries(qty).filter(([, n]) => n > 0)
  const pickedQty = picked.reduce((a, [, n]) => a + n, 0)
  const noSizes = !sAx || sAx.values.length <= 1
  const sum = noSizes
    ? p.price * Math.max(1, pickedQty || 1)
    : picked.reduce((a, [vid, n]) => a + (p.variants.find((v) => v.id === vid)?.price || p.price) * n, 0) || p.price
  const pickedLabel = picked.map(([vid, n]) => `${tx(sizeOf(vid)?.name, lang)} ×${n}`).join(', ')
  const colorName = tx(cAx?.values.find((v) => v.id === color)?.name, lang)

  const similar = useMemo(() => {
    const ids = new Set(p.categories.map((c) => c.id))
    return cat.products.filter((x) => x.id !== p.id && x.categories.some((c) => ids.has(c.id))).slice(0, 8)
  }, [p, cat])

  const fit = p.fit === 'slim' ? [t.fitSlim, t.fitSlimT]
    : p.fit === 'loose' || p.fit === 'wide' || p.fit === 'oversize' ? [t.fitWide, t.fitWideT]
    : [t.fitNormal, t.fitNormalT]

  const catName = tx(p.categories[0]?.name, lang)
  const desc = tx(p.desc, lang)
  const imgs = p.images.length ? p.images : ['']

  // Быстрые ключевые характеристики (видны сразу без прокрутки!)
  const quickHighlights = useMemo(() => p.features.slice(0, 3), [p.features])

  const jumpImg = (k: number) => {
    setImgIdx(k)
    const el = trackRef.current
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' })
  }

  const toggleSize = (vid: string, stock: number) => {
    if (stock <= 0) return
    setQty((q) => (q[vid] ? Object.fromEntries(Object.entries(q).filter(([k]) => k !== vid)) : { ...q, [vid]: 1 }))
  }

  const openBrand = () => {
    const b = cat.filters.brands.find((x) => x.name === p.brand)
    if (b) push('list', { kind: 'all', title: b.name, f0: { ...emptyF(cat), brands: [b.id] } })
  }

  const add = () => {
    if (stockTotal <= 0) return
    if (!noSizes && !picked.length) { toast(t.chooseSize); return }
    const lines = noSizes
      ? [{ variantId: (vars.find((v) => v.stock > 0) ?? vars[0])?.id, label: colorName, qty: Math.max(1, pickedQty || 1) }]
      : picked.map(([vid, n]) => ({ variantId: vid, label: [colorName, tx(sizeOf(vid)?.name, lang)].filter(Boolean).join(' · '), qty: n }))
    addToCart(p.id, lines)
    toast(
      <span className="added">
        <img src={'/' + p.images[0]} alt="" />
        <span><small>{t.added}</small>{tx(p.name, lang)}</span>
        <CircleCheck size={22} color="#16a34a" fill="#e9f9ef" />
      </span>,
    )
  }

  const infoTabs = [t.features, t.description, `${t.comments} (${p.reviews})`]

  return (
    <div className="screen home-screen pd">
      {/* Плавающая стеклянная шапка */}
      <div className={'pd-top' + (scrolled ? ' solid' : '')}>
        <button className="round" onClick={pop} aria-label={t.back}><ChevronLeft size={21} /></button>
        <span className="pd-top-t">{scrolled ? tx(p.name, lang) : ''}</span>
        <button className="round" onClick={() => { navigator.clipboard?.writeText(`https://jjmarket.kz/product/${p.slug}`); toast(t.share) }} aria-label="Share">
          <Share size={17} />
        </button>
        <span className="round"><FavBtn id={p.id} big /></span>
      </div>

      <div className="scroll pd-v2-scroll" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 260)}>
        {/* 1. Чёткая полноширинная галерея (как у WB/Apple) + миниатюры снизу */}
        <div className="pd-hero-media">
          <div
            className="pd-hero-track"
            ref={trackRef}
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.clientWidth > 0) setImgIdx(Math.round(el.scrollLeft / el.clientWidth))
            }}
          >
            {imgs.map((src, k) => (
              <div className="pd-hero-slide" key={k} onClick={() => setZoomOpen(true)}>
                {src && <img src={'/' + src} alt="" />}
              </div>
            ))}
          </div>

          {p.pct > 0 && <span className="pd-hero-pct">−{p.pct}%</span>}
          <button className="pd-hero-zoom" onClick={() => setZoomOpen(true)} aria-label="Zoom">
            <ZoomIn size={13} />
            <span>{imgIdx + 1} / {imgs.length}</span>
          </button>
        </div>

        {/* Полоса миниатюр для мгновенного переключения фото */}
        {imgs.length > 1 && (
          <div className="pd-thumbs">
            {imgs.map((src, k) => (
              <button key={k} className={'pd-thumb' + (k === imgIdx ? ' on' : '')} onClick={() => jumpImg(k)}>
                <img src={'/' + src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        {/* 2. Главная карточка товара: цена, бренд, название, быстрые характеристики */}
        <div className="pd-card">
          <div className="pd-price-v2">
            <div className="pd-pv-left">
              <b className={p.pct > 0 ? 'sale' : ''}>{fmt(p.price)} ₸</b>
              {p.old > 0 && <s>{fmt(p.old)} ₸</s>}
            </div>
            <span className={'stock' + (stockTotal > 0 ? '' : ' out')}>
              <i />{stockTotal > 0 ? `${t.inStock} · ${stockTotal} ${t.pcs}` : t.outStock}
            </span>
          </div>

          <div className="pd-brand-bar">
            <button className="pd-brand-chip" onClick={openBrand}>
              <b>{p.brand || p.seller}</b>
              {catName && <span>· {catName}</span>}
            </button>
            <button className="pd-rat-pill" onClick={() => setInfoTab(2)}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <b>{p.rating > 0 ? p.rating.toFixed(1) : '4.9'}</b>
              <span>({p.reviews})</span>
            </button>
          </div>

          <h1 className="pd-title-v2">{tx(p.name, lang)}</h1>

          {/* Ключевые характеристики сразу под названием — не нужно листать вниз! */}
          {quickHighlights.length > 0 && (
            <div className="pd-quick-specs">
              {quickHighlights.map((f, i) => (
                <div className="pqs-pill" key={i}>
                  <small>{tx(f.name, lang)}</small>
                  <b>{tx(f.value, lang)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Карточка выбора цвета и размеров (мультивыбор + AI-подбор в одну строку) */}
        {(cAx || (sAx && !noSizes)) && (
          <div className="pd-card">
            {cAx && (
              <div className="pd-color-v2">
                <div className="pd-sec-row">
                  <span className="pd-sec-lbl">{t.color}: <b>{colorName}</b></span>
                  {cAx.values.length === 1 && <small className="muted">{t.oneColor}</small>}
                </div>
                <div className="pd-sw-list">
                  {cAx.values.map((v) => (
                    <button key={v.id} className={'sw-btn' + (v.id === color ? ' on' : '')} onClick={() => { setColor(v.id); setQty({}) }} title={tx(v.name, lang)}>
                      <i style={{ background: hexOf(v.slug) }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sAx && !noSizes && (
              <div className="pd-sizes-v2">
                <div className="pd-sec-row">
                  <span className="pd-sec-lbl"><b>{tx(sAx.name, lang)}</b></span>
                  <div className="pd-sz-tools">
                    <button className="pd-tool-btn" onClick={() => sheet(<SizeTableSheet p={p} />)}>
                      <Ruler size={13} />{t.sizeTable}
                    </button>
                    <button
                      className="pd-tool-btn ai"
                      onClick={() => sheet(<AiSizeSheet p={p} onPick={(label) => {
                        const v = vars.find((x) => tx(sizeOf(x.id)?.name, lang) === label && x.stock > 0)
                        if (v) setQty((q) => ({ ...q, [v.id]: q[v.id] || 1 }))
                      }} />)}
                    >
                      <Sparkles size={13} />AI
                    </button>
                  </div>
                </div>

                {/* Ровная 4-колоночная сетка размеров */}
                <div className="pd-sz-grid">
                  {vars.map((v) => {
                    const sz = sizeOf(v.id)
                    const countSel = qty[v.id] || 0
                    const on = countSel > 0
                    return (
                      <button
                        key={v.id}
                        disabled={v.stock <= 0}
                        className={'pd-sz-tile' + (on ? ' on' : '') + (v.stock <= 0 ? ' out' : '')}
                        onClick={() => toggleSize(v.id, v.stock)}
                      >
                        <b>{tx(sz?.name, lang)}</b>
                        <small>{v.stock > 0 ? `${v.stock} ${t.pcs}` : '0'}</small>
                        {on && <em>×{countSel}</em>}
                      </button>
                    )
                  })}
                </div>

                {/* Аккуратная полоса выбранных размеров с удобным +/- для каждого */}
                {picked.length > 0 && (
                  <div className="pd-picked-list">
                    {picked.map(([vid, n]) => {
                      const v = vars.find((x) => x.id === vid)
                      const sz = sizeOf(vid)
                      return (
                        <div className="pd-picked-row" key={vid}>
                          <span><Check size={13} color="#AE33FF" strokeWidth={3} />{tx(sz?.name, lang)}</span>
                          <div className="pd-p-step">
                            <button onClick={() => setQty((q) => {
                              const next = (q[vid] || 0) - 1
                              if (next <= 0) return Object.fromEntries(Object.entries(q).filter(([k]) => k !== vid))
                              return { ...q, [vid]: next }
                            })}><Minus size={13} /></button>
                            <b>{n}</b>
                            <button onClick={() => setQty((q) => ({ ...q, [vid]: Math.min(v?.stock || 99, (q[vid] || 0) + 1) }))}><Plus size={13} /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="pd-fit-strip">
                  <ShieldCheck size={14} color="#AE33FF" />
                  <span><b>{fit[0]}</b> · {fit[1]}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Компактные вкладки: Характеристики | Описание | Отзывы — быстрый выбор без прокрутки! */}
        <div className="pd-card">
          <Seg items={infoTabs} value={infoTab} onChange={setInfoTab} />

          {infoTab === 0 && (
            <div className="pd-tab-body">
              {p.badges.length > 0 && (
                <div className="pd-badges-row">
                  {p.badges.map((b) => (
                    <span key={b.slug} className="pd-b-chip" style={{ color: b.color || '#AE33FF' }}>
                      {b.slug.includes('organic') ? <Leaf size={12} /> : <Flag size={12} fill="currentColor" />}
                      {tx(b.name, lang)}
                    </span>
                  ))}
                </div>
              )}
              <div className="pd-spec-list">
                <div className="ps-row"><span>Артикул</span><b>{code(p) || p.id.slice(0, 8)}</b></div>
                <div className="ps-row"><span>{t.brand}</span><b>{p.brand || p.seller}</b></div>
                {p.features.map((f, i) => (
                  <div className="ps-row" key={i}>
                    <span>{tx(f.name, lang)}</span>
                    <b>{tx(f.value, lang)}</b>
                  </div>
                ))}
                <div className="ps-row"><span>{t.seller}</span><b>{p.seller}</b></div>
              </div>
            </div>
          )}

          {infoTab === 1 && (
            <div className="pd-tab-body">
              <p className="pd-desc-full">{desc || tx(p.name, lang)}</p>
            </div>
          )}

          {infoTab === 2 && (
            <div className="pd-tab-body">
              <div className="pd-rev-box">
                <div className="prb-score">
                  <b>{p.rating > 0 ? p.rating.toFixed(1) : '4.9'}</b>
                  <div className="prb-stars">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <small>{p.reviews} {t.ratings}</small>
                </div>
                <div className="prb-seller">
                  <Store size={16} color="#AE33FF" />
                  <div>
                    <small>{t.seller}</small>
                    <b>{p.seller}</b>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Похожие товары */}
        {similar.length > 0 && (
          <div className="pd-sim-wrap">
            <h3 className="pd-h">{t.similar}</h3>
            <Grid items={similar} />
          </div>
        )}
        <div style={{ height: 22 }} />
      </div>

      {/* Липкая нижняя панель с фирменной кнопкой #AE33FF */}
      <div className="pd-bar">
        <div>
          <b>{fmt(sum)} ₸</b>
          <small>{noSizes ? colorName || `${p.minQty} ${t.pcs}` : pickedLabel || colorName || t.chooseSize}</small>
        </div>
        <button
          className={'btn' + (stockTotal <= 0 || (!noSizes && !picked.length) ? ' soft' : '')}
          onClick={add}
          disabled={stockTotal <= 0}
        >
          <ShoppingBag size={17} />
          {stockTotal <= 0 ? t.outStock : (!noSizes && !picked.length ? t.chooseSize : t.addToCart)}
        </button>
      </div>

      {/* Полноэкранный просмотр фото */}
      {zoomOpen && (
        <div className="zoom-overlay" onClick={() => setZoomOpen(false)}>
          <button className="zoom-close" onClick={() => setZoomOpen(false)} aria-label="Close"><X size={20} /></button>
          <img src={'/' + imgs[imgIdx]} alt="" onClick={(e) => e.stopPropagation()} />
          {imgs.length > 1 && (
            <div className="zoom-dots" onClick={(e) => e.stopPropagation()}>
              {imgs.map((_, k) => <button key={k} className={k === imgIdx ? 'on' : ''} onClick={() => jumpImg(k)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SizeTableSheet({ p }: { p: Product }) {
  const { t, lang } = useApp()
  const shoes = p.categories.some((c) => /ayakkab|shoe|обув/i.test(Object.values(c.name).join(' ') + c.slug))
  const rows = shoes ? SIZE_ROWS.shoes : SIZE_ROWS.women
  const sAx = sizeAxis(p)
  const have = new Set(sAx?.values.map((v) => tx(v.name, lang)))
  return (
    <Sheet title={t.sizeTableTitle}>
      <table className="sz-table">
        <thead><tr>{rows.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.rows.map((r, i) => <tr key={i} className={r.slice(0, 3).some((c) => have.has(c)) ? 'on' : ''}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
      </table>
      <p className="muted small">{t.sizesTurkish}</p>
    </Sheet>
  )
}

function AiSizeSheet({ p, onPick }: { p: Product; onPick: (label: string) => void }) {
  const { t, lang, sheet } = useApp()
  const [h, setH] = useState(165)
  const [w, setW] = useState(65)
  const [fit, setFit] = useState(1)
  const [res, setRes] = useState('')
  const sizes = sizeAxis(p)?.values.map((v) => tx(v.name, lang)) ?? []
  const calc = () => {
    const bmi = w / (h / 100) ** 2
    const ru = Math.round((38 + (bmi - 17) * 2.1 + (h - 160) * 0.08 + (fit - 1) * 2) / 2) * 2
    const nums = sizes.map((s) => Number(s.replace(/\D/g, ''))).filter(Boolean)
    const best = nums.length ? nums.reduce((a, b) => (Math.abs(b - ru) < Math.abs(a - ru) ? b : a)) : ru
    setRes(String(sizes.find((s) => Number(s.replace(/\D/g, '')) === best) ?? best))
  }
  return (
    <Sheet title={t.aiTitle}>
      <div className="ai-grid">
        <label><span>{t.aiHeight}</span><input type="number" value={h} onChange={(e) => setH(Number(e.target.value))} /></label>
        <label><span>{t.aiWeight}</span><input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} /></label>
      </div>
      <p className="muted small" style={{ margin: '12px 0 8px' }}>{t.aiFit}</p>
      <Seg items={t.aiFitOpts} value={fit} onChange={setFit} />
      {res && <div className="ai-res"><Sparkles size={18} />{t.aiRes(res)}</div>}
      {!res ? <button className="btn" onClick={calc}>{t.aiGo}</button> : <button className="btn" onClick={() => { onPick(res); sheet(null) }}>{t.aiPick}</button>}
    </Sheet>
  )
}
