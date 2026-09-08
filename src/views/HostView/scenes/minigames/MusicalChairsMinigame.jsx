import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../../audio/audioEngine'
import { MINIGAME_BONUS, MINIGAME_WINNER_BONUS } from '../../../../game/state/gameReducer'
import { getPlayerColorCss } from '../../../../game/data/playerColors'
import { onMinigameAction } from '../../../../network/minigameBus'
import { useGameService } from '../../../../game/state/gameService'
import { usePrepCountdown } from './usePrepCountdown'

const MIN_WAIT_MS = 2000
const MAX_WAIT_MS = 4500
const RESPONSE_WINDOW_MS = 2200
const DID_NOT_CLICK_TIME = RESPONSE_WINDOW_MS + 1000

export function MusicalChairsMinigame({ players, targetId, onComplete }) {
  const { prepping, prepLeft, preppingRef } = usePrepCountdown()
  const service = useGameService()
  const [phase, setPhase] = useState('waiting')
  const [disqualified, setDisqualified] = useState(() => new Set())
  const [clickedAt, setClickedAt] = useState({})
  const [outcome, setOutcome] = useState(null)
  const finishedRef = useRef(false)
  const stopTimeRef = useRef(null)
  const stateRef = useRef({ disqualified: new Set(), clickedAt: {} })

  useEffect(() => {
    if (prepping) return
    service.setMinigameStage('active')
    const tickInterval = setInterval(() => sfx.tick(), 320)
    const stopTimeout = setTimeout(() => {
      clearInterval(tickInterval)
      sfx.buzzer()
      stopTimeRef.current = performance.now()
      setPhase('stopped')
    }, MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS))

    const failSafe = setTimeout(finish, MIN_WAIT_MS + MAX_WAIT_MS + RESPONSE_WINDOW_MS + 200)

    return () => {
      clearInterval(tickInterval)
      clearTimeout(stopTimeout)
      clearTimeout(failSafe)
    }
  }, [prepping])

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true

    const { disqualified: dq, clickedAt: times } = stateRef.current
    const scored = players.map((p) => ({
      id: p.id,
      time: dq.has(p.id) ? Infinity : times[p.id] ?? DID_NOT_CLICK_TIME,
    }))
    scored.sort((a, b) => a.time - b.time)

    const worstTime = scored[scored.length - 1].time
    const atWorst = scored.filter((s) => s.time === worstTime)
    const targetIsSoleLast = atWorst.length === 1 && atWorst[0].id === targetId

    const winner = scored[0]
    const winnerIsUnique = winner.time < (scored[1]?.time ?? Infinity)
    const targetSuccess = !targetIsSoleLast

    const outcomes = [{ playerId: targetId, success: targetSuccess, bonus: MINIGAME_BONUS }]
    if (winnerIsUnique && winner.id !== targetId) {
      outcomes.push({ playerId: winner.id, success: true, bonus: MINIGAME_WINNER_BONUS })
    }

    const winnerPlayer = players.find((p) => p.id === winner.id)
    setOutcome({ success: targetSuccess, winnerName: winnerIsUnique ? winnerPlayer?.name : null })
    if (targetSuccess) sfx.minigameWin()
    else sfx.minigameFail()
    setTimeout(() => onComplete(outcomes), 1500)
  }

  function maybeFinishEarly() {
    const { disqualified: dq, clickedAt: times } = stateRef.current
    const allAccounted = players.every((p) => dq.has(p.id) || times[p.id] !== undefined)
    if (allAccounted) finish()
  }

  function handleSit(playerId) {
    if (finishedRef.current || preppingRef.current) return
    if (stateRef.current.disqualified.has(playerId) || stateRef.current.clickedAt[playerId] !== undefined) return

    if (phase === 'waiting') {
      stateRef.current.disqualified = new Set(stateRef.current.disqualified).add(playerId)
      setDisqualified(new Set(stateRef.current.disqualified))
      sfx.buzzer()
      return
    }

    const elapsed = performance.now() - stopTimeRef.current
    stateRef.current.clickedAt = { ...stateRef.current.clickedAt, [playerId]: elapsed }
    setClickedAt({ ...stateRef.current.clickedAt })
    sfx.pop()
    maybeFinishEarly()
  }

  const handleSitRef = useRef(handleSit)
  handleSitRef.current = handleSit

  useEffect(() => {
    return onMinigameAction(({ playerId, action }) => {
      if (action === 'sit' && players.some((p) => p.id === playerId)) handleSitRef.current(playerId)
    })
  }, [players])

  const target = players.find((p) => p.id === targetId)

  return (
    <div className="minigame-body">
      <h2 className="minigame-heading">الكراسي الموسيقية!</h2>
      <p className="minigame-sub">
        {prepping ? (
          `استعد... يبدأ خلال ${prepLeft}`
        ) : (
          <>
            لا تضغطوا على هواتفكم قبل أن تتوقف الموسيقى! <strong>{target?.name}</strong> يجب ألا يكون الأبطأ بمفرده.
          </>
        )}
      </p>

      {prepping ? (
        <div className="minigame-timer">{prepLeft}</div>
      ) : outcome ? (
        <div className={`minigame-flash ${outcome.success ? 'hit' : 'miss'}`}>
          {outcome.winnerName ? `${outcome.winnerName} الأسرع — ` : ''}
          {outcome.success ? `${target?.name} نجا!` : `${target?.name} كان الأبطأ!`}
        </div>
      ) : (
        <div className={`chairs-signal ${phase}`}>
          {phase === 'waiting' ? (
            <span className="chairs-bars">
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : (
            'توقفت الموسيقى!'
          )}
        </div>
      )}

      <div className="chairs-grid">
        {players.map((p) => {
          const color = getPlayerColorCss(p.colorIndex)
          const isDq = disqualified.has(p.id)
          const hasClicked = clickedAt[p.id] !== undefined
          const isTarget = p.id === targetId
          return (
            <div
              key={p.id}
              className={`chairs-button display-only ${isDq ? 'dq' : ''} ${hasClicked ? 'done' : ''} ${isTarget ? 'is-target' : ''} ${prepping ? 'dim' : ''}`}
              style={{ borderColor: color }}
            >
              <span>{p.name}</span>
              <span className="chairs-status">{isDq ? 'خرج مبكرًا' : hasClicked ? 'جلس' : 'اجلس!'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
