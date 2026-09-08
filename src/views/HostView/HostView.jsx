import { useGameState } from '../../game/state/GameStateContext'
import { GamePhase } from '../../game/constants/gameStates'
import { PixiStage } from '../../pixi/PixiStage'
import { PlayerBar } from './components/PlayerBar'
import { MuteToggle } from './components/MuteToggle'
import { LobbyScene } from './scenes/LobbyScene'
import { CategorySelectionScene } from './scenes/CategorySelectionScene'
import { IntroScene } from './scenes/IntroScene'
import { QuestionScene } from './scenes/QuestionScene'
import { AnswerRevealScene } from './scenes/AnswerRevealScene'
import { FinalResultScene } from './scenes/FinalResultScene'
import { DeathGameScene } from './scenes/DeathGameScene'
import { useHostRelay } from '../../network/useHostRelay'
import { RelayStatus } from './components/RelayStatus'
import { useState } from 'react'
import { isMobileDevice } from '../../utils/deviceDetect'

const SCENES_BY_PHASE = {
  [GamePhase.LOBBY]: LobbyScene,
  [GamePhase.CATEGORY_SELECTION]: CategorySelectionScene,
  [GamePhase.INTRO]: IntroScene,
  [GamePhase.QUESTION]: QuestionScene,
  [GamePhase.ANSWER_REVEAL]: AnswerRevealScene,
  [GamePhase.DEATH_GAME]: DeathGameScene,
  [GamePhase.FINAL]: FinalResultScene,
}

const PHASES_WITH_PLAYER_BAR = new Set([
  GamePhase.CATEGORY_SELECTION,
  GamePhase.INTRO,
  GamePhase.QUESTION,
  GamePhase.ANSWER_REVEAL,
  GamePhase.DEATH_GAME,
])

const PHASES_WITH_SIDE_PANEL = new Set([GamePhase.QUESTION, GamePhase.ANSWER_REVEAL])

const COMPACT_STAGE_PHASES = new Set([
  GamePhase.LOBBY,
  GamePhase.CATEGORY_SELECTION,
  GamePhase.INTRO,
  GamePhase.FINAL,
])

export function HostView() {
  const { state } = useGameState()
  const [isMobile] = useState(isMobileDevice)
  const { relayUp, connectedPhones } = useHostRelay(state, !isMobile)
  const Scene = SCENES_BY_PHASE[state.phase]
  const showSidePanel = PHASES_WITH_SIDE_PANEL.has(state.phase)

  const compact = COMPACT_STAGE_PHASES.has(state.phase) || state.phase === GamePhase.DEATH_GAME

  if (isMobile) {
    return (
      <div className="player-view">
        <div className="player-view-card">
          <h1 className="scene-title" style={{ fontSize: 28 }}>
            هذه الشاشة لجهاز الكمبيوتر
          </h1>
          <p className="scene-subtitle">
            افتحوا هذا الرابط على الكمبيوتر أو التلفاز المتصل به لعرض اللعبة. للانضمام كلاعب من الهاتف، استخدموا{' '}
            <code>/player</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="host-view">
      {showSidePanel && Scene ? <Scene key={state.phase} /> : null}
      <div className="stage-area">
        <PixiStage
          players={state.players}
          phase={state.phase}
          shakeSeq={state.shakeSeq}
          flourishSeq={state.flourishSeq}
          compact={compact}
        />
        {PHASES_WITH_PLAYER_BAR.has(state.phase) && <PlayerBar />}
        {!showSidePanel && Scene ? <Scene key={state.phase} /> : null}
      </div>
      <MuteToggle />
      <RelayStatus relayUp={relayUp} connectedPhones={connectedPhones} />
    </div>
  )
}
