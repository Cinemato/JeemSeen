import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { initAudio, music, sfx } from '../../../audio/audioEngine'
import { getPlayerColorCss } from '../../../game/data/playerColors'
import { MIN_PLAYERS } from '../../../game/state/gameReducer'
import { CloseIcon, RerollIcon } from '../../../components/icons'

export function LobbyScene() {
  const { state } = useGameState()
  const service = useGameService()

  function handleStart() {
    initAudio()
    music.start()
    sfx.confirm()
    service.startCategorySelection()
  }

  const missing = MIN_PLAYERS - state.players.length
  const port = window.location.port ? `:${window.location.port}` : ''
  const joinUrl = state.hostIp
    ? `${window.location.protocol}//${state.hostIp}${port}/player`
    : `${window.location.protocol}//${window.location.host}/player`

  return (
    <div className="scene top-scene stage-flow-scene">
      <div className="lobby-logo">
        <span className="lobby-logo-jeem">جيم</span>
        <span className="lobby-logo-seen">سين</span>
      </div>
      <p className="scene-subtitle">لعبة أسئلة وتحديات عائلية — اختاروا فئاتكم وجاوبوا واستعدوا للتحدي!</p>

      <div className="join-code-panel">
        {state.roomCode ? (
          <>
            <p className="join-code-label">افتحوا {joinUrl} من هواتفكم وأدخلوا الكود</p>
            <div className="join-code-value">
              {state.roomCode.split('').map((digit, i) => (
                <span key={i}>{digit}</span>
              ))}
            </div>
          </>
        ) : (
          <p className="join-code-label">جاري إعداد الغرفة...</p>
        )}
      </div>

      <div className="lobby-players">
        {state.players.length === 0 && <span className="scene-subtitle">بانتظار انضمام اللاعبين من هواتفهم...</span>}

        {state.players.map((p) => {
          return (
            <div key={p.id} className="player-chip lobby-player-chip">
              <span className="player-chip-dot" style={{ background: getPlayerColorCss(p.colorIndex) }} />
              {p.name}
              <button
                type="button"
                className="chip-icon-btn"
                title="بدّل الشكل"
                onClick={() => {
                  sfx.select()
                  service.randomizePlayerVariant(p.id)
                }}
              >
                <RerollIcon />
              </button>
              <button
                type="button"
                className="chip-icon-btn chip-remove-btn"
                title="إزالة اللاعب"
                onClick={() => service.removePlayer(p.id)}
              >
                <CloseIcon />
              </button>
            </div>
          )
        })}
      </div>

      <button className="btn lobby-start-btn" onClick={handleStart} disabled={missing > 0}>
        ابدأ اختيار الفئات
      </button>
      {missing > 0 && (
        <p className="scene-subtitle lobby-hint">
          بانتظار انضمام {missing} {missing === 1 ? 'لاعب آخر' : 'لاعبين آخرين'} على الأقل ({MIN_PLAYERS} كحد أدنى)
        </p>
      )}
    </div>
  )
}
