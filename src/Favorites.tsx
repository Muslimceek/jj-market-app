import { useMemo, useState } from 'react'
import { Heart, ShoppingBag, SlidersHorizontal, ArrowUpDown, Sparkles, CircleCheck, Trash2 } from 'lucide-react'
import { useApp, tx, sizeAxis, colorAxis } from './store'
import { Grid, SectionHead } from './ui'
import { SortSheet, emptyF, applyF, activeCount, type FState } from './Catalog'

/* ---------- ИЗБРАННОЕ С НУЛЯ: Apple-дизайн + умные фильтры + рекомендации когда пусто ---------- */
export function Favorites() {
  const { cat, s, set, t, lang, push, tab, sheet, addToCart, toast } = useApp()
  const ext = t.ext
  const [chip, setChip] = useState<'all' | 'sale' | 'stock' | string>('all')
  const [f, setF] = useState<FState>(() => emptyF(cat))

  const favProducts = useMemo(() => cat.products.filter((p) => s.favs.includes(p.id)), [cat.products, s.favs])

  // Категории внутри избранных товаров
  const favCats = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of favProducts) {
      const c = p.categories[0]
      if (c && !map.has(c.id)) map.set(c.id, tx(c.name, lang))
    }
    return [...map.entries()]
  }, [favProducts, lang])

  const filtered = useMemo(() => {
    let base = favProducts
    if (chip === 'sale') base = base.filter((p) => p.pct > 0 || p.old > 0)
    else if (chip === 'stock') base = base.filter((p) => p.stock > 0 || p.variants.some((v) => v.stock > 0))
    else if (chip !== 'all') base = base.filter((p) => p.categories.some((c) => c.id === chip))
    return applyF(cat, base, f)
  }, [favProducts, chip, cat, f])

  // Рекомендации для пустого экрана (как в Ozon / Apple Store)
  const recs = useMemo(() => {
    return [...cat.products]
      .filter((p) => p.images.length > 0 && (p.name.ru?.length || 0) > 6)
      .sort((a, b) => b.pct - a.pct || b.rating - a.rating)
      .slice(0, 8)
  }, [cat.products])

  const addAllToCart = () => {
    let added = 0
    for (const p of filtered) {
      const sAx = sizeAxis(p)
      const cAx = colorAxis(p)
      const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0]
      const sz = sAx?.values.find((x) => v?.values.includes(x.id))
      const label = [tx(cAx?.values[0]?.name, lang), tx(sz?.name, lang)].filter(Boolean).join(' · ')
      addToCart(p.id, [{ variantId: v?.id, label, qty: 1 }])
      added++
    }
    if (added > 0) {
      toast(<span className="toast-row"><CircleCheck size={16} color="#16a34a" />{ext.favAddedAll} ({added})</span>)
    }
  }

  const nFilter = activeCount(cat, f)

  return (
    <div className="screen home-screen">
      <header className="fav-header">
        <div className="fh-top">
          <div>
            <h1>{t.favorites}</h1>
            {favProducts.length > 0 && <small>{favProducts.length} {t.items}</small>}
          </div>
          {favProducts.length > 0 && (
            <div className="fh-acts">
              <button className="fh-pill-btn" onClick={addAllToCart}>
                <ShoppingBag size={14} />
                <span>{ext.favAddAll}</span>
              </button>
              <button
                className="fh-ic-btn"
                onClick={() => set((x) => ({ ...x, favs: [] }))}
                aria-label={t.clearAll}
                title={t.clearAll}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {favProducts.length > 0 && (
          <>
            <div className="fav-chips">
              <button className={'ftab sm' + (chip === 'all' ? ' on' : '')} onClick={() => setChip('all')}>{ext.favAll}</button>
              <button className={'ftab sm' + (chip === 'sale' ? ' on' : '')} onClick={() => setChip('sale')}>{ext.favSale}</button>
              <button className={'ftab sm' + (chip === 'stock' ? ' on' : '')} onClick={() => setChip('stock')}>{ext.favStock}</button>
              {favCats.map(([id, name]) => (
                <button key={id} className={'ftab sm' + (chip === id ? ' on' : '')} onClick={() => setChip(id)}>{name}</button>
              ))}
            </div>
            <div className="list-tools clean">
              <button onClick={() => sheet(<SortSheet value={f.sort} onPick={(v) => setF({ ...f, sort: v })} />)}>
                <ArrowUpDown size={15} />{t.sortOpts[f.sort]}
              </button>
              <button className={nFilter > 0 ? 'has-f' : ''} onClick={() => push('filters', { f, onApply: setF })}>
                <SlidersHorizontal size={15} />{t.filters}{nFilter > 0 && <i>{nFilter}</i>}
              </button>
            </div>
          </>
        )}
      </header>

      <div className="scroll">
        {favProducts.length === 0 ? (
          <>
            <div className="fav-empty-card">
              <div className="fec-orb">
                <Heart size={30} color="#AE33FF" strokeWidth={1.9} />
              </div>
              <h2>{t.favEmpty}</h2>
              <p>{t.favEmptySub}</p>
              <button className="btn small" onClick={() => tab('cats')}>
                <Sparkles size={15} />{t.goShopping}
              </button>
            </div>

            <SectionHead title={ext.favMayLike} onAll={() => push('list', { kind: 'all', title: t.recommended })} />
            <Grid items={recs} />
          </>
        ) : filtered.length > 0 ? (
          <Grid items={filtered} />
        ) : (
          <div className="fav-empty-card">
            <h2>{t.noProducts}</h2>
            <p>{t.noProductsSub}</p>
            <button className="btn small" onClick={() => { setChip('all'); setF(emptyF(cat)) }}>{t.reset}</button>
          </div>
        )}
        <div style={{ height: 22 }} />
      </div>
    </div>
  )
}
