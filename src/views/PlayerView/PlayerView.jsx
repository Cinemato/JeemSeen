import { useEffect, useRef, useState } from 'react'
import { createRelayConnection } from '../../network/relayClient'
import { GamePhase } from '../../game/constants/gameStates'
import { isMobileDevice } from '../../utils/deviceDetect'
import { BOX_GUESS_COUNT, SIMON_PAD_COLORS } from '../../game/data/minigames'
import { PLAYER_COLORS, getPlayerColorCss } from '../../game/data/playerColors'
import { DIFFICULTY_COLORS } from '../../game/state/gameReducer'
import { CharacterPreview } from '../../pixi/CharacterPreview'
import { RerollIcon } from '../../components/icons'

const PHASE_WAITING_TEXT = {
  [GamePhase.CATEGORY_SELECTION]: 'المضيف يختار الفئات الآن...',
  [GamePhase.INTRO]: 'الجولة القادمة تبدأ الآن...',
}

const LETTERS = ['أ', 'ب', 'ج', 'د']

function questionFontSize(text) {
  const len = text?.length ?? 0
  if (len <= 45) return 20
  if (len <= 75) return 18.5
  if (len <= 110) return 17
  return 16
}

const MINIGAME_ACTION = {
  'mash-race': { action: 'press', label: 'اضغط!' },
  'group-race': { action: 'press', label: 'اضغط!' },
  'timing-bar': { action: 'stop', label: 'قف الآن!' },
  'musical-chairs': { action: 'sit', label: 'اجلس!' },
}

