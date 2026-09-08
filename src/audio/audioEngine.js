let ctx = null
let masterGain = null
let musicGain = null
let muted = false
let musicTimer = null
let beat = 0
let barIndex = 0

export function initAudio() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = ctx.createGain()
  masterGain.gain.value = 0.9
  masterGain.connect(ctx.destination)

  musicGain = ctx.createGain()
  musicGain.gain.value = 0.22
  musicGain.connect(masterGain)
}

export function setMuted(next) {
  muted = next
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.9
}

export function isMuted() {
  return muted
}

function tone({ freq, duration = 0.2, type = 'sine', volume = 0.3, delay = 0, attack = 0.01, release = 0.08, destination }) {
  if (!ctx) return
  const now = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release)
  osc.connect(gain)
  gain.connect(destination || masterGain)
  osc.start(now)
  osc.stop(now + duration + release + 0.02)
}

function noiseBurst({ duration = 0.25, volume = 0.25, delay = 0, filterFreq = 1200, destination }) {
  if (!ctx) return
  const now = ctx.currentTime + delay
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(destination || masterGain)
  src.start(now)
}

function sweep({ from, to, duration = 0.3, type = 'sawtooth', volume = 0.25, delay = 0 }) {
  if (!ctx) return
  const now = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, now)
  osc.frequency.exponentialRampToValueAtTime(to, now + duration)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

export const sfx = {
  hover: () => tone({ freq: 520, duration: 0.05, type: 'triangle', volume: 0.12 }),
  select: () => tone({ freq: 660, duration: 0.09, type: 'triangle', volume: 0.22 }),
  confirm: () => {
    ;[523, 659, 784].forEach((f, i) => tone({ freq: f, duration: 0.12, type: 'triangle', volume: 0.25, delay: i * 0.07 }))
  },
  whoosh: () => sweep({ from: 200, to: 900, duration: 0.35, type: 'sine', volume: 0.18 }),
  tick: () => tone({ freq: 880, duration: 0.05, type: 'square', volume: 0.15 }),
  tickUrgent: () => tone({ freq: 1046, duration: 0.07, type: 'square', volume: 0.25 }),
  answerLock: () => tone({ freq: 300, duration: 0.06, type: 'square', volume: 0.2 }),
  correct: () => {
    ;[523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, duration: 0.14, type: 'triangle', volume: 0.28, delay: i * 0.08 }))
  },
  wrong: () => {
    sweep({ from: 300, to: 90, duration: 0.4, type: 'sawtooth', volume: 0.22 })
  },
  fanfare: () => {
    ;[523, 523, 659, 784, 1046, 784, 1046].forEach((f, i) =>
      tone({ freq: f, duration: 0.16, type: 'triangle', volume: 0.3, delay: i * 0.1 })
    )
  },
  drumroll: () => {
    for (let i = 0; i < 14; i++) noiseBurst({ duration: 0.08, volume: 0.12, delay: i * 0.09, filterFreq: 2500 })
  },
  minigameStart: () => {
    sweep({ from: 150, to: 700, duration: 0.5, type: 'square', volume: 0.2 })
  },
  minigameWin: () => {
    ;[659, 784, 988, 1318].forEach((f, i) => tone({ freq: f, duration: 0.14, type: 'triangle', volume: 0.3, delay: i * 0.09 }))
  },
  minigameFail: () => {
    ;[400, 320, 240].forEach((f, i) => tone({ freq: f, duration: 0.2, type: 'sawtooth', volume: 0.22, delay: i * 0.14 }))
  },
  mash: (() => {
    let lastPlayedAt = 0
    const MIN_INTERVAL_MS = 45
    return () => {
      const now = performance.now()
      if (now - lastPlayedAt < MIN_INTERVAL_MS) return
      lastPlayedAt = now
      tone({ freq: 700 + Math.random() * 300, duration: 0.04, type: 'square', volume: 0.14 })
    }
  })(),
  buzzer: () => noiseBurst({ duration: 0.35, volume: 0.3, filterFreq: 500 }),
  pop: () => tone({ freq: 900, duration: 0.05, type: 'sine', volume: 0.2 }),
  whistle: () => sweep({ from: 1200, to: 1800, duration: 0.25, type: 'sine', volume: 0.2 }),
  laser: () => sweep({ from: 1600, to: 200, duration: 0.3, type: 'square', volume: 0.16 }),
  chime: () => {
    ;[988, 1318, 1568].forEach((f, i) => tone({ freq: f, duration: 0.3, type: 'sine', volume: 0.22, delay: i * 0.05 }))
  },
}

const BEAT_MS = 600
const PROGRESSION = [
  { bass: 110.0, chord: [220.0, 261.63, 329.63] },
  { bass: 87.31, chord: [174.61, 220.0, 261.63] },
  { bass: 130.81, chord: [261.63, 329.63, 392.0] },
  { bass: 98.0, chord: [196.0, 246.94, 293.66] },
]
const MELODY_SCALE = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0]

export const music = {
  start() {
    if (!ctx || musicTimer) return
    beat = 0
    barIndex = 0

    const playBeat = () => {
      const bar = PROGRESSION[barIndex % PROGRESSION.length]
      const beatInBar = beat % 4

      if (beatInBar === 0) {
        tone({ freq: bar.bass, duration: 1.0, type: 'sine', volume: 0.55, attack: 0.05, release: 0.5, destination: musicGain })
        bar.chord.forEach((f, i) =>
          tone({ freq: f, duration: 2.2, type: 'triangle', volume: 0.14, attack: 0.6, release: 1.2, delay: i * 0.02, destination: musicGain })
        )
      } else if (beatInBar === 2) {
        tone({ freq: bar.bass, duration: 0.5, type: 'sine', volume: 0.32, attack: 0.02, release: 0.3, destination: musicGain })
      }

      if (Math.random() < 0.45) {
        const note = MELODY_SCALE[Math.floor(Math.random() * MELODY_SCALE.length)]
        tone({ freq: note, duration: 0.5, type: 'sine', volume: 0.16, attack: 0.02, release: 0.3, destination: musicGain })
      }

      noiseBurst({ duration: 0.04, volume: 0.05, filterFreq: 7000, destination: musicGain })

      beat++
      if (beat % 4 === 0) barIndex++
    }

    playBeat()
    musicTimer = setInterval(playBeat, BEAT_MS)
  },
  stop() {
    if (musicTimer) {
      clearInterval(musicTimer)
      musicTimer = null
    }
    beat = 0
    barIndex = 0
  },
}
