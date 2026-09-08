import { createContext, useContext, useReducer } from 'react'
import { gameReducer, createInitialState } from './gameReducer'

const GameStateContext = createContext(null)

export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameState must be used within a GameStateProvider')
  return ctx
}
