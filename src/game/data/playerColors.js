import { hexToCss } from './characterVariants'

export const PLAYER_COLORS = [
  { name: 'أحمر', hex: 0xef4444 },
  { name: 'أزرق', hex: 0x3b82f6 },
  { name: 'أخضر', hex: 0x22c55e },
  { name: 'أصفر', hex: 0xeab308 },
  { name: 'بنفسجي', hex: 0xa855f7 },
  { name: 'برتقالي', hex: 0xf97316 },
  { name: 'وردي', hex: 0xec4899 },
  { name: 'سماوي', hex: 0x06b6d4 },
]

export function getPlayerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

export function getPlayerColorCss(index) {
  return hexToCss(getPlayerColor(index).hex)
}

export function nextAvailableColorIndex(usedIndices = []) {
  const blocked = new Set(usedIndices)
  for (let i = 0; i < PLAYER_COLORS.length; i++) {
    if (!blocked.has(i)) return i
  }
  return usedIndices.length % PLAYER_COLORS.length
}
