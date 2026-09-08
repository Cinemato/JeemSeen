import { useEffect } from 'react'
import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { sfx } from '../../../audio/audioEngine'
import { QUESTIONS_BETWEEN_MINIGAMES } from '../../../game/state/gameReducer'

const LETTERS = ['أ', 'ب', 'ج', 'د']

export function AnswerRevealScene() {
  const { state } = useGameState()
  const service = useGameService()
  const question = state.questionSchedule[state.questionIndex]
  const isNextStepMinigame = state.questionsSinceMinigame + 1 >= QUESTIONS_BETWEEN_MINIGAMES

  useEffect(() => {
    const anyoneCorrect = state.players.some((p) => p.reaction === 'celebrate')
    if (anyoneCorrect) sfx.correct()
    else sfx.wrong()
  }, [])

  if (!question) return null

  return (
    <div className="side-panel">
      <h1 className="scene-title">{question.question}</h1>
      <div className="answer-list">
        {question.answers.map((answer, i) => (
          <div
            className={`answer-btn ${i === state.revealedAnswer ? 'correct' : ''}`}
            key={i}
          >
            {LETTERS[i]}. {answer}
          </div>
        ))}
      </div>
      <button className="btn" onClick={service.nextQuestion}>
        {isNextStepMinigame ? 'إلى التحدي' : 'السؤال التالي'}
      </button>
    </div>
  )
}
