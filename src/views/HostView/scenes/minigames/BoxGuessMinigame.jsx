import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../../audio/audioEngine'
import { MINIGAME_BONUS, MINIGAME_WINNER_BONUS } from '../../../../game/state/gameReducer'
import { BOX_GUESS_COUNT } from '../../../../game/data/minigames'
import { onMinigameAction } from '../../../../network/minigameBus'
import { useGameService } from '../../../../game/state/gameService'
import { usePrepCountdown } from './usePrepCountdown'

const HIDE_WINDOW_MS = 6000
const GUESS_WINDOW_MS = 7000
const OUTCOME_PAUSE_MS = 1600
export function BoxGuessMinigame({ players, targetId, onComplete }) {
  const { prepping, prepLeft, preppingRef } = usePrepCountdown()
  const service = useGameService()
  const guessersRef = useRef(players.filter((p) => p.id !== targetId))
  const guessers = guessersRef.current

  const [stage, setStage] = useState('hiding')
  const [hiddenBox, setHiddenBox] = useState(null)
  const [picks, setPicks] = useState({})
  const [timeLeftMs, setTimeLeftMs] = useState(HIDE_WINDOW_MS)
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState(null)

  const finishedRef = useRef(false)
  const stageRef = useRef('hiding')
  const hiddenBoxRef = useRef(null)
  const picksRef = useRef({})

  useEffect(() => {
    if (!prepping) service.setMinigameStage('hiding')
  }, [prepping])

  function beginGuessing(boxIndex) {
    if (stageRef.current !== 'hiding') return
    hiddenBoxRef.current = boxIndex
    setHiddenBox(boxIndex)
    stageRef.current = 'guessing'
    setStage('guessing')
    setTimeLeftMs(GUESS_WINDOW_MS)
    service.setMinigameStage('guessing')
    sfx.select()
  }

  useEffect(() => {
    if (prepping) return
    const windowMs = stage === 'hiding' ? HIDE_WINDOW_MS : GUESS_WINDOW_MS
    const start = performance.now()
    let frame
    const tick = (now) => {
      const remaining = Math.max(0, windowMs - (now - start))
      setTimeLeftMs(remaining)
      if (remaining <= 0) {
        if (stageRef.current === 'hiding') beginGuessing(Math.floor(Math.random() * BOX_GUESS_COUNT))
        else finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [stage, prepping])

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    setRevealed(true)

    const hidden = hiddenBoxRef.current
    const currentPicks = picksRef.current
    const hitters = guessers.filter((p) => currentPicks[p.id] === hidden)
    const targetSuccess = hitters.length === 0

    const outcomes = [{ playerId: targetId, success: targetSuccess, bonus: MINIGAME_BONUS }]
    hitters.forEach((p) => outcomes.push({ playerId: p.id, success: true, bonus: MINIGAME_WINNER_BONUS }))

    setOutcome({ success: targetSuccess, hitterNames: hitters.map((p) => p.name) })
    if (targetSuccess) sfx.minigameWin()
    else sfx.minigameFail()
    setTimeout(() => onComplete(outcomes), OUTCOME_PAUSE_MS)
  }

  function handleHide(playerId, boxIndex) {
    if (playerId !== targetId || stageRef.current !== 'hiding' || preppingRef.current) return
    beginGuessing(boxIndex)
  }

  function handlePick(playerId, boxIndex) {
    if (finishedRef.current || stageRef.current !== 'guessing' || preppingRef.current) return
    if (picksRef.current[playerId] !== undefined) return
    const next = { ...picksRef.current, [playerId]: boxIndex }
    picksRef.current = next
    setPicks(next)
    sfx.pop()
    if (guessers.every((p) => next[p.id] !== undefined)) finish()
  }

  const handleHideRef = useRef(handleHide)
  handleHideRef.current = handleHide
  const handlePickRef = useRef(handlePick)
  handlePickRef.current = handlePick

  useEffect(() => {
    return onMinigameAction(({ playerId, action, boxIndex }) => {
      if (typeof boxIndex !== 'number') return
      if (action === 'hide') handleHideRef.current(playerId, boxIndex)
      else if (action === 'pick' && guessers.some((p) => p.id === playerId)) handlePickRef.current(playerId, boxIndex)
    })
  }, [])

  const target = players.find((p) => p.id === targetId)
  const secondsLeft = Math.ceil(timeLeftMs / 1000)

  return (
    <div className="minigame-body box-guess">
      <h2 className="minigame-heading">اطعن الصندوق!</h2>
      <p className="minigame-sub">
        {prepping ? (
          `استعد... يبدأ خلال ${prepLeft}`
        ) : stage === 'hiding' ? (
          <>
            <strong>{target?.name}</strong> يختار مكان اختبائه من هاتفه...
          </>
        ) : (
          <>
            <strong>{target?.name}</strong> يختبئ — البقية يخمنون من هواتفهم!
          </>
        )}
      </p>

      {prepping ? (
        <div className="minigame-timer">{prepLeft}</div>
      ) : outcome ? (
        <div className={`minigame-flash ${outcome.success ? 'hit' : 'miss'}`}>
          {outcome.success
            ? `${target?.name} نجا!`
            : `${outcome.hitterNames.join(' و')} ${outcome.hitterNames.length > 1 ? 'وجدوه' : 'وجده'}!`}
        </div>
      ) : (
        <div className="minigame-timer">{secondsLeft}</div>
      )}

      <div className="box-guess-grid">
        {Array.from({ length: BOX_GUESS_COUNT }).map((_, i) => {
          const pickers = guessers.filter((p) => picks[p.id] === i)
          const isHiddenBox = revealed && i === hiddenBox
          const boxState = isHiddenBox ? (outcome?.success ? 'safe' : 'hit') : ''
          return (
            <div key={i} className={`guess-box ${boxState} ${revealed ? 'revealed' : ''} ${prepping ? 'dim' : ''}`}>
              <span className="guess-box-number">{i + 1}</span>
              {pickers.length > 0 && (
                <div className="guess-box-pickers">
                  {pickers.map((p) => (
                    <span key={p.id} className="guess-box-picker-chip">
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
