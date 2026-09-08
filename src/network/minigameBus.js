const target = new EventTarget()

export function emitMinigameAction(playerId, action, extra = {}) {
  target.dispatchEvent(new CustomEvent('action', { detail: { playerId, action, ...extra } }))
}

export function onMinigameAction(handler) {
  const listener = (event) => handler(event.detail)
  target.addEventListener('action', listener)
  return () => target.removeEventListener('action', listener)
}
