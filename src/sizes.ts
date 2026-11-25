// Таблицы размеров для шторки «Beden Tablosu» (TR/EU, RU, INT; обувь — длина стопы)
export const SIZE_ROWS = {
  women: {
    head: ['TR / EU', 'RU', 'INT', 'Göğüs', 'Bel', 'Kalça'],
    rows: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'].map((int, i) => {
      const eu = 32 + i * 2
      return [String(eu), String(eu + 6), int, `${76 + i * 4}`, `${58 + i * 4}`, `${84 + i * 4}`]
    }),
  },
  shoes: {
    head: ['TR / EU', 'RU', 'cm'],
    rows: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46].map((eu) => [String(eu), String(eu - 1), (22.5 + (eu - 35) * 0.5).toFixed(1)]),
  },
}
