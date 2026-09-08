import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../../audio/audioEngine'
import { MINIGAME_BONUS, MINIGAME_WINNER_BONUS } from '../../../../game/state/gameReducer'
import { getPlayerColorCss } from '../../../../game/data/playerColors'
import { onMinigameAction } from '../../../../network/minigameBus'
import { useGameService } from '../../../../game/state/gameService'
import { usePrepCountdown } from './usePrepCountdown'

const DURATION_MS = 6000
const GOAL = 100

export function GroupRaceMinigame({ players, targetId, onComplete }) {
  const { prepping, prepLeft, preppingRef } = usePrepCountdown()
  const service = useGameService()
  const [progress, setProgress] = useState(() => Object.fromEntries(players.map((p) => [p.id, 0])))
  const [timeLeftMs, setTimeLeftMs] = useState(DURATION_MS)
  const [outcome, setOutcome] = useState(null)
  const finishedRef = useRef(false)
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    if (prepping) return
    service.setMinigameStage('active')
    const start = performance.now()
    let frame
    const tick = (now) => {
      const remaining = Math.max(0, DURATION_MS - (now - start))
      setTimeLeftMs(remaining)
      if (remaining <= 0) {
        finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [prepping])

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true

    const current = progressRef.current
    const ranked = [...players].sort((a, b) => (current[b.id] ?? 0) - (current[a.id] ?? 0))
    const minProgress = Math.min(...players.map((p) => current[p.id] ?? 0))
    const atMin = players.filter((p) => (current[p.id] ?? 0) === minProgress)
    const targetIsSoleLast = atMin.length === 1 && atMin[0].id === targetId
    const targetSuccess = !targetIsSoleLast

    const winner = ranked[0]
    const winnerIsUnique = (current[winner.id] ?? 0) > (current[ranked[1]?.id] ?? -1)

    const outcomes = [{ playerId: targetId, success: targetSuccess, bonus: MINIGAME_BONUS }]
    if (winnerIsUnique && winner.id !== targetId) {
      outcomes.push({ playerId: winner.id, success: true, bonus: MINIGAME_WINNER_BONUS })
    }

    setOutcome({ success: targetSuccess, winnerName: winnerIsUnique ? winner.name : null })
    if (targetSuccess) sfx.minigameWin()
    else sfx.minigameFail()
    setTimeout(() => onComplete(outcomes), 1500)
  }

  function handlePress(playerId) {
    if (finishedRef.current || preppingRef.current) return
    sfx.mash()
    const current = progressRef.current
    const nextVal = Math.min(GOAL, (current[playerId] ?? 0) + 3 + Math.random() * 3)
    const next = { ...current, [playerId]: nextVal }
    progressRef.current = next
    setProgress(next)
    if (nextVal >= GOAL) finish()
  }

  const handlePressRef = useRef(handlePress)
  handlePressRef.current = handlePress

  useEffect(() => {
    return onMinigameAction(({ playerId, action }) => {
      if (action === 'press' && players.some((p) => p.id === playerId)) handlePressRef.current(playerId)
    })
  }, [players])

  const secondsLeft = Math.ceil(timeLeftMs / 1000)
  const target = players.find((p) => p.id === targetId)

  return (
    <div className="minigame-body group-race">
      <h2 className="minigame-heading">سباق الفريق!</h2>
      <p className="minigame-sub">
        {prepping ? (
          `استعد... يبدأ خلال ${prepLeft}`
        ) : (
          <>
            الجميع يشارك من هواتفهم — <strong>{target?.name}</strong> يجب ألا يأتي أخيرًا بمفرده!
          </>
        )}
      </p>

      {prepping ? (
        <div className="minigame-timer">{prepLeft}</div>
      ) : outcome ? (
        <div className={`minigame-flash ${outcome.success ? 'hit' : 'miss'}`}>
          {outcome.winnerName ? `${outcome.winnerName} في المقدمة — ` : ''}
          {outcome.success ? `${target?.name} نجا!` : `${target?.name} جاء أخيرًا!`}
        </div>
      ) : (
        <div className="minigame-timer">{secondsLeft}</div>
      )}

      <div className="group-race-lanes">
        {players.map((p) => {
          const color = getPlayerColorCss(p.colorIndex)
          const isTarget = p.id === targetId
          return (
            <div className={`group-race-lane ${isTarget ? 'is-target' : ''}`} key={p.id}>
              <span className="group-race-name" style={{ color }}>
                {p.name}
              </span>
              <div className="group-race-track">
                <div className="group-race-fill" style={{ width: `${progress[p.id]}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
