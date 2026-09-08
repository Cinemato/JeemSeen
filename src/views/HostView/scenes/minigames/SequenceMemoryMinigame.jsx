import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../../../audio/audioEngine'
import { MINIGAME_BONUS } from '../../../../game/state/gameReducer'
import { SIMON_PAD_COLORS } from '../../../../game/data/minigames'
import { onMinigameAction } from '../../../../network/minigameBus'
import { useGameService } from '../../../../game/state/gameService'
import { usePrepCountdown } from './usePrepCountdown'

const START_LEN = 2
const MAX_LEN = 6
const SHOW_STEP_MS = 550
const OUTCOME_PAUSE_MS = 1300

export function SequenceMemoryMinigame({ player, onComplete }) {
  const { prepping, prepLeft } = usePrepCountdown()
  const service = useGameService()
  const [sequence, setSequence] = useState(() =>
    Array.from({ length: START_LEN }, () => Math.floor(Math.random() * SIMON_PAD_COLORS.length))
  )
  const [stage, setStage] = useState('showing')
  const [activePad, setActivePad] = useState(null)
  const [flashPad, setFlashPad] = useState(null)
  const [inputCount, setInputCount] = useState(0)
  const [outcome, setOutcome] = useState(null)

  const finishedRef = useRef(false)
  const sequenceRef = useRef(sequence)
  const stageRef = useRef(stage)
  const inputIndexRef = useRef(0)
  const timeoutsRef = useRef([])

  function clearTimeouts() {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  function schedule(fn, delay) {
    const id = setTimeout(fn, delay)
    timeoutsRef.current.push(id)
    return id
  }

  function setStageBoth(next) {
    stageRef.current = next
    setStage(next)
    service.setMinigameStage(next)
  }

  function playback() {
    clearTimeouts()
    setStageBoth('showing')
    setInputCount(0)
    inputIndexRef.current = 0
    const seq = sequenceRef.current
    seq.forEach((pad, i) => {
      schedule(() => setActivePad(pad), i * SHOW_STEP_MS)
      schedule(() => setActivePad(null), i * SHOW_STEP_MS + SHOW_STEP_MS * 0.6)
    })
    schedule(() => setStageBoth('input'), seq.length * SHOW_STEP_MS + 250)
  }

  useEffect(() => {
    if (prepping) return
    playback()
    return clearTimeouts
  }, [prepping])

  function finish(success) {
    if (finishedRef.current) return
    finishedRef.current = true
    clearTimeouts()
    setOutcome(success ? 'success' : 'fail')
    if (success) sfx.minigameWin()
    else sfx.minigameFail()
    setTimeout(() => onComplete([{ playerId: player.id, success, bonus: MINIGAME_BONUS }]), OUTCOME_PAUSE_MS)
  }

  function handleTap(padIndex) {
    if (finishedRef.current || stageRef.current !== 'input') return
    setFlashPad(padIndex)
    schedule(() => setFlashPad(null), 220)

    const seq = sequenceRef.current
    const idx = inputIndexRef.current
    if (seq[idx] !== padIndex) {
      sfx.buzzer()
      finish(false)
      return
    }
    sfx.pop()
    const nextIdx = idx + 1
    inputIndexRef.current = nextIdx
    setInputCount(nextIdx)

    if (nextIdx >= seq.length) {
      if (seq.length >= MAX_LEN) {
        finish(true)
        return
      }
      const grown = [...seq, Math.floor(Math.random() * SIMON_PAD_COLORS.length)]
      sequenceRef.current = grown
      setSequence(grown)
      schedule(playback, 600)
    }
  }

  const handleTapRef = useRef(handleTap)
  handleTapRef.current = handleTap

  useEffect(() => {
    return onMinigameAction(({ playerId, action, padIndex }) => {
      if (playerId === player.id && action === 'tap' && typeof padIndex === 'number') handleTapRef.current(padIndex)
    })
  }, [player.id])

  return (
    <div className="minigame-body">
      <h2 className="minigame-heading">تذكر التسلسل!</h2>
      <p className="minigame-sub">
        دور <strong>{player.name}</strong> —{' '}
        {prepping
          ? `استعد... يبدأ خلال ${prepLeft}`
          : stage === 'showing'
            ? 'شاهد الترتيب...'
            : `كرره من هاتفك (${inputCount}/${sequence.length})`}
      </p>

      {outcome ? (
        <div className={`minigame-flash ${outcome === 'success' ? 'hit' : 'miss'}`}>
          {outcome === 'success' ? 'ذاكرة ممتازة!' : 'ترتيب خاطئ!'}
        </div>
      ) : (
        <div className="minigame-timer">{prepping ? prepLeft : sequence.length}</div>
      )}

      <div className="simon-pad-grid">
        {SIMON_PAD_COLORS.map((color, i) => (
          <div
            key={i}
            className={`simon-pad display-only ${activePad === i ? 'active' : ''} ${flashPad === i ? 'flash' : ''} ${prepping ? 'dim' : ''}`}
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  )
}
