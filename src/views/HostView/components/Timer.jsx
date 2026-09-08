import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../audio/audioEngine'

export function Timer({ seconds, onExpire, running }) {
  const [remaining, setRemaining] = useState(seconds)
  const isFirstTick = useRef(true)

  useEffect(() => {
    setRemaining(seconds)
    isFirstTick.current = true
  }, [seconds])

  useEffect(() => {
    if (isFirstTick.current) {
      isFirstTick.current = false
    } else if (running) {
      if (remaining <= 3 && remaining > 0) sfx.tickUrgent()
      else if (remaining > 0) sfx.tick()
    }
  }, [remaining, running])

  useEffect(() => {
    if (!running) return
    if (remaining <= 0) {
      onExpire?.()
      return
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, running, onExpire])

  return <div className={`timer ${remaining <= 3 ? 'urgent' : ''}`}>{remaining}</div>
}