export function PlayerView() {
  const [isMobile] = useState(isMobileDevice)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [joined, setJoined] = useState(false)
  const [playerId, setPlayerId] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState(null)
  const [publicState, setPublicState] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [pulse, setPulse] = useState(false)
  const [acted, setActed] = useState(false)
  const [minigameOutcome, setMinigameOutcome] = useState(null)
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(null)
  const connRef = useRef(null)
  const playerIdRef = useRef(null)
  const prevPhaseRef = useRef(null)
  const outcomeTimeoutRef = useRef(null)

  useEffect(() => {
    if (!isMobile) return
    const conn = createRelayConnection({
      role: 'player',
      onOpen: () => setConnectionStatus('connected'),
      onClose: () => setConnectionStatus('disconnected'),
      onMessage(msg) {
        if (msg.type === 'joined') {
          playerIdRef.current = msg.playerId
          setPlayerId(msg.playerId)
          setJoined(true)
          setJoinError(null)
        } else if (msg.type === 'joinError') {
          setJoinError(msg.message)
        } else if (msg.type === 'state') {
          setPublicState(msg.payload)
        } else if (msg.type === 'hostDisconnected') {
          setConnectionStatus('disconnected')
        }
      },
    })
    connRef.current = conn
    return () => conn.close()
  }, [])

  useEffect(() => {
    setSelectedAnswer(null)
  }, [publicState?.questionKey])

  useEffect(() => {
    const deadline = publicState?.questionDeadline
    if (!deadline) {
      setQuestionSecondsLeft(null)
      return
    }
    const tick = () => setQuestionSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [publicState?.questionDeadline])

  useEffect(() => {
    setActed(false)
  }, [publicState?.minigame?.roundKey])

  useEffect(() => {
    const phase = publicState?.phase
    const me = publicState?.players?.find((p) => p.id === playerIdRef.current)
    if (prevPhaseRef.current === GamePhase.DEATH_GAME && phase !== GamePhase.DEATH_GAME && me) {
      if (me.reaction === 'celebrate') setMinigameOutcome('win')
      else if (me.reaction === 'sad') setMinigameOutcome('lose')
    }
    prevPhaseRef.current = phase
  }, [publicState])

  useEffect(() => {
    if (!minigameOutcome) return
    clearTimeout(outcomeTimeoutRef.current)
    outcomeTimeoutRef.current = setTimeout(() => setMinigameOutcome(null), 2600)
    return () => clearTimeout(outcomeTimeoutRef.current)
  }, [minigameOutcome])

  function handleJoin(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedCode = code.trim()
    if (!trimmedName || trimmedCode.length !== 4) return
    connRef.current?.send({ type: 'join', name: trimmedName, code: trimmedCode })
  }

  function handleAnswer(index) {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    connRef.current?.send({ type: 'answer', answerIndex: index })
  }

  function handleMinigameAction(action, extra = {}) {
    connRef.current?.send({ type: 'minigameAction', action, ...extra })
    setPulse(true)
    setTimeout(() => setPulse(false), 90)
    if (action === 'sit' || action === 'stop' || action === 'pick' || action === 'hide') setActed(true)
  }

  function handleRandomizeLook() {
    connRef.current?.send({ type: 'randomizeLook' })
  }

  function handleSetColor(colorIndex) {
    connRef.current?.send({ type: 'setColor', colorIndex })
  }

  if (!isMobile) {
    return (
      <div className="player-view">
        <div className="player-view-card">
          <h1 className="scene-title" style={{ fontSize: 28 }}>
            هذه الصفحة للهاتف فقط
          </h1>
          <p className="scene-subtitle">
            افتحوا هذا الرابط من هاتفكم للانضمام كلاعب. شاشة الكمبيوتر مخصصة لعرض اللعبة فقط — استخدموا{' '}
            <code>/host</code> عليها بدلًا من ذلك.
          </p>
        </div>
      </div>
    )
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="player-view">
        <div className="player-view-card">
          <h1 className="scene-title" style={{ fontSize: 28 }}>
            انقطع الاتصال
          </h1>
          <p className="scene-subtitle">تأكدوا أن هاتفكم متصل بنفس شبكة واي فاي الخاصة بجهاز المضيف، ثم أعيدوا فتح الصفحة.</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className="player-view">
        <div className="player-view-card">
          <h1 className="scene-title" style={{ fontSize: 28 }}>
            جاري الاتصال...
          </h1>
        </div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="player-view">
        <div className="player-view-card">
          <div className="lobby-logo" style={{ fontSize: 'clamp(36px, 12vw, 56px)' }}>
            <span className="lobby-logo-jeem">جيم</span>
            <span className="lobby-logo-seen">سين</span>
          </div>
          <form className="player-join-form" onSubmit={handleJoin}>
            <input
              autoFocus
              className="player-code-input"
              placeholder="كود اللعبة"
              value={code}
              maxLength={4}
              inputMode="numeric"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className="player-name-input"
              placeholder="اكتب اسمك"
              value={name}
              maxLength={16}
              onChange={(e) => setName(e.target.value)}
            />
            {joinError && <p className="player-join-error">{joinError}</p>}
            <button type="submit" className="btn" disabled={!name.trim() || code.trim().length !== 4}>
              انضمام
            </button>
          </form>
        </div>
      </div>
    )
  }

  const phase = publicState?.phase
  const me = publicState?.players?.find((p) => p.id === playerId)
  const hasAnswered = publicState?.answeredPlayerIds.includes(playerId)
  const minigame = publicState?.minigame
  const inMinigame = phase === GamePhase.DEATH_GAME && minigame
  const canAct = inMinigame && (minigame.mode === 'group' || minigame.targetId === playerId)
  const actionSpec = minigame ? MINIGAME_ACTION[minigame.id] : null
  const isOneShot = minigame?.id === 'musical-chairs'
  const isFinal = phase === GamePhase.FINAL
  const isLobby = phase === GamePhase.LOBBY
  const amWinner = isFinal && me?.reaction === 'celebrate'
  const winners = isFinal ? (publicState.players ?? []).filter((p) => p.reaction === 'celebrate') : []
  const targetName = minigame ? publicState.players?.find((p) => p.id === minigame.targetId)?.name : null
  const takenColorIndices = new Set((publicState?.players ?? []).filter((p) => p.id !== playerId).map((p) => p.colorIndex))

  return (
    <div className="player-view">
      <div className="player-view-card">
        {minigameOutcome && (
          <div className={`player-outcome-flash ${minigameOutcome}`}>
            {minigameOutcome === 'win' ? 'فزت في التحدي!' : 'لم تنجح هذه المرة'}
          </div>
        )}

        <div className="player-header-bar">
          <span className="player-header-name">{me?.name ?? name}</span>
          {me && <span className="player-header-score">{me.score}</span>}
        </div>

        {isFinal && (
          <div className={`player-final-result ${amWinner ? 'win' : 'lose'}`}>
            <h2 className="player-final-title">{amWinner ? 'فزت باللعبة!' : 'خسرت هذه المرة'}</h2>
            {!amWinner && (
              <p className="player-final-sub">
                {winners.length === 1
                  ? `${winners[0].name} فاز بالمركز الأول`
                  : winners.length > 1
                    ? `${winners.map((w) => w.name).join(' و')} تعادلوا في المركز الأول`
                    : 'انتهت اللعبة'}
              </p>
            )}
            {me && <p className="player-final-score">نقاطك النهائية: {me.score}</p>}
          </div>
        )}

        {isLobby && me && (
          <div className="player-lobby-customize">
            <p className="player-status-text">بانتظار بدء اللعبة — جهّز شخصيتك!</p>
            <div className="player-character-preview">
              <CharacterPreview variantIndex={me.variantIndex} colorIndex={me.colorIndex} name={me.name} />
            </div>
            <button type="button" className="player-reroll-btn" onClick={handleRandomizeLook}>
              <RerollIcon size={16} /> غيّر الشكل
            </button>
            <p className="player-color-label">اختر لونك</p>
            <div className="player-color-grid">
              {PLAYER_COLORS.map((c, i) => {
                const takenByOther = takenColorIndices.has(i)
                const isMine = me.colorIndex === i
                return (
                  <button
                    key={i}
                    type="button"
                    className={`player-color-swatch ${isMine ? 'selected' : ''} ${takenByOther ? 'taken' : ''}`}
                    style={{ background: getPlayerColorCss(i) }}
                    disabled={takenByOther}
                    title={c.name}
                    onClick={() => handleSetColor(i)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {!isFinal && !isLobby && phase === GamePhase.QUESTION && publicState.question && (
          <div key={publicState.questionKey} className="player-question-block">
            {questionSecondsLeft !== null && (
              <div className={`player-question-timer ${questionSecondsLeft <= 3 ? 'urgent' : ''}`}>{questionSecondsLeft}</div>
            )}
            <div className="player-question-meta-row">
              <span className="player-question-category">
                {publicState.question.categoryName} · {publicState.question.questionInCategoryBlock}/2
              </span>
              <span
                className="player-question-category difficulty"
                style={{
                  color: DIFFICULTY_COLORS[publicState.question.difficulty],
                  borderColor: DIFFICULTY_COLORS[publicState.question.difficulty],
                }}
              >
                {publicState.question.difficultyLabel} · {publicState.question.questionInRound}/{publicState.question.roundSize}
              </span>
            </div>
            <h2 className="player-question-text" style={{ fontSize: questionFontSize(publicState.question.text) }}>
              {publicState.question.text}
            </h2>
            <div className="player-answer-grid">
              {publicState.question.answers.map((answer, i) => {
                const isSelected = selectedAnswer === i
                const isLocked = hasAnswered || selectedAnswer !== null
                return (
                  <button
                    key={i}
                    className={`player-answer-btn ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'dimmed' : ''}`}
                    disabled={isLocked}
                    onClick={() => handleAnswer(i)}
                  >
                    <span className="player-answer-letter">{LETTERS[i]}</span>
                    {answer}
                  </button>
                )
              })}
            </div>
            {(hasAnswered || selectedAnswer !== null) && (
              <p className="player-status-text">تم إرسال إجابتك — بانتظار الباقي...</p>
            )}
          </div>
        )}

        {phase === GamePhase.ANSWER_REVEAL && (
          <div className={`player-result-badge ${me?.reaction === 'celebrate' ? 'correct' : 'wrong'}`}>
            {me?.reaction === 'celebrate' && 'إجابة صحيحة!'}
            {me?.reaction === 'sad' && 'إجابة خاطئة'}
            {me?.reaction === 'shock' && 'لم تُجب في الوقت!'}
          </div>
        )}

        {inMinigame && (
          <div key={minigame.roundKey} className="player-minigame-block">
            {!minigame.stage || minigame.stage === 'prep' ? (
              <p className="player-status-text">استعد... التحدي يبدأ قريبًا!</p>
            ) : minigame.id === 'box-guess' ? (
              minigame.targetId === playerId ? (
                minigame.stage === 'guessing' ? (
                  <p className="player-status-text">أنت مختبئ! انتظر النتيجة...</p>
                ) : acted ? (
                  <p className="player-status-text">تم! بانتظار انتهاء وقت الاختباء...</p>
                ) : (
                  <>
                    <p className="player-status-text">اختر مكان اختبائك!</p>
                    <div className="player-box-grid">
                      {Array.from({ length: BOX_GUESS_COUNT }).map((_, i) => (
                        <button key={i} className="player-box-btn" onClick={() => handleMinigameAction('hide', { boxIndex: i })}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </>
                )
              ) : minigame.stage !== 'guessing' ? (
                <p className="player-status-text">{targetName} يختار مكان اختبائه...</p>
              ) : acted ? (
                <p className="player-status-text">تم اختيارك! بانتظار النتيجة...</p>
              ) : (
                <>
                  <p className="player-status-text">أين يختبئ {targetName}؟ اختر صندوقًا!</p>
                  <div className="player-box-grid">
                    {Array.from({ length: BOX_GUESS_COUNT }).map((_, i) => (
                      <button key={i} className="player-box-btn" onClick={() => handleMinigameAction('pick', { boxIndex: i })}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )
            ) : minigame.id === 'sequence-memory' ? (
              minigame.targetId === playerId ? (
                <>
                  <p className="player-status-text">
                    {minigame.stage === 'showing' ? 'شاهد الترتيب على الشاشة الرئيسية...' : 'كرر التسلسل!'}
                  </p>
                  <div className="player-pad-grid">
                    {SIMON_PAD_COLORS.map((color, i) => (
                      <button
                        key={i}
                        className={`player-pad-btn ${pulse ? 'pulse' : ''}`}
                        style={{ background: color }}
                        disabled={minigame.stage !== 'input'}
                        onClick={() => handleMinigameAction('tap', { padIndex: i })}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="player-status-text">شاهدوا الشاشة الرئيسية — {targetName} يحاول تذكر التسلسل!</p>
              )
            ) : canAct ? (
              isOneShot && acted ? (
                <p className="player-status-text">تم! بانتظار النتيجة...</p>
              ) : (
                <>
                  <p className="player-status-text">{minigame.mode === 'group' ? 'شاركوا جميعًا الآن!' : 'دورك الآن!'}</p>
                  <button
                    className={`player-minigame-btn ${pulse ? 'pulse' : ''}`}
                    onClick={() => handleMinigameAction(actionSpec?.action ?? 'press')}
                  >
                    {actionSpec?.label ?? 'اضغط!'}
                  </button>
                </>
              )
            ) : (
              <p className="player-status-text">التحدي جارٍ — شاهدوا الشاشة الرئيسية!</p>
            )}
          </div>
        )}

        {!isFinal && !isLobby && !inMinigame && phase !== GamePhase.ANSWER_REVEAL && phase !== GamePhase.QUESTION && (
          <p className="player-status-text">{PHASE_WAITING_TEXT[phase] ?? 'بانتظار المضيف...'}</p>
        )}
      </div>
    </div>
  )
}
