import { useGameState } from './GameStateContext'

export function useGameService() {
  const { dispatch } = useGameState()

  return {
    setRoomCode: (code, hostIp) => dispatch({ type: 'SET_ROOM_CODE', payload: { code, hostIp } }),

    addNetworkedPlayer: (id, name) => dispatch({ type: 'ADD_NETWORKED_PLAYER', payload: { id, name } }),

    removePlayer: (playerId) => dispatch({ type: 'REMOVE_PLAYER', payload: { playerId } }),

    randomizePlayerVariant: (playerId) =>
      dispatch({ type: 'RANDOMIZE_PLAYER_VARIANT', payload: { playerId } }),

    setPlayerColor: (playerId, colorIndex) =>
      dispatch({ type: 'SET_PLAYER_COLOR', payload: { playerId, colorIndex } }),

    setMinigameStage: (stage) => dispatch({ type: 'SET_MINIGAME_STAGE', payload: { stage } }),

    startCategorySelection: () => dispatch({ type: 'START_CATEGORY_SELECTION' }),

    toggleCategory: (categoryId) =>
      dispatch({ type: 'TOGGLE_CATEGORY', payload: { categoryId } }),

    confirmCategories: () => dispatch({ type: 'CONFIRM_CATEGORIES' }),

    startQuestion: () => dispatch({ type: 'START_QUESTION' }),

    submitAnswer: (playerId, answerIndex) =>
      dispatch({ type: 'SUBMIT_ANSWER', payload: { playerId, answerIndex } }),

    revealAnswer: () => dispatch({ type: 'REVEAL_ANSWER' }),

    nextQuestion: () => dispatch({ type: 'NEXT_QUESTION' }),

    completeMinigame: (outcomes) => dispatch({ type: 'COMPLETE_MINIGAME', payload: { outcomes } }),

    resetGame: () => dispatch({ type: 'RESET_GAME' }),
  }
}
