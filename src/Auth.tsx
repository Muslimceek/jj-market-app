import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Eye, EyeOff, ChevronLeft, CircleAlert, Loader2, CircleCheck,
  Sparkles, Check, ArrowRight, MessageCircle, Heart, Package, UserPlus,
  ShieldCheck, Phone, Mail, Star, Truck, Gift, PlayCircle, BadgeCheck,
  ShoppingBag, Globe,
} from 'lucide-react'
import { useApp, tx as i18nTx, type User } from './store'
import { Sheet } from './ui'
import { COUNTRIES, type CountryInfo } from './geo'
import { LANGS } from './i18n'

/* ---------- Заставка ---------- */
export function Splash() {
  return <div className="splash"><img src="/brand/JJ_logo_full_purple.svg" alt="JJ Market" /></div>
}

/* ---------- Общие премиальные элементы шапки (в духе JJ Seller + брендбук #AE33FF) ---------- */
function LangGlassSwitch() {
  const { s, set } = useApp()
  const idx = Math.max(0, LANGS.findIndex((l) => l.code === s.lang))
  return (
    <div className="jja-lang" role="group" aria-label="Language">
      <span className="jja-lang-thumb" style={{ transform: `translateX(${idx * 100}%)` }} />
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={s.lang === l.code ? 'on' : ''}
          onClick={() => set((x) => ({ ...x, lang: l.code }))}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}

function HeroBar({
  onBack, onGuide, onSkip, guideLabel, skipLabel, mini = false,
}: {
  onBack?: () => void
  onGuide?: () => void
  onSkip?: () => void
  guideLabel?: string
  skipLabel?: string
  mini?: boolean
}) {
  const { t } = useApp()
  return (
    <div className="jja-top">
      <div className="jja-top-l">
        {onBack && (
          <button type="button" className="jja-back" onClick={onBack} aria-label={t.back}>
            <ChevronLeft size={19} strokeWidth={2.4} />
          </button>
        )}
        {mini ? (
          <div className="jja-mini-brand">
            <span className="jja-mini-emblem"><img src="/brand/JJ_symbol_white.svg" alt="JJ" /></span>
            <span>JJ <b>Market</b></span>
          </div>
        ) : (
          <div className="jja-brand">
            <span className="jja-emblem">
              <i className="jja-emblem-shine" />
              <img src="/brand/JJ_symbol_white.svg" alt="JJ" />
            </span>
            <span className="jja-brand-txt">
              <span className="jja-brand-main">JJ <b>Market</b></span>
              <span className="jja-brand-sub"><i />{t.ext.heroSub}</span>
            </span>
          </div>
        )}
      </div>
      <div className="jja-top-r">
        <LangGlassSwitch />
        {onGuide && guideLabel && (
          <button type="button" className="jja-guide-btn" onClick={onGuide} title={guideLabel}>
            <PlayCircle size={13} />
            <span>{guideLabel}</span>
          </button>
        )}
        {onSkip && (
          <button type="button" className="jja-skip-ic" onClick={onSkip} aria-label={skipLabel || t.skip} title={skipLabel || t.skip}>
            <X size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- РЕАЛИСТИЧНЫЙ АНИМИРОВАННЫЙ 3-ШАГОВЫЙ ОНБОРДИНГ ---------- */
export function Onboarding({
  onDone, onRegister, onSkip,
}: {
  onDone: () => void
  onRegister?: () => void
  onSkip?: () => void
}) {
  const { t, cat, lang, money } = useApp()
  const ext = t.ext
  const [step, setStep] = useState(0)
  const [liked, setLiked] = useState(true)
  const touchX = useRef<number | null>(null)
  const last = step === t.onb.length - 1

  const previewProds = useMemo(() => {
    const withImgs = cat.products.filter((p) => p.images.length > 0 && p.pct > 0)
    const pool = withImgs.length >= 2 ? withImgs : cat.products.filter((p) => p.images.length > 0)
    return pool.slice(0, 3)
  }, [cat.products])

  const p0 = previewProds[0]
  const p1 = previewProds[1] || p0

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (dx < -40 && step < t.onb.length - 1) setStep(step + 1)
    else if (dx > 40 && step > 0) setStep(step - 1)
  }

  return (
    <div className="jjo-screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Верхняя брендовая сцена #AE33FF с реалистичными живыми превью-карточками */}
      <div className="jjo-stage">
        <div className="jja-orb a" />
        <div className="jja-orb b" />

        <HeroBar mini onSkip={onSkip || onDone} skipLabel={t.skip} />

        {/* Живая сцена текущего шага */}
        <div className="jjo-visual" key={step}>
          {step === 0 && p0 && (
            <div className="jjo-scene-cat">
              {/* Всплывающий верхний чип-метка */}
              <div className="jjo-float-pill top-l">
                <BadgeCheck size={13} color="#AE33FF" />
                <span>{ext.onbCardOrig}</span>
              </div>

              {/* Реалистичная карточка товара из каталога */}
              <div className="jjo-prod-card">
                <div className="jjo-card-shine" />
                <div className="jjo-pc-media">
                  <img src={p0.images[0]} alt="" />
                  {p0.pct > 0 && <span className="jjo-pc-disc">−{p0.pct}%</span>}
                  <button
                    type="button"
                    className={'jjo-pc-heart' + (liked ? ' on' : '')}
                    onClick={() => setLiked(!liked)}
                    aria-label="Favorite"
                  >
                    <Heart size={15} fill={liked ? '#E03556' : 'none'} color={liked ? '#E03556' : '#484848'} />
                  </button>
                </div>
                <div className="jjo-pc-body">
                  <div className="jjo-pc-brand">
                    <span>{p0.brand || p0.seller}</span>
                    <b><Star size={11} fill="#F59E0B" color="#F59E0B" />{(p0.rating || 4.9).toFixed(1)}</b>
                  </div>
                  <div className="jjo-pc-name">{i18nTx(p0.name, lang)}</div>
                  <div className="jjo-pc-price">
                    <strong>{money(p0.price)}</strong>
                    {p0.old > p0.price && <s>{money(p0.old)}</s>}
                  </div>
                </div>
              </div>

              {/* Всплывающий тост «Добавлено в корзину» */}
              <div className="jjo-float-toast">
                <span className="jjo-ft-ic"><Check size={12} strokeWidth={3} /></span>
                <span>{ext.onbCardAdded}</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="jjo-scene-track">
              {/* 4 страны доставки */}
              <div className="jjo-co-strip">
                {COUNTRIES.map((co, idx) => (
                  <span key={co.code} style={{ animationDelay: `${idx * 70}ms` }}>
                    <em>{co.flag}</em><b>{co.code}</b>
                  </span>
                ))}
              </div>

              {/* Живая карточка трекинга заказа */}
              <div className="jjo-order-card">
                <div className="jjo-card-shine" />
                <div className="jjo-oc-head">
                  <div className="jjo-oc-id">
                    <span className="jjo-oc-ic"><Package size={16} /></span>
                    <div>
                      <b>{ext.onbOrderNum}</b>
                      <small><i />{ext.onbOrderLive}</small>
                    </div>
                  </div>
                  <span className="jjo-oc-live-tag"><Truck size={12} />{ext.onbOrderSteps[1]}</span>
                </div>

                {/* Реальные миниатюры товаров в заказе */}
                <div className="jjo-oc-items">
                  {[p0, p1].filter(Boolean).map((pr, idx) => (
                    <div className="jjo-oc-thumb" key={idx}>
                      <img src={pr.images[0]} alt="" />
                    </div>
                  ))}
                  <div className="jjo-oc-summary">
                    <span>2 {t.pcs}</span>
                    <b>{money((p0?.price || 24900) + (p1?.price || 18500))}</b>
                  </div>
                </div>

                {/* Анимированный прогресс доставки (3 шага, без обещания «завтра») */}
                <div className="jjo-oc-track">
                  <div className="jjo-oc-line"><i /></div>
                  <div className="jjo-oc-steps">
                    <span className="done"><i><Check size={10} strokeWidth={3} /></i>{ext.onbOrderSteps[0]}</span>
                    <span className="now"><i className="pulse" />{ext.onbOrderSteps[1]}</span>
                    <span><i />{ext.onbOrderSteps[2]}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="jjo-scene-chat">
              {/* Реалистичное окно чата с продавцом */}
              <div className="jjo-chat-card">
                <div className="jjo-card-shine" />
                <div className="jjo-ch-head">
                  <span className="jjo-ch-av">
                    <ShoppingBag size={15} />
                    <i />
                  </span>
                  <div className="jjo-ch-seller">
                    <b>{p0?.seller || 'IMAGO LUXURY'} <BadgeCheck size={13} color="#AE33FF" /></b>
                    <small>{ext.sellerOnline}</small>
                  </div>
                </div>

                <div className="jjo-ch-msgs">
                  <div className="jjo-msg buyer">{ext.onbChatQ}</div>
                  <div className="jjo-msg seller">{ext.onbChatA}</div>
                </div>
              </div>

              {/* Плавающий чип JJ AI-Стилист */}
              <div className="jjo-ai-pill">
                <span className="jjo-ai-ic"><Sparkles size={13} /></span>
                <b>{ext.onbAiMatch}</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Нижний чистый белый лист с текстом, кликабельными точками и кнопками */}
      <div className="jjo-sheet">
        <div className="jjo-sheet-body" key={step}>
          <span className="jjo-badge">
            <i />
            {ext.onbBadges[step]}
          </span>
          <h2>{t.onb[step].t}</h2>
          <p>{t.onb[step].s}</p>
        </div>

        <div className="jjo-dots" role="tablist">
          {t.onb.map((_, k) => (
            <button
              key={k}
              type="button"
              className={k === step ? 'on' : k < step ? 'past' : ''}
              onClick={() => setStep(k)}
              aria-label={`Slide ${k + 1}`}
            />
          ))}
        </div>

        <div className="jjo-actions">
          <button
            type="button"
            className="jja-btn shine"
            onClick={() => (last ? (onRegister ? onRegister() : onDone()) : setStep(step + 1))}
          >
            <span>{last ? ext.onbStartShop : t.next}</span>
            <ArrowRight size={17} />
          </button>

          <button type="button" className="jjo-sec-btn" onClick={onDone}>
            {ext.onbHaveAcc}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Хранилище демо-аккаунтов ---------- */
const ACC = 'jj-market-demo-accounts'
const accounts = (): { id: string; pass: string; user: User }[] => { try { return JSON.parse(localStorage.getItem(ACC) || '[]') } catch { return [] } }
const digits = (s: string) => s.replace(/\D/g, '')
const maskPhone = (s: string, maxLen = 10) => {
  const d = digits(s).slice(0, maxLen)
  if (maxLen === 9) return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(d.length > 6 ? '-' : ' ').replace(/^(\d{3})[- ](\d{3})/, '$1 $2')
}
export const DEMO_USER: User = { first: 'Муслим', last: 'Покупатель', email: 'demo@jjmarket.kz', phone: '+7 700 000 00 00', gender: '', birth: '' }

function Consent() {
  const { t, push } = useApp()
  return (
    <p className="jja-consent">
      {t.consent[0]}
      <a onClick={() => push('doc', 'privacy')}>{t.consent[1]}</a>
      {t.consent[2]}
      <a onClick={() => push('doc', 'offer')}>{t.consent[3]}</a>
      {t.consent[4]}
    </p>
  )
}

function SocialSheet({ provider, onOk }: { provider: 'Apple' | 'Google'; onOk: () => void }) {
  const { t, sheet } = useApp()
  const [st, setSt] = useState<0 | 1 | 2>(0)
  const go = () => { setSt(1); setTimeout(() => setSt(2), 680); setTimeout(() => { sheet(null); onOk() }, 1150) }
  return (
    <Sheet title={t.socialTitle(provider)}>
      <div className="soc-app"><img src="/brand/JJ_symbol_white.svg" alt="" /><span>{t.socialText}</span></div>
      <div className="soc-acc"><span className="soc-av">M</span><span>{DEMO_USER.first} {DEMO_USER.last}<small>{DEMO_USER.email}</small></span></div>
      {st === 0 ? <button className="btn" onClick={go}>{t.socialBtn}</button>
        : <div className="soc-st">{st === 1 ? <Loader2 size={30} className="spinning" /> : <CircleCheck size={30} color="#16a34a" />}<span>{st === 1 ? t.signingIn : t.done}</span></div>}
    </Sheet>
  )
}

function ResetSheet() {
  const { t, sheet, toast } = useApp()
  const [v, setV] = useState('')
  return (
    <Sheet title={t.resetTitle}>
      <p className="muted" style={{ marginTop: 0 }}>{t.resetSub}</p>
      <div className="inp"><input autoFocus placeholder={`${t.phoneTab} / ${t.mailTab}`} value={v} onChange={(e) => setV(e.target.value)} /></div>
      <button className={'btn' + (v.trim().length > 3 ? '' : ' dis')} onClick={() => { if (v.trim().length > 3) { sheet(null); toast(t.sent) } }}>{t.send}</button>
    </Sheet>
  )
}

/* ---------- 1. ВХОД — Motion-Hero (как JJ Seller, в цветах #AE33FF) + UX Wildberries/Ozon/Trendyol ---------- */
export function Login({
  onDone, canSkip, onGuide, initialView = 'login',
}: {
  onDone: (u: User) => void
  canSkip?: () => void
  onGuide?: () => void
  initialView?: 'login' | 'reg'
}) {
  const { t, sheet } = useApp()
  const ext = t.ext
  const [view, setView] = useState<'login' | 'reg' | 'code' | 'welcome'>(initialView)
  const [hookIdx, setHookIdx] = useState(0)
  const [mode, setMode] = useState(0)
  const [country, setCountry] = useState<CountryInfo>(COUNTRIES[1])
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ user: User; to: string; fromReg: boolean } | null>(null)
  const [doneUser, setDoneUser] = useState<User | null>(null)

  useEffect(() => {
    if (view !== 'login') return
    const timer = window.setInterval(() => setHookIdx((k) => (k + 1) % 3), 3800)
    return () => window.clearInterval(timer)
  }, [view])

  const phoneLen = country.code === 'UZ' || country.code === 'KG' ? 9 : 10
  const isAdmin = id.trim().toLowerCase() === 'admin'
  const idOk = isAdmin || (mode === 0 ? digits(id).length === phoneLen : /.+@.+\..+/.test(id))
  const ready = idOk && pass.length > 0
  const hook = ext.hooks[hookIdx]

  const finishWithWelcome = (u: User) => {
    setDoneUser(u)
    setView('welcome')
    window.setTimeout(() => onDone(u), 1350)
  }

  const submit = () => {
    if (!ready || busy) return
    setBusy(true); setErr(false)
    setTimeout(() => {
      const key = mode === 0 && !isAdmin ? digits(id) : id.trim().toLowerCase()
      const acc = accounts().find((a) => a.id === key && a.pass === pass)
      if (isAdmin && pass === 'admin') onDone(DEMO_USER)
      else if (acc) onDone(acc.user)
      else { setBusy(false); setErr(true) }
    }, 480)
  }

  if (view === 'welcome' && doneUser) {
    return (
      <div className="jja-welcome">
        <div className="jja-orb a" />
        <div className="jja-orb b" />
        <div className="jja-w-emblem">
          <span className="jja-pulse" />
          <span className="jja-pulse r2" />
          <span className="jja-w-core"><Check size={36} strokeWidth={3} color="#fff" /></span>
        </div>
        <span className="jja-w-tag"><Gift size={13} />{ext.regCardPromo}</span>
        <h1>{ext.regWelcome(doneUser.first || 'JJ')}</h1>
        <p>{ext.regWelcomeSub}</p>
      </div>
    )
  }

  if (view === 'reg') {
    return (
      <Register
        canSkip={canSkip}
        onGuide={onGuide}
        onSwitchLogin={() => setView('login')}
        onSocial={(p) => sheet(<SocialSheet provider={p} onOk={() => finishWithWelcome(DEMO_USER)} />)}
        onCode={(user, to) => { setPending({ user, to, fromReg: true }); setView('code') }}
      />
    )
  }

  if (view === 'code' && pending) {
    return (
      <Code
        to={pending.to}
        fromReg={pending.fromReg}
        onBack={() => setView(pending.fromReg ? 'reg' : 'login')}
        onOk={() => finishWithWelcome(pending.user.first ? pending.user : { ...DEMO_USER, phone: pending.to })}
      />
    )
  }

  return (
    <div className="jja-screen" key="login-view">
      {/* Брендовый Motion-Hero JJ Market */}
      <div className="jja-hero">
        <div className="jja-orb a" />
        <div className="jja-orb b" />

        <HeroBar onGuide={onGuide} guideLabel={ext.guideBtn} onSkip={canSkip} skipLabel={t.skip} />

        {/* Анимированная стеклянная карточка преимуществ (автосмена + тап) */}
        <div className="jja-hook-card" key={hookIdx} onClick={() => setHookIdx((k) => (k + 1) % 3)}>
          <div className="jjo-card-shine" />
          <div className="jja-hc-top">
            <span className="jja-hc-tag">
              {hookIdx === 0 ? <Globe size={11} /> : hookIdx === 1 ? <MessageCircle size={11} /> : <Gift size={11} />}
              {hook.tag}
            </span>
            <span className="jja-hc-metric">
              <b>{hook.metric}</b>
              <small>{hook.metricSub}</small>
            </span>
          </div>

          <div className="jja-hc-body">
            <div className="jja-hc-copy">
              <h2>{hook.title}</h2>
              <p>{hook.sub}</p>
            </div>

            {hookIdx === 0 && (
              <div className="jja-hc-countries" aria-hidden>
                <span>UZ</span><span>KZ</span><span>RU</span><span>KG</span>
              </div>
            )}
            {hookIdx === 1 && (
              <div className="jja-hc-visual chat" aria-hidden>
                <MessageCircle size={20} />
                <i className="online" />
              </div>
            )}
            {hookIdx === 2 && (
              <div className="jja-hc-visual gift" aria-hidden>
                <Gift size={20} />
                <span>%</span>
              </div>
            )}
          </div>

          <div className="jja-hc-dots">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i === hookIdx ? 'on' : ''}><i /></span>
            ))}
          </div>
        </div>
      </div>

      {/* Светлый приподнятый лист */}
      <div className="jja-sheet">
        <div className="jja-sheet-main">
          {/* Заметная широкая карточка «Новый покупатель · Регистрация» (вдохновлено JJ Seller) */}
          <button type="button" className="jja-new-banner" onClick={() => setView('reg')}>
            <span className="jja-nb-shine" />
            <span className="jja-nb-ic"><UserPlus size={19} strokeWidth={2.2} /></span>
            <div className="jja-nb-copy">
              <div className="jja-nb-row">
                <b>{ext.newBuyerTitle}</b>
                <span className="jja-nb-badge"><i />{ext.newBuyerBadge}</span>
              </div>
              <small>{ext.newBuyerSub}</small>
            </div>
            <span className="jja-nb-go" aria-hidden><ArrowRight size={16} strokeWidth={2.5} /></span>
          </button>

          {/* Белая форма входа в духе WB / Ozon / Trendyol */}
          <div className="jja-form-card">
            <div className="jja-seg">
              <i style={{ transform: `translateX(${mode * 100}%)` }} />
              <button type="button" className={mode === 0 ? 'on' : ''} onClick={() => { setMode(0); setId(''); setErr(false) }}>
                <Phone size={13} />{t.phoneTab}
              </button>
              <button type="button" className={mode === 1 ? 'on' : ''} onClick={() => { setMode(1); setId(''); setErr(false) }}>
                <Mail size={13} />{t.mailTab}
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submit() }}>
              {mode === 0 ? (
                <>
                  <div className="jja-co-pills">
                    {COUNTRIES.map((co) => (
                      <button
                        key={co.code}
                        type="button"
                        className={'jja-co' + (country.code === co.code ? ' on' : '')}
                        onClick={() => { setCountry(co); setId(''); setErr(false) }}
                      >
                        <span>{co.flag}</span><b>{co.dial}</b>
                      </button>
                    ))}
                  </div>
                  <div className={'jja-inp' + (err ? ' err' : idOk ? ' ok' : '')}>
                    <span className="jja-prefix">{country.dial}</span>
                    <input
                      inputMode={/[a-z]/i.test(id) ? 'text' : 'tel'}
                      placeholder={phoneLen === 9 ? '90 123 45 67' : '700 000-00-00'}
                      value={id}
                      autoComplete="tel"
                      onChange={(e) => {
                        const v = e.target.value
                        setErr(false)
                        setId(/[a-z]/i.test(v) ? v.slice(0, 5) : maskPhone(v, phoneLen))
                      }}
                    />
                    {idOk && <Check size={15} color="#16A34A" strokeWidth={2.8} />}
                  </div>
                </>
              ) : (
                <div className={'jja-inp' + (err ? ' err' : idOk ? ' ok' : '')}>
                  <span className="jja-ic"><Mail size={15} /></span>
                  <input
                    inputMode="email"
                    placeholder="name@example.com"
                    value={id}
                    autoComplete="username"
                    onChange={(e) => { setErr(false); setId(e.target.value) }}
                  />
                  {idOk && <Check size={15} color="#16A34A" strokeWidth={2.8} />}
                </div>
              )}

              <div className="jja-pass-row">
                <div className={'jja-inp' + (err ? ' err' : '')}>
                  <input
                    type={show ? 'text' : 'password'}
                    placeholder={t.password}
                    value={pass}
                    autoComplete="current-password"
                    onChange={(e) => { setErr(false); setPass(e.target.value) }}
                  />
                  <button type="button" className="jja-eye" onClick={() => setShow(!show)} aria-label="Show">
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div className="jja-forgot-row">
                  {err ? <span className="jja-err"><CircleAlert size={13} />{t.badLogin}</span> : <span />}
                  <button type="button" className="jja-link" onClick={() => sheet(<ResetSheet />)}>{t.forgot}</button>
                </div>
              </div>

              <button className={'jja-btn' + (ready ? ' shine' : ' dis')} type="submit">
                {busy ? <Loader2 size={19} className="spinning" /> : <><span>{t.signIn}</span><ArrowRight size={16} /></>}
              </button>
            </form>

            <div className={'jja-quick' + (mode === 0 ? '' : ' single')}>
              {mode === 0 && (
                <button
                  type="button"
                  className="jja-qbtn"
                  disabled={digits(id).length !== phoneLen}
                  onClick={() => { setPending({ user: { ...DEMO_USER, first: '' }, to: `${country.dial} ${id}`, fromReg: false }); setView('code') }}
                >
                  <Phone size={13} /><span>{t.smsLogin}</span>
                </button>
              )}
              <button
                type="button"
                className="jja-qbtn demo"
                onClick={() => { setMode(0); setId('admin'); setPass('admin'); setErr(false) }}
              >
                <Sparkles size={13} /><span>Demo · admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Соцсети аккуратно внизу без лишнего пустого места */}
        <div className="jja-sheet-foot">
          <div className="jja-or"><span>{ext.orContinue}</span></div>
          <div className="jja-soc-grid">
            <button type="button" className="jja-soc g" onClick={() => sheet(<SocialSheet provider="Google" onOk={() => onDone(DEMO_USER)} />)}>
              <img src="/brand/google.svg" alt="" /><span>Google</span>
            </button>
            <button type="button" className="jja-soc a" onClick={() => sheet(<SocialSheet provider="Apple" onOk={() => onDone(DEMO_USER)} />)}>
              <img src="/brand/apple.svg" alt="" /><span>Apple</span>
            </button>
          </div>
          <Consent />
        </div>
      </div>
    </div>
  )
}

