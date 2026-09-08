export const CHARACTER_VARIANTS = [
  { skin: 0xffd7a8, hair: 0x3b2416, hairStyle: 'short' },
  { skin: 0xf3b988, hair: 0xb5651d, hairStyle: 'ponytail' },
  { skin: 0x8d5a3b, hair: 0x141414, hairStyle: 'curly' },
  { skin: 0xffe0c2, hair: 0x2b2b2b, hairStyle: 'bun' },
  { skin: 0xe3a97a, hair: 0x5c4033, hairStyle: 'bald' },
  { skin: 0xffcfa0, hair: 0x111827, hairStyle: 'side' },
  { skin: 0xf6c89f, hair: 0x22c55e, hairStyle: 'mohawk' },
  { skin: 0x6b4226, hair: 0x1a1a1a, hairStyle: 'afro' },
  { skin: 0xffe8d1, hair: 0x4b3621, hairStyle: 'headband' },
  { skin: 0xc98a5e, hair: 0x0a0a0a, hairStyle: 'bald', glasses: true },
  { skin: 0xfff1e0, hair: 0x7a5230, hairStyle: 'short', glasses: true },
  { skin: 0xd9a066, hair: 0x2e1a0f, hairStyle: 'flat' },
  { skin: 0xf5cba7, hair: 0x6b3410, hairStyle: 'twintails' },
  { skin: 0xb47b56, hair: 0x1c1c1c, hairStyle: 'braid' },
  { skin: 0xffe9d6, hair: 0xd4a017, hairStyle: 'curly', glasses: true },
  { skin: 0x8a5a3c, hair: 0x2b1810, hairStyle: 'twintails' },
  { skin: 0xe8b087, hair: 0x462a1d, hairStyle: 'mohawk' },
  { skin: 0x5c3a21, hair: 0x0d0d0d, hairStyle: 'bun', glasses: true },
  { skin: 0xffd9b3, hair: 0x8b5e34, hairStyle: 'braid' },
  { skin: 0xd8a878, hair: 0x3d2b1f, hairStyle: 'side' },
]

export function getCharacterVariant(index) {
  return CHARACTER_VARIANTS[index % CHARACTER_VARIANTS.length]
}

export function randomVariantIndex() {
  return Math.floor(Math.random() * CHARACTER_VARIANTS.length)
}

export function randomVariantIndexExcluding(excludeIndex) {
  if (CHARACTER_VARIANTS.length <= 1) return 0
  let next = excludeIndex
  while (next === excludeIndex) next = randomVariantIndex()
  return next
}

export function hexToCss(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`
}
