import { useEffect, useRef, useState } from 'react'
import { createRelayConnection } from './relayClient'
import { useGameService } from '../game/state/gameService'
import { GamePhase } from '../game/constants/gameStates'
import { getMinigameMeta } from '../game/data/minigames'
import { getScheduleProgress, DIFFICULTY_LABELS } from '../game/state/gameReducer'
import { emitMinigameAction } from './minigameBus'

function buildPublicState(state) {
  const question = state.questionSchedule[state.questionIndex]
  const isRevealPhase = state.phase === GamePhase.ANSWER_REVEAL
  const minigameMeta = getMinigameMeta(state.activeMinigameId)
  const progress = getScheduleProgress(state)

  return {
    phase: state.phase,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      reaction: p.reaction,
      variantIndex: p.variantIndex,
      colorIndex: p.colorIndex,
    })),
    question: question
      ? {
          text: question.question,
          answers: question.answers,
          categoryName: question.categoryName,
          difficulty: progress.difficulty,
          difficultyLabel: DIFFICULTY_LABELS[progress.difficulty],
          questionInCategoryBlock: progress.questionInCategoryBlock,
          questionInRound: progress.questionInRound,
          roundSize: progress.roundSize,
        }
      : null,
    questionKey: state.questionIndex,
    questionDeadline: state.phase === GamePhase.QUESTION ? state.questionDeadline : null,
    answeredPlayerIds: Object.keys(state.answers),
    revealedAnswer: isRevealPhase ? state.revealedAnswer : null,
    minigame:
      state.phase === GamePhase.DEATH_GAME
        ? {
            id: state.activeMinigameId,
            mode: minigameMeta?.mode ?? 'solo',
            targetId: state.minigameTargetId,
            roundKey: state.flourishSeq,
            stage: state.minigameStage,
          }
        : null,
  }
}

export function useHostRelay(state, enabled = true) {
  const service = useGameService()
  const connRef = useRef(null)
  const [connectedPhones, setConnectedPhones] = useState(0)
  const [relayUp, setRelayUp] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const conn = createRelayConnection({
      role: 'host',
      onOpen: () => setRelayUp(true),
      onClose: () => setRelayUp(false),
      onMessage(msg) {
        if (msg.type === 'hostReady') {
          service.setRoomCode(msg.code, msg.hostIp)
        } else if (msg.type === 'joinRequest') {
          const id = `net_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
          service.addNetworkedPlayer(id, msg.name)
          conn.send({ type: 'playerAdded', tempId: msg.tempId, playerId: id })
          setConnectedPhones((n) => n + 1)
        } else if (msg.type === 'answer') {
          service.submitAnswer(msg.playerId, msg.answerIndex)
        } else if (msg.type === 'minigameAction') {
          const { type, playerId, action, ...extra } = msg
          emitMinigameAction(playerId, action, extra)
        } else if (msg.type === 'randomizeLook') {
          service.randomizePlayerVariant(msg.playerId)
        } else if (msg.type === 'setColor') {
          service.setPlayerColor(msg.playerId, msg.colorIndex)
        }
      },
    })
    connRef.current = conn
    return () => conn.close()
  }, [])

  useEffect(() => {
    if (!enabled) return
    connRef.current?.send({ type: 'state', payload: buildPublicState(state) })
  }, [state, enabled])

  return { relayUp, connectedPhones }
}
