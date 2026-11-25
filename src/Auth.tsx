import { useEffect, useRef, useState } from 'react'
import { X, Eye, EyeOff, Globe, ChevronLeft, CircleAlert, Loader2, CircleCheck, Sparkles, Check, ShieldCheck } from 'lucide-react'
import { useApp, type User } from './store'
import { Seg, Sheet, LangSheet } from './ui'
import { COUNTRIES, type CountryInfo } from './geo'
import { LANGS } from './i18n'

/* ---------- Заставка ---------- */
export function Splash() {
  return <div className="splash"><img src="/brand/JJ_logo_full_purple.svg" alt="JJ Market" /></div>
}

/* ---------- Онбординг ---------- */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useApp()
  const [i, setI] = useState(0)
  const last = i === t.onb.length - 1
  return (
    <div className="onb">
      <div className="onb-top">
        <div className="onb-bars">{t.onb.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}</div>
        <button className="onb-x" onClick={onDone} aria-label="Close"><X size={14} /></button>
      </div>
      <div className="onb-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {t.onb.map((sl, k) => (
          <div className="onb-slide" key={k}>
            <h2>{sl.t}</h2>
            <p>{sl.s}</p>
            <img src={`/assets/onb${k + 1}.png`} alt="" />
          </div>
        ))}
      </div>
      <div className="onb-foot"><button className="btn" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? t.start : t.next}</button></div>
    </div>
  )
}

/* ---------- Вход и Регистрация с нуля (Apple-эстетика + 4 страны UZ/KZ/RU/KG + анимации) ---------- */
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
  return <p className="consent">{t.consent[0]}<a onClick={() => push('doc', 'privacy')}>{t.consent[1]}</a>{t.consent[2]}<a onClick={() => push('doc', 'offer')}>{t.consent[3]}</a>{t.consent[4]}</p>
}

function DialPicker({ value, onChange }: { value: CountryInfo; onChange: (c: CountryInfo) => void }) {
  const { sheet, lang, t } = useApp()
  return (
    <button
      type="button"
      className="cc-btn"
      onClick={() =>
        sheet(
          <Sheet title={t.homeUI.selectCountry}>
            {COUNTRIES.map((co) => (
              <button
                key={co.code}
                className={'opt' + (co.code === value.code ? ' on' : '')}
                onClick={() => { onChange(co); sheet(null) }}
              >
                <span className="opt-l">
                  <span style={{ fontSize: 19 }}>{co.flag}</span>
                  <span>{co.name[lang]} <small style={{ display: 'inline', marginLeft: 4 }}>{co.dial}</small></span>
                </span>
                {co.code === value.code && <Check size={17} />}
              </button>
            ))}
          </Sheet>,
        )
      }
    >
      <span>{value.flag}</span>
      <b>{value.dial}</b>
    </button>
  )
}

