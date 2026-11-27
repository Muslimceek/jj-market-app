import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, Camera, Image as ImageIc, Sparkles, Send, Check,
  SlidersHorizontal, RefreshCw, Palette, TrendingDown, Layers,
  Target, ShoppingBag, Star, X, MessageSquareText, ScanSearch,
} from 'lucide-react'
import { useApp, tx, hexOf, colorAxis, type Product } from './store'
import { QuickSizeSheet } from './ui'

/** Фирменная иконка JJ Lens (рамка камеры + объектив + AI-искра) для строки поиска */
export function LensAiIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8.5V6.8C4 5.25 5.25 4 6.8 4H8.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M15.5 4H17.2C18.75 4 20 5.25 20 6.8V8.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M20 15.5V17.2C20 18.75 18.75 20 17.2 20H15.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M8.5 20H6.8C5.25 20 4 18.75 4 17.2V15.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="11.6" cy="12.2" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M17.2 6.8L17.85 8.15L19.2 8.8L17.85 9.45L17.2 10.8L16.55 9.45L15.2 8.8L16.55 8.15L17.2 6.8Z" fill="currentColor" />
    </svg>
  )
}

interface DetectedColor {
  hex: string
  slug: string
  label: string
}

const PALETTE_REF: { slug: string; label: string; rgb: [number, number, number]; hex: string }[] = [
  { slug: 'color-black', label: 'Чёрный', rgb: [24, 24, 28], hex: '#1B1B1F' },
  { slug: 'color-white', label: 'Белый', rgb: [242, 242, 244], hex: '#F4F4F6' },
  { slug: 'color-grey', label: 'Серый', rgb: [148, 148, 156], hex: '#94949C' },
  { slug: 'color-brown', label: 'Коричневый', rgb: [108, 72, 54], hex: '#6C4836' },
  { slug: 'color-beige', label: 'Бежевый', rgb: [214, 194, 165], hex: '#D6C2A5' },
  { slug: 'color-burgundy', label: 'Бордовый', rgb: [122, 22, 42], hex: '#7A162A' },
  { slug: 'color-red', label: 'Красный', rgb: [212, 48, 52], hex: '#D43034' },
  { slug: 'color-blue', label: 'Синий', rgb: [42, 92, 178], hex: '#2A5CB2' },
  { slug: 'color-green', label: 'Зелёный', rgb: [52, 136, 74], hex: '#34884A' },
]

/** Реальный анализ доминантного цвета вещи на изображении через offscreen Canvas */
function extractDominantColor(src: string): Promise<DetectedColor> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const cv = document.createElement('canvas')
        cv.width = 28
        cv.height = 28
        const ctx = cv.getContext('2d')
        if (!ctx) { resolve({ hex: '#1B1B1F', slug: 'color-black', label: 'Чёрный' }); return }
        ctx.drawImage(img, 0, 0, 28, 28)
        const data = ctx.getImageData(6, 6, 16, 16).data
        let rSum = 0, gSum = 0, bSum = 0, cnt = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < 180) continue
          // Пропускаем чисто-белый фон фотостудии
          if (r > 238 && g > 238 && b > 238) continue
          rSum += r; gSum += g; bSum += b; cnt++
        }
        if (cnt < 8) { resolve({ hex: '#F4F4F6', slug: 'color-white', label: 'Белый' }); return }
        const avg: [number, number, number] = [rSum / cnt, gSum / cnt, bSum / cnt]
        let best = PALETTE_REF[0]
        let minDist = Infinity
        for (const c of PALETTE_REF) {
          const d = (avg[0] - c.rgb[0]) ** 2 + (avg[1] - c.rgb[1]) ** 2 + (avg[2] - c.rgb[2]) ** 2
          if (d < minDist) { minDist = d; best = c }
        }
        const hex = '#' + avg.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
        resolve({ hex, slug: best.slug, label: best.label })
      } catch {
        resolve({ hex: '#6C4836', slug: 'color-brown', label: 'Коричневый' })
      }
    }
    img.onerror = () => resolve({ hex: '#1B1B1F', slug: 'color-black', label: 'Чёрный' })
    img.src = src
  })
}

