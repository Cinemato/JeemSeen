import { WebSocketServer } from 'ws'
import { networkInterfaces } from 'os'

const PORT = 8787
const wss = new WebSocketServer({ port: PORT })

const rooms = new Map()

function getLanIp() {
  const nets = networkInterfaces()
  for (const entries of Object.values(nets)) {
    for (const net of entries) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return null
}

function send(socket, msg) {
  if (socket && socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(msg))
  }
}

function broadcastToRoom(room, msg) {
  for (const { socket } of room.players.values()) send(socket, msg)
}

function generateCode() {
  let code
  do {
    code = String(Math.floor(1000 + Math.random() * 9000))
  } while (rooms.has(code))
  return code
}

wss.on('connection', (socket) => {
  let role = null
  let tempId = null
  let roomCode = null

  socket.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.type === 'hello') {
      role = msg.role
      if (role === 'host') {
        roomCode = generateCode()
        rooms.set(roomCode, { hostSocket: socket, players: new Map() })
        send(socket, { type: 'hostReady', code: roomCode, hostIp: getLanIp() })
        console.log(`[relay] host connected, room ${roomCode}`)
      }
      return
    }

    if (role === 'player') {
      if (msg.type === 'join') {
        const room = rooms.get(msg.code)
        if (!room) {
          send(socket, { type: 'joinError', message: 'كود غير صحيح' })
          return
        }
        roomCode = msg.code
        tempId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        room.players.set(tempId, { socket, playerId: null })
        send(room.hostSocket, { type: 'joinRequest', tempId, name: msg.name })
        console.log(`[relay] phone joined room ${roomCode} (#${tempId})`)
        return
      }

      const room = rooms.get(roomCode)
      const entry = room?.players.get(tempId)
      if (room && entry?.playerId) {
        const { type, ...rest } = msg
        send(room.hostSocket, { type, playerId: entry.playerId, ...rest })
      }
      return
    }

    if (role === 'host') {
      const room = rooms.get(roomCode)
      if (!room) return
      if (msg.type === 'playerAdded') {
        const entry = room.players.get(msg.tempId)
        if (entry) {
          entry.playerId = msg.playerId
          send(entry.socket, { type: 'joined', playerId: msg.playerId })
        }
      } else if (msg.type === 'state') {
        broadcastToRoom(room, { type: 'state', payload: msg.payload })
      }
      return
    }
  })

  socket.on('close', () => {
    if (role === 'host' && roomCode) {
      const room = rooms.get(roomCode)
      if (room) broadcastToRoom(room, { type: 'hostDisconnected' })
      rooms.delete(roomCode)
      console.log(`[relay] host disconnected, room ${roomCode} closed`)
    } else if (role === 'player' && roomCode) {
      rooms.get(roomCode)?.players.delete(tempId)
      console.log(`[relay] phone (#${tempId}) left room ${roomCode}`)
    }
  })
})

console.log(`[relay] listening on ws://0.0.0.0:${PORT}`)
