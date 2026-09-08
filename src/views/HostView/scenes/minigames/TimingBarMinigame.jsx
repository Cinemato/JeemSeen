import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../../audio/audioEngine'
import { MINIGAME_BONUS } from '../../../../game/state/gameReducer'
import { onMinigameAction } from '../../../../network/minigameBus'
import { useGameService } from '../../../../game/state/gameService'
import { usePrepCountdown } from './usePrepCountdown'

const ROUNDS = 4
const HITS_NEEDED = 3
const ZONE_WIDTH = 13
const OUTCOME_PAUSE_MS = 1300

function randomZoneStart() {
  return 10 + Math.random() * (100 - ZONE_WIDTH - 20)
}

export function TimingBarMinigame({ player, onComplete }) {
  const { prepping, prepLeft, preppingRef } = usePrepCountdown()
  const service = useGameService()
  const [round, setRound] = useState(0)
  const [hits, setHits] = useState(0)
  const [markerPos, setMarkerPos] = useState(0)
  const [zoneStart, setZoneStart] = useState(randomZoneStart)
  const [flash, setFlash] = useState(null)
  const [locked, setLocked] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const finishedRef = useRef(false)
  const startRef = useRef(performance.now())

  useEffect(() => {
    if (prepping) return
    service.setMinigameStage('active')
    startRef.current = performance.now()
    let frame
    const speed = 0.95 + round * 0.22
    const loop = (now) => {
      const elapsed = (now - startRef.current) / 1000
      const t = (elapsed / speed) % 2
      const pos = t <= 1 ? t * 100 : (2 - t) * 100
      setMarkerPos(pos)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [round, prepping])

  function handleStop() {
    if (locked || finishedRef.current || preppingRef.current) return
    setLocked(true)
    const isHit = markerPos >= zoneStart && markerPos <= zoneStart + ZONE_WIDTH
    const nextHits = hits + (isHit ? 1 : 0)
    setHits(nextHits)
    setFlash(isHit ? 'hit' : 'miss')
    if (isHit) sfx.pop()
    else sfx.buzzer()

    setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= ROUNDS) {
        finishedRef.current = true
        const success = nextHits >= HITS_NEEDED
        setFlash(null)
        setOutcome(success ? 'success' : 'fail')
        if (success) sfx.minigameWin()
        else sfx.minigameFail()
        setTimeout(() => onComplete([{ playerId: player.id, success, bonus: MINIGAME_BONUS }]), OUTCOME_PAUSE_MS)
        return
      }
      setRound(nextRound)
      setZoneStart(randomZoneStart())
      setFlash(null)
      setLocked(false)
      startRef.current = performance.now()
    }, 700)
  }
  
  const handleStopRef = useRef(handleStop)
  handleStopRef.current = handleStop

  useEffect(() => {
    return onMinigameAction(({ playerId, action }) => {
      if (playerId === player.id && action === 'stop') handleStopRef.current()
    })
  }, [player.id])

  return (
    <div className="minigame-body">
      <h2 className="minigame-heading">قف في الوقت المناسب!</h2>
      <p className="minigame-sub">
        دور <strong>{player.name}</strong> —{' '}
        {prepping
          ? `استعد... يبدأ خلال ${prepLeft}`
          : `أوقف المؤشر من هاتفك داخل المنطقة الخضراء (${hits}/${HITS_NEEDED} إصابات، جولة ${round + 1} من ${ROUNDS})`}
      </p>

      <div className={`timing-bar ${prepping ? 'dim' : ''}`}>
        <div className="timing-zone" style={{ insetInlineStart: `${zoneStart}%`, width: `${ZONE_WIDTH}%` }} />
        <div className="timing-marker" style={{ insetInlineStart: `calc(${markerPos}% - 3px)` }} />
      </div>

      {prepping ? (
        <div className="minigame-timer">{prepLeft}</div>
      ) : outcome ? (
        <div className={`minigame-flash ${outcome === 'success' ? 'hit' : 'miss'}`}>
          {outcome === 'success' ? 'نجح!' : 'لم يكفِ'}
        </div>
      ) : (
        flash && <div className={`minigame-flash ${flash}`}>{flash === 'hit' ? 'إصابة!' : 'خطأ!'}</div>
      )}
    </div>
  )
}