/* ---------- 2. РЕГИСТРАЦИЯ — Живая реактивная карточка покупателя в шапке + 2 быстрых шага ---------- */
function Register({
  onSwitchLogin, onCode, onSocial, canSkip, onGuide,
}: {
  onSwitchLogin: () => void
  onCode: (u: User, to: string) => void
  onSocial: (p: 'Apple' | 'Google') => void
  canSkip?: () => void
  onGuide?: () => void
}) {
  const { t, lang } = useApp()
  const ext = t.ext
  const [step, setStep] = useState<1 | 2>(1)
  const [mode, setMode] = useState(0)
  const [country, setCountry] = useState<CountryInfo>(COUNTRIES[1])
  const [id, setId] = useState('')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [tried, setTried] = useState(false)

  const phoneLen = country.code === 'UZ' || country.code === 'KG' ? 9 : 10
  const idOk = mode === 0 ? digits(id).length === phoneLen : /.+@.+\..+/.test(id)
  const ruleLen = pass.length >= 6
  const ruleNum = /\d/.test(pass)
  const ruleCap = /[A-ZА-ЯЁ]/.test(pass)
  const strength = pass.length === 0 ? 0 : !ruleLen ? 1 : (ruleNum && ruleCap && pass.length >= 8 ? 3 : 2)
  const nameOk = first.trim().length >= 2
  const okStep2 = nameOk && ruleLen

  // Живой расчёт готовности профиля для верхней карточки (0% → 100%)
  const progressUnits = (idOk ? 1 : id.trim().length > 2 ? 0.5 : 0) + (nameOk ? 1 : first.trim().length > 0 ? 0.5 : 0) + (ruleLen ? 1 : pass.length > 0 ? 0.4 : 0)
  const pct = Math.min(100, Math.round((progressUnits / 3) * 100))
  const fullName = [first.trim(), last.trim()].filter(Boolean).join(' ')
  const avatarLetter = (first.trim() || 'J')[0].toUpperCase()
  const contactPreview = id.trim() ? (mode === 0 ? `${country.dial} ${id}` : id.trim()) : `${i18nTx(country.name, lang)} · ${country.dial}`

  const nextStep = () => {
    setTried(true)
    if (!idOk) return
    setTried(false)
    setStep(2)
  }

  const submit = () => {
    setTried(true)
    if (!okStep2) return
    const key = mode === 0 ? digits(id) : id.trim().toLowerCase()
    const to = mode === 0 ? `${country.dial} ${id}` : id.trim()
    const user: User = { first: first.trim(), last: last.trim(), email: mode === 1 ? id.trim() : '', phone: mode === 0 ? to : '', gender: '', birth: '' }
    localStorage.setItem(ACC, JSON.stringify([...accounts().filter((a) => a.id !== key), { id: key, pass, user }]))
    onCode(user, to)
  }

  return (
    <div className="jja-screen reg-open">
      {/* Верхний ЖИВОЙ motion-хедер: обновляется в реальном времени при вводе имени и телефона */}
      <div className="jja-hero reg">
        <div className="jja-orb a" />
        <div className="jja-orb b" />

        <HeroBar
          mini
          onBack={() => (step === 2 ? setStep(1) : onSwitchLogin())}
          onGuide={onGuide}
          guideLabel={ext.guideBtn}
          onSkip={canSkip}
          skipLabel={t.skip}
        />

        {/* Динамическое приветствие по имени */}
        <div className="jja-live-greet">
          <div className="jja-live-line">
            {first.trim() ? (
              <>
                <span className="jja-greet-hi" key={first.trim()}>{ext.regHeroHi(first.trim())}</span>
                <small>{ext.regHeroSub}</small>
              </>
            ) : (
              <>
                <span className="jja-greet-hi">{ext.regHeroDefault}</span>
                <small>{t.regSub}</small>
              </>
            )}
          </div>
          <span className={'jja-live-pct' + (pct === 100 ? ' ok' : '')}>{pct}%</span>
        </div>

        {/* Живая стеклянная карта покупателя JJ Market */}
        <div className={'jja-live-buyer' + (okStep2 ? ' ready' : idOk || nameOk ? ' active' : '')}>
          <div className="jjo-card-shine" />
          <div className="jja-lb-top">
            <span className="jja-lb-av" key={avatarLetter}>
              {avatarLetter}
              <em>{country.flag}</em>
            </span>
            <div className="jja-lb-info">
              <div className="jja-lb-head">
                <div className="jja-lb-name">
                  {fullName ? (
                    <>
                      <b>{fullName}</b>
                      <i className="jja-caret" />
                    </>
                  ) : (
                    <span className="ph">{ext.regCardPh}</span>
                  )}
                </div>
                <span className={'jja-lb-status' + (okStep2 ? ' ok' : '')}>
                  {okStep2 ? <><Check size={10} strokeWidth={3} />{ext.regCardReady}</> : ext.regCardTyping}
                </span>
              </div>
              <div className="jja-lb-sub">
                <span>{contactPreview}</span>
                <em>· JJ10 −10%</em>
              </div>
            </div>
          </div>
          <div className="jja-lb-bar">
            <i style={{ width: `${Math.max(10, pct)}%` }} className={pct === 100 ? 'ok' : ''} />
          </div>
        </div>
      </div>

      {/* Светлый лист 2-шаговой формы */}
      <div className="jja-sheet">
        <div className="jja-sheet-main">
          {/* Индикатор шагов */}
          <div className="jja-steps-bar">
            <span className={'jja-st' + (step === 1 ? ' on' : ' done')} onClick={() => setStep(1)}>
              <i>{step > 1 ? <Check size={10} strokeWidth={3} /> : '1'}</i>
              {ext.regStep1.split('·')[1]?.trim() || ext.regStep1}
            </span>
            <em className={step === 2 ? 'on' : ''} />
            <span className={'jja-st' + (step === 2 ? ' on' : '')}>
              <i>2</i>
              {ext.regStep2.split('·')[1]?.trim() || ext.regStep2}
            </span>
          </div>

          {step === 1 ? (
            <div className="jja-form-card" key="reg-s1">
              <div className="jja-seg">
                <i style={{ transform: `translateX(${mode * 100}%)` }} />
                <button type="button" className={mode === 0 ? 'on' : ''} onClick={() => { setMode(0); setId(''); setTried(false) }}>
                  <Phone size={13} />{t.phoneTab}
                </button>
                <button type="button" className={mode === 1 ? 'on' : ''} onClick={() => { setMode(1); setId(''); setTried(false) }}>
                  <Mail size={13} />{t.mailTab}
                </button>
              </div>

              {mode === 0 ? (
                <>
                  <div className="jja-co-pills">
                    {COUNTRIES.map((co) => (
                      <button
                        key={co.code}
                        type="button"
                        className={'jja-co' + (country.code === co.code ? ' on' : '')}
                        onClick={() => { setCountry(co); setId(''); setTried(false) }}
                      >
                        <span>{co.flag}</span><b>{co.dial}</b>
                      </button>
                    ))}
                  </div>
                  <div className={'jja-inp' + (tried && !idOk ? ' err' : idOk ? ' ok' : '')}>
                    <span className="jja-prefix">{country.dial}</span>
                    <input
                      autoFocus
                      inputMode="tel"
                      placeholder={phoneLen === 9 ? '90 123 45 67' : '700 000-00-00'}
                      value={id}
                      onChange={(e) => setId(maskPhone(e.target.value, phoneLen))}
                      onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    />
                    {idOk && <Check size={15} color="#16A34A" strokeWidth={2.8} />}
                  </div>
                </>
              ) : (
                <div className={'jja-inp' + (tried && !idOk ? ' err' : idOk ? ' ok' : '')}>
                  <span className="jja-ic"><Mail size={15} /></span>
                  <input
                    autoFocus
                    inputMode="email"
                    placeholder="name@example.com"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  />
                  {idOk && <Check size={15} color="#16A34A" strokeWidth={2.8} />}
                </div>
              )}

              <div className="jja-perks">
                <span><Gift size={12} />JJ10 −10%</span>
                <span><MessageCircle size={12} />{ext.sellerChats}</span>
                <span><Package size={12} />{ext.profStatsOrders}</span>
              </div>

              <button type="button" className={'jja-btn' + (idOk ? ' shine' : ' dis')} onClick={nextStep}>
                <span>{ext.regContinue}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="jja-form-card" key="reg-s2">
              <div className="jja-contact-chip">
                <div>
                  <Check size={13} color="#16A34A" strokeWidth={3} />
                  <span>{mode === 0 ? `${country.flag} ${country.dial} ${id}` : id}</span>
                </div>
                <button type="button" onClick={() => setStep(1)}>{ext.regChangeContact}</button>
              </div>

              <div className="jja-row2">
                <div className={'jja-inp' + (tried && !nameOk ? ' err' : nameOk ? ' ok' : '')}>
                  <input
                    autoFocus
                    placeholder={t.firstName}
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="jja-inp">
                  <input
                    placeholder={t.lastName}
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className={'jja-inp' + (tried && !ruleLen ? ' err' : ruleLen ? ' ok' : '')} style={{ marginTop: 9 }}>
                <input
                  type={show ? 'text' : 'password'}
                  placeholder={t.newPass}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <button type="button" className="jja-eye" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {pass.length > 0 && (
                <div className="pass-meter">
                  <div className="pm-bars">
                    {[1, 2, 3].map((lvl) => <i key={lvl} className={strength >= lvl ? `s${strength}` : ''} />)}
                  </div>
                  <small className={`s${strength}`}>{ext.passStrength[strength - 1]}</small>
                </div>
              )}

              <div className="pass-rules">
                <span className={ruleLen ? 'ok' : ''}><Check size={11} strokeWidth={3} />{ext.regRules[0]}</span>
                <span className={ruleNum ? 'ok' : ''}><Check size={11} strokeWidth={3} />{ext.regRules[1]}</span>
                <span className={ruleCap ? 'ok' : ''}><Check size={11} strokeWidth={3} />{ext.regRules[2]}</span>
              </div>

              <button type="button" className={'jja-btn' + (okStep2 ? ' shine' : ' dis')} onClick={submit} style={{ marginTop: 12 }}>
                <span>{t.register}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>

        <div className="jja-sheet-foot">
          {step === 1 && (
            <>
              <div className="jja-or"><span>{ext.orContinue}</span></div>
              <div className="jja-soc-grid">
                <button type="button" className="jja-soc g" onClick={() => onSocial('Google')}>
                  <img src="/brand/google.svg" alt="" /><span>Google</span>
                </button>
                <button type="button" className="jja-soc a" onClick={() => onSocial('Apple')}>
                  <img src="/brand/apple.svg" alt="" /><span>Apple</span>
                </button>
              </div>
            </>
          )}
          <div className="jja-foot-line">
            {t.haveAcc} <button type="button" onClick={onSwitchLogin}>{t.signIn}</button>
          </div>
          <Consent />
        </div>
      </div>
    </div>
  )
}

/* ---------- 3. ПОДТВЕРЖДЕНИЕ OTP ---------- */
function Code({
  to, fromReg, onBack, onOk,
}: {
  to: string; fromReg: boolean; onBack: () => void; onOk: () => void
}) {
  const { t, toast } = useApp()
  const [c, setC] = useState('')
  const [err, setErr] = useState(false)
  const [left, setLeft] = useState(59)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => { if (left <= 0) return; const x = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(x) }, [left])

  const check = (v: string) => {
    if (v.length < 4 || busy) return
    setBusy(true)
    setTimeout(() => {
      if (v === '1234') onOk()
      else { setBusy(false); setErr(true); setC('') }
    }, 320)
  }

  return (
    <div className="jja-screen reg-open" key="otp-view">
      <div className="jja-hero otp-hero">
        <div className="jja-orb a" />
        <HeroBar mini onBack={onBack} />
        <div className="jja-otp-ic"><ShieldCheck size={26} /></div>
        <div className="jja-otp-copy">
          <h1>{t.codeTitle}</h1>
          <p>{t.codeSub(to)}</p>
          <span className="jja-to-chip">{to}</span>
        </div>
      </div>

      <div className="jja-sheet otp-sheet">
        <div className="jja-sheet-main">
          {fromReg && (
            <div className="jja-otp-hint">
              <Sparkles size={13} />
              <span>{t.ext.regCardPromo}</span>
            </div>
          )}

          <label className={'jja-otp' + (err ? ' err' : '')}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={(c.length === i ? 'cur ' : '') + (c[i] ? 'fill' : '')}>{c[i] ?? ''}</span>
            ))}
            <input
              ref={ref}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={c}
              onChange={(e) => {
                const v = digits(e.target.value).slice(0, 4)
                setErr(false)
                setC(v)
                check(v)
              }}
            />
          </label>

          {err && <div className="jja-err center"><CircleAlert size={14} />{t.codeBad}</div>}

          <button type="button" className="jja-demo-otp" onClick={() => { setC('1234'); check('1234') }}>
            <Sparkles size={14} />{t.codeDemo}
          </button>

          <button type="button" className={'jja-btn' + (c.length === 4 ? ' shine' : ' dis')} onClick={() => check(c)}>
            {busy ? <Loader2 size={19} className="spinning" /> : <><span>{t.confirm}</span><ArrowRight size={16} /></>}
          </button>

          <button
            type="button"
            className="jja-resend"
            disabled={left > 0}
            onClick={() => { setLeft(59); toast(t.sent) }}
          >
            {left > 0 ? t.resendIn(left) : t.resend}
          </button>
        </div>
      </div>
    </div>
  )
}