function SocialSheet({ provider, onOk }: { provider: 'Apple' | 'Google'; onOk: () => void }) {
  const { t, sheet } = useApp()
  const [st, setSt] = useState<0 | 1 | 2>(0)
  const go = () => { setSt(1); setTimeout(() => setSt(2), 750); setTimeout(() => { sheet(null); onOk() }, 1250) }
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

export function Login({ onDone, canSkip, initialView = 'login' }: { onDone: (u: User) => void; canSkip?: () => void; initialView?: 'login' | 'reg' }) {
  const { t, s, sheet } = useApp()
  const [view, setView] = useState<'login' | 'reg' | 'code'>(initialView)
  const [mode, setMode] = useState(0)
  const [country, setCountry] = useState<CountryInfo>(COUNTRIES[1]) // KZ default, switchable to UZ/RU/KG
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ user: User; to: string } | null>(null)

  const phoneLen = country.code === 'UZ' || country.code === 'KG' ? 9 : 10
  const isAdmin = id.trim().toLowerCase() === 'admin'
  const idOk = isAdmin || (mode === 0 ? digits(id).length === phoneLen : /.+@.+\..+/.test(id))
  const ready = idOk && pass.length > 0
  const short = LANGS.find((l) => l.code === s.lang)?.short

  const submit = () => {
    if (!ready || busy) return
    setBusy(true); setErr(false)
    setTimeout(() => {
      const key = mode === 0 && !isAdmin ? digits(id) : id.trim().toLowerCase()
      const acc = accounts().find((a) => a.id === key && a.pass === pass)
      if (isAdmin && pass === 'admin') onDone(DEMO_USER)
      else if (acc) onDone(acc.user)
      else { setBusy(false); setErr(true) }
    }, 550)
  }

  if (view === 'reg') return <Register onBack={() => setView('login')} onCode={(user, to) => { setPending({ user, to }); setView('code') }} />
  if (view === 'code' && pending) return <Code to={pending.to} onBack={() => setView(pending.user.first ? 'reg' : 'login')} onOk={() => onDone(pending.user.first ? pending.user : { ...DEMO_USER, phone: pending.to })} />

  return (
    <div className="auth auth-anim" key="login-view">
      <div className="auth-top">
        <button className="lang-pill" onClick={() => sheet(<LangSheet />)}><Globe size={14} />{short}</button>
        {canSkip && <button className="skip" onClick={canSkip}>{t.skip}</button>}
      </div>

      <div className="auth-brand-hero">
        <span className="abh-ic"><img src="/brand/JJ_symbol_white.svg" alt="JJ" /></span>
        <div>
          <h1>{mode === 0 ? t.login : t.loginMailTitle}</h1>
          <p>{mode === 0 ? t.loginSubPhone : t.loginSubMail}</p>
        </div>
      </div>

      <Seg items={[t.phoneTab, t.mailTab]} value={mode} onChange={(i) => { setMode(i); setId(''); setErr(false) }} />

      <form onSubmit={(e) => { e.preventDefault(); submit() }}>
        {mode === 0 ? (
          <div className="phone-row">
            <DialPicker value={country} onChange={(co) => { setCountry(co); setId('') }} />
            <div className={'inp' + (err ? ' err' : '')}>
              <input
                inputMode={/[a-z]/i.test(id) ? 'text' : 'tel'}
                placeholder={phoneLen === 9 ? '90 123 45 67' : '700 000-00-00'}
                value={id}
                autoComplete="tel"
                onChange={(e) => { const v = e.target.value; setErr(false); setId(/[a-z]/i.test(v) ? v.slice(0, 5) : maskPhone(v, phoneLen)) }}
              />
            </div>
          </div>
        ) : (
          <div className={'inp' + (err ? ' err' : '')}>
            <input inputMode="email" placeholder={t.mailTab} value={id} autoComplete="username" onChange={(e) => { setErr(false); setId(e.target.value) }} />
          </div>
        )}
        <div className={'inp' + (err ? ' err' : '')}>
          <input type={show ? 'text' : 'password'} placeholder={t.password} value={pass} autoComplete="current-password" onChange={(e) => { setErr(false); setPass(e.target.value) }} />
          <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Show">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {err && <div className="err-line"><CircleAlert size={14} />{t.badLogin}</div>}
        <div className="right-link"><button type="button" onClick={() => sheet(<ResetSheet />)}>{t.forgot}</button></div>
        <button className={'btn' + (ready ? '' : ' dis')} type="submit">{busy ? <Loader2 size={20} className="spinning" /> : t.signIn}</button>
      </form>

      {mode === 0 && (
        <button className="ghost" disabled={digits(id).length !== phoneLen} onClick={() => { setPending({ user: { ...DEMO_USER, first: '' }, to: `${country.dial} ${id}` }); setView('code') }}>
          {t.smsLogin}
        </button>
      )}

      <button className="demo-chip" onClick={() => { setMode(0); setId('admin'); setPass('admin'); setErr(false) }}>
        <Sparkles size={14} />{t.demo}
      </button>

      <div className="auth-divider"><span>{t.ext.orContinue}</span></div>

      <div className="auth-soc-grid">
        <button className="soc apple-dark" onClick={() => sheet(<SocialSheet provider="Apple" onOk={() => onDone(DEMO_USER)} />)}>
          <img src="/brand/apple.svg" alt="" style={{ filter: 'invert(1)' }} />Apple
        </button>
        <button className="soc" onClick={() => sheet(<SocialSheet provider="Google" onOk={() => onDone(DEMO_USER)} />)}>
          <img src="/brand/google.svg" alt="" />Google
        </button>
      </div>

      <Consent />
      <div className="auth-foot">{t.noAcc} <button onClick={() => setView('reg')}>{t.register}</button></div>
    </div>
  )
}

