import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, Send, Store, ShieldCheck, CheckCheck, MessageCircle,
  ExternalLink, ChevronRight, Sparkles,
} from 'lucide-react'
import { useApp, tx, fmt, sizeAxis, type Product, type SellerMessage } from './store'
import { TopBar, Empty } from './ui'

const nowTime = () =>
  new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** Умный контекстный ответ продавца по реальным данным товара из каталога */
function buildSellerReply(seller: string, q: string, p: Product | undefined, lang: 'ru' | 'tr' | 'kk'): string {
  const low = q.toLowerCase()
  const sAx = p ? sizeAxis(p) : undefined
  const availSizes = p
    ? p.variants
        .filter((v) => v.stock > 0)
        .map((v) => sAx?.values.find((x) => v.values.includes(x.id)))
        .filter(Boolean)
        .map((x) => tx(x!.name, lang))
    : []
  const uniqueSizes = [...new Set(availSizes)]
  const totalStock = p ? (p.variants.reduce((a, v) => a + (v.stock || 0), 0) || p.stock) : 0
  const feats = p ? p.features.map((f) => `${tx(f.name, lang)}: ${tx(f.value, lang)}`).join(' · ') : ''

  if (/размер|size|beden|өлшем|сядет|сидит|посадк|kalıp/i.test(low)) {
    if (uniqueSizes.length > 0) {
      const fitNote =
        p?.fit === 'slim'
          ? 'Модель немного приталенная — при сомнении советуем брать на размер больше.'
          : p?.fit === 'loose' || p?.fit === 'wide' || p?.fit === 'oversize'
            ? 'Посадка свободная, сидит комфортно.'
            : 'Идёт в размер, стандартная посадка.'
      return `Сейчас в наличии размеры: ${uniqueSizes.join(', ')}. ${fitNote} Напишите ваш рост и вес — помогу выбрать точно!`
    }
    if (totalStock > 0) return `Товар идёт в универсальном размере, сейчас в наличии ${totalStock} шт. Можете оформлять смело!`
    return `К сожалению, именно эта партия сейчас распродана, но скоро ожидаем поступление. Могу подобрать похожую модель из нашего магазина ${seller}!`
  }

  if (/материал|состав|кожа|ткань|качеств|materyal|kumaş/i.test(low)) {
    if (feats) return `Характеристики этой модели: ${feats}. Перед отправкой мы лично проверяем каждую позицию.`
    return `Качество оригинал от ${seller}, все швы и фурнитура проверяются перед упаковкой.`
  }

  if (/доставк|город|стран|адрес|teslimat|kargo/i.test(low)) {
    return `Отправляем заказы JJ Market по 4 странам: Узбекистан, Казахстан, Россия и Кыргызстан — курьером или в пункты выдачи JJ.`
  }

  if (/цен|скидк|торг|дешев|промо|indirim|fiyat/i.test(low)) {
    if (p) {
      const disc = p.pct > 0 ? ` Уже действует скидка −${p.pct}% (${fmt(p.price)} ₸ вместо ${fmt(p.old)} ₸).` : ` Актуальная цена — ${fmt(p.price)} ₸.`
      return `${disc} Также в корзине можно применить промокод JJ10 для дополнительной скидки −10%!`
    }
    return `В корзине сейчас действует промокод JJ10 (−10% на заказ).`
  }

  if (/наличи|остат|есть|stok/i.test(low)) {
    if (totalStock > 0) {
      const sz = uniqueSizes.length ? ` Доступные размеры: ${uniqueSizes.join(', ')}.` : ''
      return `Да, товар в наличии (${totalStock} шт).${sz} Можете добавить в корзину прямо сейчас.`
    }
    return `Эта модель временно закончилась на складе. Нажмите ♥ «Избранное», чтобы не потерять — или посмотрите похожие модели в нашем магазине.`
  }

  if (p) {
    return `Спасибо за вопрос по «${tx(p.name, lang)}»! ${totalStock > 0 ? `Товар есть в наличии (${totalStock} шт)` : 'Модель скоро снова будет в наличии'}${feats ? ` · ${feats}` : ''}. Подсказать по размеру или доставке?`
  }
  return `Спасибо за обращение в ${seller}! Чем я могу помочь с выбором?`
}

