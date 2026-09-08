import { useGameState } from '../../../game/state/GameStateContext'
import { getPlayerColorCss } from '../../../game/data/playerColors'

export function PlayerBar() {
  const { state } = useGameState()

  return (
    <div className="player-bar">
      {state.players.map((player) => {
        const hasAnswered = state.answers[player.id] !== undefined
        return (
          <div key={player.id} className={`player-chip ${hasAnswered ? 'answered' : ''}`}>
            <span className="player-chip-dot" style={{ background: getPlayerColorCss(player.colorIndex) }} />
            <span>{player.name}</span>
            <span className="score">{player.score}</span>
          </div>
        )
      })}
    </div>
  )
}
