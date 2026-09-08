import { Navigate, Route, Routes } from 'react-router-dom'
import { GameStateProvider } from './game/state/GameStateContext'
import { HostView } from './views/HostView/HostView'
import { PlayerView } from './views/PlayerView/PlayerView'

export default function App() {
  return (
    <GameStateProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/host" replace />} />
        <Route path="/host" element={<HostView />} />
        <Route path="/player" element={<PlayerView />} />
      </Routes>
    </GameStateProvider>
  )
}
