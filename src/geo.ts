export type CountryCode = 'UZ' | 'KZ' | 'RU' | 'KG'

export interface LocalPayment {
  id: 'card' | 'apple' | 'google'
  title: string
  sub: string
  kind: 'card' | 'apple' | 'google'
}

export const UNIVERSAL_PAYMENTS: LocalPayment[] = [
  { id: 'card', title: 'Банковская карта', sub: 'Подключить любую карту', kind: 'card' },
  { id: 'apple', title: 'Apple Pay', sub: 'Оплата в одно касание', kind: 'apple' },
  { id: 'google', title: 'Google Pay', sub: 'Быстрая онлайн-оплата', kind: 'google' },
]

export interface CountryInfo {
  code: CountryCode
  flag: string
  dial: string
  currency: string
  symbol: string
  rateFromKzt: number
  roundTo: number
  name: { ru: string; tr: string; kk: string }
  cities: string[]
  payments: LocalPayment[]
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'UZ',
    flag: '🇺🇿',
    dial: '+998',
    currency: 'UZS (сум)',
    symbol: 'сум',
    rateFromKzt: 26.5,
    roundTo: 100,
    name: { ru: 'Узбекистан', tr: 'Özbekistan', kk: 'Өзбекстан' },
    cities: [
      'Ташкент', 'Андижан', 'Самарканд', 'Бухара', 'Наманган', 'Фергана',
      'Нукус', 'Карши', 'Коканд', 'Маргилан', 'Навои', 'Ургенч',
      'Термез', 'Джизак', 'Гулистан', 'Чирчик', 'Ангрен', 'Алмалык',
    ],
    payments: UNIVERSAL_PAYMENTS,
  },
  {
    code: 'KZ',
    flag: '🇰🇿',
    dial: '+7',
    currency: 'KZT (₸)',
    symbol: '₸',
    rateFromKzt: 1,
    roundTo: 1,
    name: { ru: 'Казахстан', tr: 'Kazakistan', kk: 'Қазақстан' },
    cities: [
      'Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз',
      'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау', 'Костанай',
      'Кызылорда', 'Уральск', 'Петропавловск', 'Актау', 'Темиртау', 'Туркестан',
    ],
    payments: UNIVERSAL_PAYMENTS,
  },
  {
    code: 'RU',
    flag: '🇷🇺',
    dial: '+7',
    currency: 'RUB (₽)',
    symbol: '₽',
    rateFromKzt: 0.195,
    roundTo: 1,
    name: { ru: 'Россия', tr: 'Rusya', kk: 'Ресей' },
    cities: [
      'Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург',
      'Нижний Новгород', 'Челябинск', 'Самара', 'Уфа', 'Ростов-на-Дону',
      'Краснодар', 'Омск', 'Воронеж', 'Пермь', 'Волгоград', 'Красноярск', 'Сочи',
    ],
    payments: UNIVERSAL_PAYMENTS,
  },
  {
    code: 'KG',
    flag: '🇰🇬',
    dial: '+996',
    currency: 'KGS (сом)',
    symbol: 'сом',
    rateFromKzt: 0.178,
    roundTo: 1,
    name: { ru: 'Кыргызстан', tr: 'Kırgızistan', kk: 'Қырғызстан' },
    cities: [
      'Бишкек', 'Ош', 'Джалал-Абад', 'Каракол', 'Токмок', 'Узген',
      'Балыкчы', 'Кара-Балта', 'Нарын', 'Талас', 'Баткен', 'Кант',
    ],
    payments: UNIVERSAL_PAYMENTS,
  },
]

export interface PickupPoint {
  id: string
  country: CountryCode
  city: string
  title: string
  street: string
  hours: string
  rating: string
}

export const PICKUP_POINTS: PickupPoint[] = [
  { id: 'pvz-uz-1', country: 'UZ', city: 'Ташкент', title: 'ПВЗ · Tashkent City', street: 'ул. Ислама Каримова, 45', hours: '09:00–22:00', rating: '5.0' },
  { id: 'pvz-uz-2', country: 'UZ', city: 'Андижан', title: 'ПВЗ · Центр Андижан', street: 'пр. Бабура, 18', hours: '09:00–21:00', rating: '4.9' },
  { id: 'pvz-uz-3', country: 'UZ', city: 'Самарканд', title: 'ПВЗ · пр. Мирзо Улугбека', street: 'пр. Мирзо Улугбека, 62', hours: '09:00–21:00', rating: '4.9' },
  { id: 'pvz-kz-1', country: 'KZ', city: 'Алматы', title: 'ПВЗ · ТРЦ Mega Center', street: 'ул. Розыбакиева, 247А', hours: '09:00–22:00', rating: '4.9' },
  { id: 'pvz-kz-2', country: 'KZ', city: 'Алматы', title: 'ПВЗ · пр. Достык', street: 'пр. Достык, 89', hours: '09:00–21:00', rating: '5.0' },
  { id: 'pvz-kz-3', country: 'KZ', city: 'Астана', title: 'ПВЗ · ТРЦ Хан Шатыр', street: 'пр. Туран, 37', hours: '10:00–22:00', rating: '4.9' },
  { id: 'pvz-kz-4', country: 'KZ', city: 'Шымкент', title: 'ПВЗ · Shymkent Plaza', street: 'пл. Аль-Фараби, 3/1', hours: '10:00–22:00', rating: '4.8' },
  { id: 'pvz-ru-1', country: 'RU', city: 'Москва', title: 'ПВЗ · Тверская', street: 'ул. Тверская, 16с1', hours: '09:00–22:00', rating: '4.9' },
  { id: 'pvz-ru-2', country: 'RU', city: 'Санкт-Петербург', title: 'ПВЗ · Невский проспект', street: 'Невский пр., 78', hours: '09:00–22:00', rating: '4.9' },
  { id: 'pvz-ru-3', country: 'RU', city: 'Казань', title: 'ПВЗ · ул. Баумана', street: 'ул. Баумана, 54', hours: '10:00–21:00', rating: '4.8' },
  { id: 'pvz-kg-1', country: 'KG', city: 'Бишкек', title: 'ПВЗ · пр. Чуй', street: 'пр. Чуй, 155', hours: '09:00–21:00', rating: '4.9' },
  { id: 'pvz-kg-2', country: 'KG', city: 'Ош', title: 'ПВЗ · ул. Курманжан Датка', street: 'ул. Курманжан Датка, 112', hours: '09:00–21:00', rating: '4.8' },
]

export function countryByCode(code: CountryCode): CountryInfo {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[1]
}

export function findCountryByName(name: string): CountryInfo {
  const n = name.toLowerCase()
  return (
    COUNTRIES.find(
      (c) =>
        c.code.toLowerCase() === n ||
        c.name.ru.toLowerCase() === n ||
        c.name.tr.toLowerCase() === n ||
        c.name.kk.toLowerCase() === n,
    ) ?? COUNTRIES[1]
  )
}