/* ---------- ЧАТ С ПРОДАВЦОМ ПО КОНКРЕТНОМУ ТОВАРУ ---------- */
export function SellerChat({ seller, productId }: { seller: string; productId?: string }) {
  const { cat, s, set, t, lang, pop, push, money } = useApp()
  const ext = t.ext
  const p = useMemo(() => (productId ? cat.products.find((x) => x.id === productId) : undefined), [cat.products, productId])
  const chatKey = seller || 'JJ Market'
  const existing = s.chats?.[chatKey] ?? []
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // При первом открытии создаём приветствие продавца
  useEffect(() => {
    if (existing.length === 0) {
      const welcome: SellerMessage = {
        id: 'welcome-' + Date.now(),
        from: 'seller',
        text: ext.chatGreet(chatKey),
        time: nowTime(),
        productId,
      }
      set((x) => ({
        ...x,
        chats: { ...(x.chats || {}), [chatKey]: [welcome] },
      }))
    }
  }, [chatKey])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [existing.length, typing])

  const sendText = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    const buyerMsg: SellerMessage = {
      id: 'b-' + Date.now(),
      from: 'buyer',
      text,
      time: nowTime(),
      productId,
    }
    set((x) => ({
      ...x,
      chats: { ...(x.chats || {}), [chatKey]: [...(x.chats?.[chatKey] || []), buyerMsg] },
    }))
    setInput('')
    setTyping(true)

    window.setTimeout(() => {
      const reply: SellerMessage = {
        id: 's-' + Date.now(),
        from: 'seller',
        text: buildSellerReply(chatKey, text, p, lang),
        time: nowTime(),
      }
      set((x) => ({
        ...x,
        chats: { ...(x.chats || {}), [chatKey]: [...(x.chats?.[chatKey] || []), reply] },
      }))
      setTyping(false)
    }, 850)
  }

  return (
    <div className="screen home-screen sc-screen">
      {/* Шапка продавца с зелёным статусом онлайн */}
      <header className="sc-header">
        <button className="tb-back" onClick={pop} aria-label={t.back}><ChevronLeft size={23} /></button>
        <span className="sc-av">
          <Store size={17} />
          <i className="sc-online-dot" />
        </span>
        <div className="sc-head-txt">
          <b>{chatKey} <ShieldCheck size={14} color="#AE33FF" /></b>
          <small>{typing ? ext.sellerTyping : ext.sellerOnline}</small>
        </div>
      </header>

      {/* Закреплённая карточка обсуждаемого товара */}
      {p && (
        <button className="sc-pinned-prod" onClick={() => push('product', { id: p.id })}>
          <img src={'/' + p.images[0]} alt="" />
          <div className="scp-info">
            <span className="scp-name">{tx(p.name, lang)}</span>
            <div className="scp-price">
              <b>{money(p.price)}</b>
              {p.old > p.price && <s>{money(p.old)}</s>}
              {p.pct > 0 && <em>−{p.pct}%</em>}
            </div>
          </div>
          <span className="scp-open"><ExternalLink size={15} /></span>
        </button>
      )}

      {/* Лента сообщений */}
      <div className="scroll sc-messages">
        {existing.map((m) => (
          <div key={m.id} className={'sc-msg-row ' + m.from}>
            <div className={'sc-bubble ' + m.from}>
              <p>{m.text}</p>
              <span className="sc-meta">
                {m.time}
                {m.from === 'buyer' && <CheckCheck size={13} />}
              </span>
            </div>
          </div>
        ))}

        {typing && (
          <div className="sc-msg-row seller">
            <div className="sc-bubble seller typing">
              <span className="dots"><i /><i /><i /></span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Быстрые вопросы в 1 касание */}
      <div className="sc-quick-bar">
        {ext.chatQuickQs.map((q) => (
          <button key={q} className="sc-q-chip" onClick={() => sendText(q)}>
            <Sparkles size={11} />{q}
          </button>
        ))}
      </div>

      {/* Поле ввода */}
      <div className="sc-input-bar">
        <input
          placeholder={ext.chatInputPh}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText(input)}
        />
        <button
          className={'sc-send' + (input.trim() ? ' ready' : '')}
          onClick={() => sendText(input)}
          disabled={!input.trim()}
          aria-label="Send"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}

/* ---------- СПИСОК ВСЕХ ЧАТОВ С ПРОДАВЦАМИ (в Профиле) ---------- */
export function SellerChats() {
  const { s, cat, t, push } = useApp()
  const ext = t.ext
  const entries = Object.entries(s.chats || {}).filter(([, msgs]) => msgs.length > 0)

  return (
    <div className="screen home-screen">
      <TopBar title={ext.sellerChats} />
      <div className="scroll">
        {entries.length === 0 ? (
          <Empty icon={<MessageCircle size={26} />} title={ext.chatEmpty} sub={ext.chatEmptySub} />
        ) : (
          <div className="ios-group" style={{ marginTop: 10 }}>
            {entries.map(([seller, msgs]) => {
              const last = msgs[msgs.length - 1]
              const pid = [...msgs].reverse().find((m) => m.productId)?.productId
              const prod = pid ? cat.products.find((x) => x.id === pid) : undefined
              return (
                <button
                  key={seller}
                  className="sc-thread-row"
                  onClick={() => push('sellerChat', { seller, productId: pid })}
                >
                  <span className="sct-av">
                    {prod?.images[0] ? <img src={'/' + prod.images[0]} alt="" /> : <Store size={18} color="#AE33FF" />}
                  </span>
                  <div className="sct-body">
                    <div className="sct-top">
                      <b>{seller}</b>
                      <small>{last.time}</small>
                    </div>
                    <p>{last.text}</p>
                  </div>
                  <ChevronRight size={16} className="ios-chev" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
