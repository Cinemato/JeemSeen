import { useEffect, useMemo } from 'react'
import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { sfx } from '../../../audio/audioEngine'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, getScheduleProgress } from '../../../game/state/gameReducer'

const SILLY_LINES = [
  'استعدوا للفوضى!',
  'هل أنتم مستعدون؟',
  'العقول تعمل الآن!',
  'ارفعوا أيديكم لو عارفين الإجابة!',
  'حماس أكتر من اللازم!',
  'لا تخافوا... أو خافوا شوي',
]

export function IntroScene() {
  const { state } = useGameState()
  const service = useGameService()
  const progress = getScheduleProgress(state)
  const { difficultyTierIndex, roundSize } = progress
  const difficultyColor = DIFFICULTY_COLORS[progress.difficulty]

  const line = useMemo(() => SILLY_LINES[Math.floor(Math.random() * SILLY_LINES.length)], [difficultyTierIndex])

  useEffect(() => {
    sfx.whoosh()
    const id = setTimeout(() => service.startQuestion(), 2400)
    return () => clearTimeout(id)
  }, [difficultyTierIndex])

  return (
    <div className="scene top-scene stage-flow-scene">
      <p className="scene-subtitle">المستوى {difficultyTierIndex + 1} من 3</p>
      <h1
        className="scene-title"
        style={{ fontSize: 'clamp(40px, 6vw, 80px)', color: difficultyColor, textShadow: `0 4px 24px ${difficultyColor}66` }}
      >
        {DIFFICULTY_LABELS[progress.difficulty]}
      </h1>
      <p className="scene-subtitle">{roundSize} أسئلة قادمة — {line}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {state.categoryQueue.map((id) => {
          const c = state.availableCategories.find((cat) => cat.id === id)
          return (
            <span key={id} className="category-tag">
              {c.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}
