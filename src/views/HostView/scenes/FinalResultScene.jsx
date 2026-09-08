import { useEffect } from 'react'
import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { ScoreBoard } from '../components/ScoreBoard'
import { sfx, music } from '../../../audio/audioEngine'

export function FinalResultScene() {
  const { state } = useGameState()
  const service = useGameService()
  const winner = [...state.players].sort((a, b) => b.score - a.score)[0]

  useEffect(() => {
    music.stop()
    sfx.drumroll()
    const id = setTimeout(() => sfx.fanfare(), 900)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="scene top-scene stage-flow-scene">
      <h1 className="scene-title">{winner?.name} يفوز!</h1>
      <ScoreBoard players={state.players} />
      <button className="btn" onClick={service.resetGame}>
        لعبة جديدة
      </button>
    </div>
  )
}