function Register({ onBack, onCode }: { onBack: () => void; onCode: (u: User, to: string) => void }) {
  const { t } = useApp()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [mode, setMode] = useState(0)
  const [country, setCountry] = useState<CountryInfo>(COUNTRIES[0]) // UZ default or switchable
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [tried, setTried] = useState(false)

  const phoneLen = country.code === 'UZ' || country.code === 'KG' ? 9 : 10
  const idOk = mode === 0 ? digits(id).length === phoneLen : /.+@.+\..+/.test(id)
  const ok = first.trim().length > 1 && idOk && pass.length >= 6

  // Индикатор надёжности пароля (Apple-уровень UX)
  const strength = pass.length === 0 ? 0 : pass.length < 6 ? 1 : (/[A-ZА-Я]/.test(pass) && /\d/.test(pass) && pass.length >= 8 ? 3 : 2)

  const submit = () => {
    setTried(true)
    if (!ok) return
    const key = mode === 0 ? digits(id) : id.trim().toLowerCase()
    const to = mode === 0 ? `${country.dial} ${id}` : id.trim()
    const user: User = { first: first.trim(), last: last.trim(), email: mode === 1 ? id.trim() : '', phone: mode === 0 ? to : '', gender: '', birth: '' }
    localStorage.setItem(ACC, JSON.stringify([...accounts().filter((a) => a.id !== key), { id: key, pass, user }]))
    onCode(user, to)
  }

  return (
    <div className="auth auth-anim" key="reg-view">
      <div className="auth-top">
        <button className="back-btn" onClick={onBack}><ChevronLeft size={21} /></button>
        <span className="reg-step-pill"><ShieldCheck size={13} />JJ ID</span>
      </div>

      <div className="auth-brand-hero compact">
        <div>
          <h1>{t.regTitle}</h1>
          <p>{t.regSub}</p>
        </div>
      </div>

      <div className="reg-name-grid">
        <div className={'inp' + (tried && first.trim().length < 2 ? ' err' : '')}>
          <input placeholder={t.firstName} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" />
        </div>
        <div className="inp">
          <input placeholder={t.lastName} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
        </div>
      </div>

      <Seg items={[t.phoneTab, t.mailTab]} value={mode} onChange={(i) => { setMode(i); setId('') }} />

      {mode === 0 ? (
        <div className="phone-row">
          <DialPicker value={country} onChange={(co) => { setCountry(co); setId('') }} />
          <div className={'inp' + (tried && !idOk ? ' err' : '')}>
            <input inputMode="tel" placeholder={phoneLen === 9 ? '90 123 45 67' : '700 000-00-00'} value={id} onChange={(e) => setId(maskPhone(e.target.value, phoneLen))} />
          </div>
        </div>
      ) : (
        <div className={'inp' + (tried && !idOk ? ' err' : '')}>
          <input inputMode="email" placeholder={t.mailTab} value={id} onChange={(e) => setId(e.target.value)} />
        </div>
      )}

      <div className={'inp' + (tried && pass.length < 6 ? ' err' : '')}>
        <input type={show ? 'text' : 'password'} placeholder={t.newPass} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
        <button type="button" className="eye" onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>

      {pass.length > 0 && (
        <div className="pass-meter">
          <div className="pm-bars">
            {[1, 2, 3].map((lvl) => (
              <i key={lvl} className={strength >= lvl ? `s${strength}` : ''} />
            ))}
          </div>
          <small className={`s${strength}`}>{t.ext.passStrength[strength - 1]}</small>
        </div>
      )}

      <button className={'btn' + (ok ? '' : ' dis')} onClick={submit} style={{ marginTop: 12 }}>
        {t.register}
      </button>
      <Consent />
      <div className="auth-foot">{t.haveAcc} <button onClick={onBack}>{t.signIn}</button></div>
    </div>
  )
}

function Code({ to, onBack, onOk }: { to: string; onBack: () => void; onOk: () => void }) {
  const { t, toast } = useApp()
  const [c, setC] = useState('')
  const [err, setErr] = useState(false)
  const [left, setLeft] = useState(59)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => { if (left <= 0) return; const x = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(x) }, [left])
  const check = (v: string) => { if (v.length === 4) setTimeout(() => (v === '1234' ? onOk() : (setErr(true), setC(''))), 300) }
  return (
    <div className="auth auth-anim" key="otp-view">
      <div className="auth-top"><button className="back-btn" onClick={onBack}><ChevronLeft size={21} /></button></div>
      <div className="auth-brand-hero compact">
        <div>
          <h1>{t.codeTitle}</h1>
          <p>{t.codeSub(to)}</p>
        </div>
      </div>
      <label className={'otp' + (err ? ' err' : '')}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={(c.length === i ? 'cur ' : '') + (c[i] ? 'fill' : '')}>{c[i] ?? ''}</span>)}
        <input ref={ref} inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={c} onChange={(e) => { const v = digits(e.target.value).slice(0, 4); setErr(false); setC(v); check(v) }} />
      </label>
      {err && <div className="err-line center"><CircleAlert size={14} />{t.codeBad}</div>}
      <button className="demo-chip" onClick={() => { setC('1234'); check('1234') }}><Sparkles size={14} />{t.codeDemo}</button>
      <button className={'btn' + (c.length === 4 ? '' : ' dis')} onClick={() => check(c)}>{t.confirm}</button>
      <button className="ghost" disabled={left > 0} onClick={() => { setLeft(59); toast(t.sent) }}>{left > 0 ? t.resendIn(left) : t.resend}</button>
    </div>
  )
}
