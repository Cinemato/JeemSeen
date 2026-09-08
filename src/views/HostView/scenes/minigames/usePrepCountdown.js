import { useEffect, useRef, useState } from 'react'
import { useGameService } from '../../../../game/state/gameService'

export const PREP_SECONDS = 5

export function usePrepCountdown() {
  const service = useGameService()
  const [prepping, setPrepping] = useState(true)
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS)
  const preppingRef = useRef(true)

  useEffect(() => {
    service.setMinigameStage('prep')
    let left = PREP_SECONDS
    const interval = setInterval(() => {
      left -= 1
      setPrepLeft(left)
      if (left <= 0) {
        clearInterval(interval)
        preppingRef.current = false
        setPrepping(false)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return { prepping, prepLeft, preppingRef }
}