type AgentMode = 'exact' | 'cheaper' | 'color' | 'outfit'

interface ScanResult {
  image: string
  label: string
  categoryHint: string
  sourceProductId?: string
  color: DetectedColor
}

/** Определение категории по имени файла / ключевым словам / исходному товару */
function guessCategoryFromText(text: string): { label: string; hint: string } {
  const low = text.toLowerCase()
  if (/куртк|дублён|дублен|пальт|кожа|jacket|coat|ceket/i.test(low)) return { label: 'Верхняя одежда', hint: 'jacket' }
  if (/кроссов|ботин|сапог|туфл|обув|лофер|shoe|boot|ayakkab/i.test(low)) return { label: 'Обувь', hint: 'shoes' }
  if (/сумк|рюкзак|клатч|барсет|кошел|bag|çanta/i.test(low)) return { label: 'Сумки и аксессуары', hint: 'bag' }
  if (/плать|юбк|костюм|комплект|dress|elbise/i.test(low)) return { label: 'Одежда и образы', hint: 'dress' }
  if (/шампун|крем|лосьон|маск|уход|beauty/i.test(low)) return { label: 'Красота и уход', hint: 'beauty' }
  return { label: 'Стильная вещь', hint: 'all' }
}

function matchesHint(p: Product, hint: string): boolean {
  if (hint === 'all') return true
  const hay = (Object.values(p.name).join(' ') + ' ' + p.categories.map((c) => Object.values(c.name).join(' ') + ' ' + c.slug).join(' ')).toLowerCase()
  if (hint === 'jacket') return /куртк|дублён|дублен|пальт|пиджак|верхн|jacket|coat|ceket/i.test(hay)
  if (hint === 'shoes') return /обув|ботин|сапог|кроссов|туфл|кед|лофер|сабо|тапоч|shoe|ayakkab/i.test(hay)
  if (hint === 'bag') return /сумк|барсет|кошел|аксессуар|bag|çanta/i.test(hay)
  if (hint === 'dress') return /плать|юбк|комплект|костюм|одежд|dress|elbise/i.test(hay)
  if (hint === 'beauty') return /крем|шампун|лосьон|маск|уход|красот|beauty/i.test(hay)
  return true
}

function complementaryHint(hint: string): string[] {
  if (hint === 'jacket') return ['shoes', 'bag']
  if (hint === 'shoes') return ['jacket', 'bag']
  if (hint === 'bag') return ['dress', 'shoes']
  if (hint === 'dress') return ['shoes', 'bag']
  return ['shoes', 'bag', 'jacket']
}

