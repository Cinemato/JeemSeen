export const minigames = [
  { id: 'mash-race', name: 'سباق الضغط', mode: 'solo' },
  { id: 'timing-bar', name: 'قف في الوقت المناسب', mode: 'solo' },
  { id: 'group-race', name: 'سباق الفريق', mode: 'group' },
  { id: 'musical-chairs', name: 'الكراسي الموسيقية', mode: 'group' },
  { id: 'box-guess', name: 'اطعن الصندوق', mode: 'group' },
  { id: 'sequence-memory', name: 'تذكر التسلسل', mode: 'solo' },
]

export const BOX_GUESS_COUNT = 5
export const SIMON_PAD_COLORS = ['#f87171', '#facc15', '#4ade80', '#38bdf8']

export function pickNextMinigame(playedIds = [], lastId) {
  const remaining = minigames.filter((m) => !playedIds.includes(m.id))
  if (remaining.length > 0) {
    const id = remaining[Math.floor(Math.random() * remaining.length)].id
    return { id, playedIds: [...playedIds, id] }
  }
  const freshPool = minigames.filter((m) => m.id !== lastId)
  const pool = freshPool.length > 0 ? freshPool : minigames
  const id = pool[Math.floor(Math.random() * pool.length)].id
  return { id, playedIds: [id] }
}

export function getMinigameMeta(id) {
  return minigames.find((m) => m.id === id)
}
