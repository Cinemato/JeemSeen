import { useEffect, useMemo, useState } from 'react'
import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { MINIGAME_COMPONENTS } from './minigames'
import { getMinigameMeta } from '../../../game/data/minigames'
import { sfx } from '../../../audio/audioEngine'

const STAGE_INTRO = 'intro'
const STAGE_PLAYING = 'playing'

const SOLO_TAGLINES = ['التحدي يبدأ الآن...', 'وحدك في الميدان!', 'كل الأنظار عليك الآن!']
const GROUP_TAGLINES = ['الجميع يشارك هذه المرة!', 'فوضى جماعية قادمة!', 'لا أحد بمأمن الآن!']

export function DeathGameScene() {
  const { state } = useGameState()
  const service = useGameService()
  const [stage, setStage] = useState(STAGE_INTRO)

  const target = state.players.find((p) => p.id === state.minigameTargetId)
  const meta = getMinigameMeta(state.activeMinigameId)
  const isGroup = meta?.mode === 'group'
  const MinigameComponent = MINIGAME_COMPONENTS[state.activeMinigameId]

  const tagline = useMemo(() => {
    const pool = isGroup ? GROUP_TAGLINES : SOLO_TAGLINES
    return pool[Math.floor(Math.random() * pool.length)]
  }, [state.minigameTargetId, state.activeMinigameId])

  useEffect(() => {
    setStage(STAGE_INTRO)
    sfx.drumroll()
    const id = setTimeout(() => {
      sfx.minigameStart()
      setStage(STAGE_PLAYING)
    }, 2200)
    return () => clearTimeout(id)
  }, [state.minigameTargetId, state.activeMinigameId])

  function handleComplete(outcomes) {
    service.completeMinigame(outcomes)
  }

  if (!target) return null

  return (
    <div className="scene top-scene stage-flow-scene minigame-scene">
      {stage === STAGE_INTRO && (
        <div className="minigame-intro">
          <p className="scene-subtitle">الأقل إجابات صحيحة في آخر 4 أسئلة</p>
          <h1 className="scene-title">دور {target.name}!</h1>
          <p className="scene-subtitle">{tagline}</p>
          {isGroup && <p className="scene-subtitle">{meta.name}</p>}
        </div>
      )}

      {stage === STAGE_PLAYING && MinigameComponent && (
        <MinigameComponent
          player={target}
          players={state.players}
          targetId={target.id}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