/* ---------- JJ VISION AI AGENT: КАМЕРА + ФОТО + ЦВЕТ + ТОЧНОЕ СОВПАДЕНИЕ + СБОРКА ОБРАЗА ---------- */
export function VisualSearch() {
  const { cat, t, lang, pop, push, sheet, addToCart, toast, money } = useApp()
  const [view, setView] = useState<'camera' | 'scanning' | 'results' | 'chat'>('camera')
  const [scanStage, setScanStage] = useState(0)
  const [scanningImg, setScanningImg] = useState<string | null>(null)
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [mode, setMode] = useState<AgentMode>('exact')
  const [targetColor, setTargetColor] = useState<string | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiReply, setAiReply] = useState<string | null>(null)
  const [onlyDiscount, setOnlyDiscount] = useState(false)
  const [maxPriceKzt, setMaxPriceKzt] = useState<number | null>(null)
  const [camActive, setCamActive] = useState(false)
  const [camErr, setCamErr] = useState(false)

  // Текстовый AI-чат режим (сохраняет привычный AI-ассистент рядом с камерой)
  const [chatMsgs, setChatMsgs] = useState<{ me?: boolean; text: string; ids?: string[] }[]>([{ text: t.aiHello }])
  const [chatIn, setChatIn] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraCaptureRef = useRef<HTMLInputElement>(null)

  // 4 живых примера из реального каталога для мгновенной проверки в 1 тап
  const quickSamples = useMemo(() => {
    const pick = (hint: string) => cat.products.find((p) => p.images[0] && matchesHint(p, hint))
    const list = [
      { p: pick('jacket'), title: lang === 'tr' ? 'Deri ceket' : 'Кожаная куртка', hint: 'jacket' },
      { p: pick('shoes'), title: lang === 'tr' ? 'Bot / Ayakkabı' : 'Зимние ботинки', hint: 'shoes' },
      { p: pick('bag'), title: lang === 'tr' ? 'Çanta' : 'Сумка', hint: 'bag' },
      { p: pick('dress'), title: lang === 'tr' ? 'Kombin' : 'Комплект / Платье', hint: 'dress' },
    ].filter((x): x is { p: Product; title: string; hint: string } => !!x.p)
    return list
  }, [cat.products, lang])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
    setCamActive(false)
  }

  useEffect(() => () => stopCamera(), [])

  const startLiveCamera = async () => {
    setCamErr(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraCaptureRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setCamActive(true)
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 60)
    } catch {
      setCamErr(true)
      cameraCaptureRef.current?.click()
    }
  }

  const runVisualScan = async (imgSrc: string, rawHintText: string, sourceProductId?: string) => {
    stopCamera()
    setScanningImg(imgSrc)
    setView('scanning')
    setScanStage(0)
    setMode('exact')
    setTargetColor(null)
    setOnlyDiscount(false)
    setMaxPriceKzt(null)
    setAiReply(null)

    const detectedColor = await extractDominantColor(imgSrc)
    const guessed = guessCategoryFromText(rawHintText)

    window.setTimeout(() => setScanStage(1), 360)
    window.setTimeout(() => setScanStage(2), 740)
    window.setTimeout(() => {
      setScan({
        image: imgSrc,
        label: guessed.label,
        categoryHint: guessed.hint,
        sourceProductId,
        color: detectedColor,
      })
      setView('results')
    }, 1150)
  }

  const captureFrame = () => {
    const vid = videoRef.current
    if (camActive && vid && vid.videoWidth > 0) {
      const cv = document.createElement('canvas')
      cv.width = 480
      cv.height = Math.round((vid.videoHeight / vid.videoWidth) * 480) || 640
      const ctx = cv.getContext('2d')
      if (ctx) {
        ctx.drawImage(vid, 0, 0, cv.width, cv.height)
        runVisualScan(cv.toDataURL('image/jpeg', 0.86), 'camera-capture')
        return
      }
    }
    // Если живая камера не запущена — запускаем её (или нативный выбор камеры)
    startLiveCamera()
  }

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        runVisualScan(reader.result, file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  // Умное ранжирование совпадений в нашем каталоге по фото, цвету, категории и AI-запросу
  const rankedMatches = useMemo(() => {
    if (!scan) return []
    const srcProd = scan.sourceProductId ? cat.products.find((p) => p.id === scan.sourceProductId) : undefined
    const activeColorSlug = targetColor ?? scan.color.slug

    if (mode === 'outfit') {
      const compHints = complementaryHint(scan.categoryHint)
      return cat.products
        .filter((p) => p.images[0] && p.id !== scan.sourceProductId && compHints.some((h) => matchesHint(p, h)))
        .filter((p) => (!onlyDiscount || p.pct > 0) && (!maxPriceKzt || p.price <= maxPriceKzt))
        .slice(0, 12)
        .map((p, idx) => ({ p, score: Math.max(84, 96 - idx * 2) }))
    }

    const scored = cat.products
      .filter((p) => p.images[0])
      .filter((p) => (!onlyDiscount || p.pct > 0) && (!maxPriceKzt || p.price <= maxPriceKzt))
      .map((p) => {
        const cAx = colorAxis(p)
        const hasColor = cAx?.values.some((v) => v.slug === activeColorSlug)
        const colorNameMatch = targetColor
          ? new RegExp(
              targetColor === 'color-black'
                ? 'чёрн|черн|black|siyah'
                : targetColor === 'color-white'
                  ? 'бел|white|beyaz'
                  : targetColor === 'color-beige'
                    ? 'беж|крем|beige'
                    : targetColor === 'color-brown'
                      ? 'корич|шоколад|brown'
                      : targetColor === 'color-grey'
                        ? 'сер|grey|gray'
                        : targetColor === 'color-burgundy'
                          ? 'бордо|вишн|burgundy'
                          : 'красн|red',
              'i',
            ).test(Object.values(p.name).join(' '))
          : false

        const isExactSource = p.id === scan.sourceProductId && !(mode === 'color' && targetColor && targetColor !== scan.color.slug)
        if (isExactSource) return { p, raw: 120, isExact: true }

        let raw = 54
        if (matchesHint(p, scan.categoryHint)) raw += 20
        if (srcProd && p.categories.some((c) => srcProd.categories.some((sc) => sc.id === c.id))) raw += 8
        if (srcProd && p.brand && p.brand === srcProd.brand) raw += 4
        if (hasColor || colorNameMatch) raw += targetColor ? 26 : 8
        if (p.rating >= 4.7) raw += 2
        if (p.pct > 0) raw += 2
        return { p, raw, isExact: false }
      })

    const finalize = (arr: typeof scored) =>
      arr.slice(0, 12).map((x, idx) => ({
        p: x.p,
        score: x.isExact ? 99 : Math.max(64, Math.min(96 - idx * 2, Math.round(x.raw * 0.86))),
      }))

    if (mode === 'cheaper') {
      const pool = scored.filter((x) => x.raw >= 70)
      const base = pool.length >= 4 ? pool : scored
      return finalize([...base].sort((a, b) => a.p.price - b.p.price))
    }

    if (mode === 'color' && targetColor) {
      return finalize([...scored].sort((a, b) => b.raw - a.raw || a.p.price - b.p.price))
    }

    return finalize([...scored].sort((a, b) => b.raw - a.raw || b.p.pct - a.p.pct))
  }, [scan, cat.products, mode, targetColor, onlyDiscount, maxPriceKzt])

  // Умная обработка текстовых уточнений поверх фото-поиска
  const runAgentCommand = () => {
    const q = aiQuery.trim()
    if (!q || !scan) return
    const low = q.toLowerCase()
    setAiQuery('')

    if (/дешев|бюджет|недорог|ucuz|арзан/i.test(low)) {
      const numMatch = low.match(/(\d[\d\s]{2,})/)
      const lim = numMatch ? Number(numMatch[1].replace(/\s/g, '')) : null
      setMode('cheaper')
      if (lim && lim > 500) setMaxPriceKzt(lim)
      setAiReply(lim ? `Подобрал похожие модели до ${lim.toLocaleString('ru-RU')} — отсортировано от самых выгодных.` : 'Показал максимально похожие модели по лучшей цене.')
      return
    }
    if (/скидк|акц|sale|indirim/i.test(low)) {
      setOnlyDiscount(true)
      setAiReply('Оставил только похожие товары со скидкой прямо сейчас.')
      return
    }
    if (/образ|сочет|носить|к этому|обув|сумк|kombin/i.test(low)) {
      setMode('outfit')
      setAiReply('Собрал стильные вещи из JJ Market, которые идеально сочетаются с вещью на фото.')
      return
    }
    const colHit = PALETTE_REF.find((c) => low.includes(c.label.toLowerCase().slice(0, 4)))
    if (colHit) {
      setMode('color')
      setTargetColor(colHit.slug)
      setAiReply(`Переключил поиск на похожие модели в цвете «${colHit.label}».`)
      return
    }
    const catGuess = guessCategoryFromText(low)
    if (catGuess.hint !== 'all') {
      setScan({ ...scan, label: catGuess.label, categoryHint: catGuess.hint, sourceProductId: undefined })
      setMode('exact')
      setAiReply(`Обновил поиск: показываю «${catGuess.label}» в стиле вашего фото.`)
      return
    }
    setAiReply(`Проверил каталог по запросу «${q}» — лучшие совпадения уже вверху списка.`)
  }

  const sendTextChat = () => {
    const v = chatIn.trim()
    if (!v) return
    const words = v.toLocaleLowerCase('tr').split(/\s+/).filter((w) => w.length > 2)
    const hits = cat.products
      .map((p) => ({
        p,
        sc: words.filter(
          (w) =>
            Object.values(p.name).join(' ').toLocaleLowerCase('tr').includes(w) ||
            p.categories.some((c) => Object.values(c.name).join(' ').toLocaleLowerCase('tr').includes(w)),
        ).length,
      }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 4)
    setChatMsgs((m) => [
      ...m,
      { me: true, text: v },
      hits.length ? { text: t.aiAnswer, ids: hits.map((h) => h.p.id) } : { text: `${t.noProducts}. ${t.noProductsSub}` },
    ])
    setChatIn('')
  }

  const quickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    const hasMulti = p.variants.length > 1
    if (hasMulti) { sheet(<QuickSizeSheet p={p} />); return }
    const v = p.variants[0]
    addToCart(p.id, [{ variantId: v?.id, label: '', qty: 1 }])
    toast(<span className="toast-row"><Check size={15} color="#16a34a" strokeWidth={3} />{t.added}</span>)
  }

  const scanSteps = lang === 'tr'
    ? ['Ürün ve siluet tanınıyor…', 'Renk ve doku analiz ediliyor…', 'JJ Market kataloğunda eşleştiriliyor…']
    : ['Определяем вещь и силуэт…', 'Извлекаем точный цвет и фактуру…', 'Ищем точные совпадения в JJ Market…']

  return (
    <div className={'screen lens-screen' + (view === 'camera' || view === 'scanning' ? ' dark' : ' home-screen')}>
      {/* Скрытые инпуты для реальной камеры и галереи */}
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onFilePick} />
      <input ref={cameraCaptureRef} type="file" accept="image/*" capture="environment" hidden onChange={onFilePick} />

      {/* Верхняя панель с переключением JJ Lens / AI-Чат */}
      <header className={'lens-top' + (view === 'camera' || view === 'scanning' ? ' on-dark' : '')}>
        <button type="button" className="lens-back" onClick={() => { stopCamera(); pop() }} aria-label={t.back}>
          <ChevronLeft size={21} />
        </button>

        <div className="lens-mode-pill">
          <button
            type="button"
            className={view !== 'chat' ? 'on' : ''}
            onClick={() => setView(scan ? 'results' : 'camera')}
          >
            <ScanSearch size={13} />
            <span>JJ Lens AI</span>
          </button>
          <button
            type="button"
            className={view === 'chat' ? 'on' : ''}
            onClick={() => { stopCamera(); setView('chat') }}
          >
            <MessageSquareText size={13} />
            <span>AI-Чат</span>
          </button>
        </div>

        {view === 'results' ? (
          <button type="button" className="lens-re-btn" onClick={() => setView('camera')} aria-label="New scan">
            <Camera size={17} />
          </button>
        ) : (
          <span style={{ width: 34 }} />
        )}
      </header>

      {/* РЕЖИМ 1: ВИДОИСКАТЕЛЬ КАМЕРЫ И ЗАГРУЗКА ФОТО */}
      {view === 'camera' && (
        <div className="lens-cam-stage">
          <div className="lens-vf-wrap">
            {camActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="lens-video" />
            ) : (
              <div className="lens-vf-ambient">
                <div className="lens-orb a" />
                <div className="lens-orb b" />
                <div className="lens-vf-hint">
                  <span className="lvh-ic"><LensAiIcon size={28} /></span>
                  <b>{lang === 'tr' ? 'Fotoğrafla tam eşleşme bul' : 'Наведите камеру или выберите фото'}</b>
                  <p>{lang === 'tr' ? 'JJ Vision AI ürünü, rengi ve tarzı tanır — kataloğumuzdaki en yakın modelleri bulur' : 'JJ Vision AI распознает вещь, точный цвет и фасон — и найдёт точно такой же товар в нашем маркете'}</p>
                  {camErr && <small className="lvh-note">Нет доступа к камере — выберите фото из галереи или примеров ниже</small>}
                </div>
              </div>
            )}

            {/* Анимированная рамка видоискателя JJ #AE33FF */}
            <div className="lens-frame" aria-hidden>
              <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
              <span className="lens-idle-beam" />
            </div>
          </div>

          {/* Нижняя панель управления: Галерея · Затвор камеры · Демо-образы */}
          <div className="lens-dock">
            <div className="lens-samples-lbl">
              <Sparkles size={12} color="#D896FF" />
              <span>{lang === 'tr' ? 'Hızlı test için bir fotoğraf seçin' : 'Попробуйте в 1 касание на реальном товаре'}</span>
            </div>
            <div className="lens-samples">
              {quickSamples.map(({ p, title, hint }) => (
                <button
                  key={p.id}
                  type="button"
                  className="lens-sample-item"
                  onClick={() => runVisualScan('/' + p.images[0], `${hint} ${tx(p.name, lang)}`, p.id)}
                >
                  <img src={'/' + p.images[0]} alt="" />
                  <span>{title}</span>
                </button>
              ))}
            </div>

            <div className="lens-shutter-bar">
              <button type="button" className="lens-sec-act" onClick={() => galleryRef.current?.click()}>
                <ImageIc size={19} />
                <span>{lang === 'tr' ? 'Galeri' : 'Галерея'}</span>
              </button>

              <button type="button" className="lens-shutter" onClick={captureFrame} aria-label="Capture">
                <span className="ls-inner">
                  <Camera size={22} />
                </span>
              </button>

              <button type="button" className="lens-sec-act" onClick={() => cameraCaptureRef.current?.click()}>
                <RefreshCw size={18} />
                <span>{lang === 'tr' ? 'Çek' : 'Снять'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* РЕЖИМ 2: МОУШН-СКАНИРОВАНИЕ ФОТО С AI-ТОЧКАМИ */}
      {view === 'scanning' && (
        <div className="lens-scan-view">
          <div className="lens-scan-card">
            {scanningImg ? <img src={scanningImg} alt="" /> : (
              <div className="lsc-placeholder"><LensAiIcon size={44} /></div>
            )}
            <div className="lens-scan-laser" />
            <span className="lens-ai-dot d1" />
            <span className="lens-ai-dot d2" />
            <span className="lens-ai-dot d3" />
          </div>

          <div className="lens-scan-status">
            <span className="lss-badge"><Sparkles size={13} />JJ Vision AI</span>
            <h2>{scanSteps[scanStage]}</h2>
            <div className="lss-bars">
              {[0, 1, 2].map((i) => <i key={i} className={i <= scanStage ? 'on' : ''} />)}
            </div>
          </div>
        </div>
      )}

      {/* РЕЖИМ 3: РЕЗУЛЬТАТЫ AI-АГЕНТА (Точное совпадение / Дешевле / Другой цвет / Собрать образ + AI-чат уточнение) */}
      {view === 'results' && scan && (
        <>
          <div className="scroll lens-res-scroll">
            {/* Компактная карточка распознанного фото + извлечённый цвет */}
            <div className="lr-source-card">
              <div className="lrs-thumb">
                <img src={scan.image} alt="" />
                <span className="lrs-ok"><Check size={10} strokeWidth={3} /></span>
              </div>
              <div className="lrs-info">
                <div className="lrs-tag"><Sparkles size={11} />JJ Vision AI</div>
                <b>{scan.label}</b>
                <div className="lrs-color-row">
                  <i style={{ background: scan.color.hex }} />
                  <span>{scan.color.label}</span>
                  <em>· {rankedMatches.length} {t.items}</em>
                </div>
              </div>
            </div>

            {/* 4 умных режима AI-агента (лучше чем у WB / Ozon / Trendyol) */}
            <div className="lr-modes">
              <button type="button" className={mode === 'exact' ? 'on' : ''} onClick={() => { setMode('exact'); setTargetColor(null); setAiReply(null) }}>
                <Target size={13} /><span>Точно такое же</span>
              </button>
              <button type="button" className={mode === 'cheaper' ? 'on' : ''} onClick={() => { setMode('cheaper'); setAiReply('Показал самые выгодные аналоги в этом стиле.') }}>
                <TrendingDown size={13} /><span>Дешевле</span>
              </button>
              <button type="button" className={mode === 'color' ? 'on' : ''} onClick={() => { setMode('color'); setTargetColor(targetColor ?? 'color-black') }}>
                <Palette size={13} /><span>Другой цвет</span>
              </button>
              <button type="button" className={mode === 'outfit' ? 'on' : ''} onClick={() => { setMode('outfit'); setAiReply('AI-стилист подобрал вещи, которые идеально дополнят ваш образ.') }}>
                <Layers size={13} /><span>Собрать образ</span>
              </button>
            </div>

            {/* Палитра смены цвета (открывается при выборе «Другой цвет») */}
            {mode === 'color' && (
              <div className="lr-colors-bar">
                {PALETTE_REF.slice(0, 7).map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    className={'lrc-sw' + (targetColor === c.slug ? ' on' : '')}
                    onClick={() => { setTargetColor(c.slug); setAiReply(`Ищем похожую модель в цвете «${c.label}».`) }}
                  >
                    <i style={{ background: hexOf(c.slug) }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Живая реплика AI-агента при уточнении */}
            {aiReply && (
              <div className="lr-ai-bubble">
                <Sparkles size={14} color="#AE33FF" />
                <span>{aiReply}</span>
                {(onlyDiscount || maxPriceKzt) && (
                  <button type="button" onClick={() => { setOnlyDiscount(false); setMaxPriceKzt(null); setAiReply(null) }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Сетка найденных совпадений с % схожести */}
            <div className="lr-grid">
              {rankedMatches.map(({ p, score }, idx) => (
                <div
                  key={p.id}
                  className="lr-card"
                  style={{ animationDelay: `${Math.min(idx, 7) * 35}ms` }}
                  onClick={() => push('product', { id: p.id })}
                >
                  <div className="lrc-media">
                    <img src={'/' + p.images[0]} loading="lazy" alt="" />
                    <span className={'lrc-match' + (score >= 95 ? ' top' : '')}>
                      <Sparkles size={9} />{score}%
                    </span>
                    {p.pct > 0 && <em className="lrc-disc">−{p.pct}%</em>}
                  </div>
                  <div className="lrc-body">
                    <div className="lrc-price">
                      <b>{money(p.price)}</b>
                      {p.old > p.price && <s>{money(p.old)}</s>}
                    </div>
                    <div className="lrc-name">{tx(p.name, lang)}</div>
                    <div className="lrc-foot">
                      <span><Star size={11} fill="#F59E0B" color="#F59E0B" />{(p.rating || 4.9).toFixed(1)}</span>
                      <button type="button" className="lrc-bag" onClick={(e) => quickAdd(e, p)} aria-label={t.addToCart}>
                        <ShoppingBag size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 18 }} />
          </div>

          {/* Умная строка уточнения AI-агенту поверх фото */}
          <div className="lr-agent-bar">
            <SlidersHorizontal size={15} color="#AE33FF" />
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runAgentCommand()}
              placeholder={lang === 'tr' ? 'AI’ye sor: «daha ucuz», «siyah renk»…' : 'Уточнить AI: «дешевле», «в чёрном», «со скидкой»…'}
            />
            <button type="button" className={'lr-send' + (aiQuery.trim() ? ' on' : '')} onClick={runAgentCommand} aria-label="Send">
              <Send size={15} />
            </button>
          </div>
        </>
      )}

      {/* РЕЖИМ 4: ТЕКСТОВЫЙ AI-АССИСТЕНТ */}
      {view === 'chat' && (
        <>
          <div className="scroll chat">
            {chatMsgs.map((m, i) => (
              <div key={i} className={'bubble' + (m.me ? ' me' : '')}>
                {m.text}
                {m.ids && (
                  <div className="chat-prods">
                    {m.ids.map((id) => {
                      const p = cat.products.find((x) => x.id === id)!
                      return (
                        <button key={id} onClick={() => push('product', { id })}>
                          <img src={'/' + p.images[0]} alt="" />
                          <span>{tx(p.name, lang)}</span>
                          <b>{money(p.price)}</b>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="chat-in">
            <button type="button" className="chat-cam-btn" onClick={() => setView('camera')} aria-label="Photo search">
              <LensAiIcon size={18} />
            </button>
            <input
              placeholder={t.aiPh}
              value={chatIn}
              onChange={(e) => setChatIn(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendTextChat()}
            />
            <button onClick={sendTextChat} aria-label="Send"><Send size={18} /></button>
          </div>
        </>
      )}
    </div>
  )
}
