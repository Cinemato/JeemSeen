import { useEffect } from 'react'
import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { Timer } from '../components/Timer'
import { sfx } from '../../../audio/audioEngine'
import { QUESTION_SECONDS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, getScheduleProgress } from '../../../game/state/gameReducer'

const LETTERS = ['أ', 'ب', 'ج', 'د']

export function QuestionScene() {
  const { state } = useGameState()
  const service = useGameService()
  const question = state.questionSchedule[state.questionIndex]
  const allAnswered = Object.keys(state.answers).length >= state.players.length
  const progress = getScheduleProgress(state)

  useEffect(() => {
    if (allAnswered) {
      sfx.answerLock()
      const id = setTimeout(() => service.revealAnswer(), 500)
      return () => clearTimeout(id)
    }
  }, [allAnswered])

  if (!question) return null

  return (
    <div className="side-panel">
      <Timer seconds={QUESTION_SECONDS} running={!allAnswered} onExpire={service.revealAnswer} />
      <div className="category-tag-row">
        <span className="category-tag">
          {question.categoryName} · {progress.questionInCategoryBlock}/2
        </span>
        <span
          className="category-tag difficulty-tag"
          style={{ borderColor: DIFFICULTY_COLORS[progress.difficulty], color: DIFFICULTY_COLORS[progress.difficulty] }}
        >
          {DIFFICULTY_LABELS[progress.difficulty]} · {progress.questionInRound}/{progress.roundSize}
        </span>
      </div>
      <h1 className="scene-title">{question.question}</h1>
      <div className="answer-list">
        {question.answers.map((answer, i) => (
          <div className="answer-btn" key={i}>
            {LETTERS[i]}. {answer}
          </div>
        ))}
      </div>
      <p className="scene-subtitle">أجيبوا من هواتفكم الآن...</p>
    </div>
  )
}
