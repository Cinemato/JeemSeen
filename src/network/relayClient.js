const RELAY_PORT = 8787

export function createRelayConnection({ role, onMessage, onOpen, onClose }) {
  const url = `ws://${window.location.hostname}:${RELAY_PORT}`
  const socket = new WebSocket(url)

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'hello', role }))
    onOpen?.()
  })

  socket.addEventListener('message', (event) => {
    let msg
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }
    onMessage?.(msg)
  })

  socket.addEventListener('close', () => onClose?.())
  socket.addEventListener('error', () => onClose?.())

  return {
    send(msg) {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg))
    },
    close() {
      socket.close()
    },
  }
}
