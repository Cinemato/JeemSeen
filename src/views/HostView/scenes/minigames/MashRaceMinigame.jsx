import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../../audio/audioEngine'
import { MINIGAME_BONUS } from '../../../../game/state/gameReducer'
import { onMinigameAction } from '../../../../network/minigameBus'
import { useGameService } from '../../../../game/state/gameService'
import { usePrepCountdown } from './usePrepCountdown'

const DURATION_MS = 4200
const GOAL = 100
const OUTCOME_PAUSE_MS = 1300

export function MashRaceMinigame({ player, onComplete }) {
  const { prepping, prepLeft, preppingRef } = usePrepCountdown()
  const service = useGameService()
  const [progress, setProgress] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(DURATION_MS)
  const [outcome, setOutcome] = useState(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (prepping) return
    service.setMinigameStage('active')
    const start = performance.now()
    let frame
    const tick = (now) => {
      const elapsed = now - start
      const remaining = Math.max(0, DURATION_MS - elapsed)
      setTimeLeftMs(remaining)
      if (remaining <= 0) {
        finish(progress >= GOAL)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [prepping])

  function finish(success) {
    if (finishedRef.current) return
    finishedRef.current = true
    setOutcome(success ? 'success' : 'fail')
    if (success) sfx.minigameWin()
    else sfx.minigameFail()
    setTimeout(() => onComplete([{ playerId: player.id, success, bonus: MINIGAME_BONUS }]), OUTCOME_PAUSE_MS)
  }

  function handlePress() {
    if (finishedRef.current || preppingRef.current) return
    sfx.mash()
    setProgress((p) => {
      const next = Math.min(GOAL, p + 3 + Math.random() * 3)
      if (next >= GOAL) finish(true)
      return next
    })
  }

  const handlePressRef = useRef(handlePress)
  handlePressRef.current = handlePress

  useEffect(() => {
    return onMinigameAction(({ playerId, action }) => {
      if (playerId === player.id && action === 'press') handlePressRef.current()
    })
  }, [player.id])

  const secondsLeft = Math.ceil(timeLeftMs / 1000)

  return (
    <div className="minigame-body">
      <h2 className="minigame-heading">سباق الضغط!</h2>
      <p className="minigame-sub">
        دور <strong>{player.name}</strong> —{' '}
        {prepping ? `استعد... يبدأ خلال ${prepLeft}` : 'اضغط على هاتفك بأقصى سرعة قبل نفاد الوقت!'}
      </p>

      <div className="mash-track">
        <div className="mash-track-fill" style={{ width: `${progress}%` }} />
        <div className="mash-track-runner" style={{ insetInlineStart: `calc(${progress}% - 9px)` }} />
        <div className="mash-track-goal" />
      </div>

      {outcome ? (
        <div className={`minigame-flash ${outcome === 'success' ? 'hit' : 'miss'}`}>
          {outcome === 'success' ? 'وصلت!' : 'انتهى الوقت'}
        </div>
      ) : (
        <div className="minigame-timer">{prepping ? prepLeft : secondsLeft}</div>
      )}
    </div>
  )
}
