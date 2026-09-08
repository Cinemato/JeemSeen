import { GamePhase } from '../constants/gameStates'
import { categories } from '../data/categories'
import { pickNextMinigame } from '../data/minigames'
import { randomVariantIndex, randomVariantIndexExcluding } from '../data/characterVariants'
import { nextAvailableColorIndex, PLAYER_COLORS } from '../data/playerColors'

export const QUESTIONS_PER_DIFFICULTY = 2
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']
export const DIFFICULTY_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
export const DIFFICULTY_COLORS = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }
export const QUESTIONS_BETWEEN_MINIGAMES = 4
export const QUESTION_SECONDS = 15
export const MINIGAME_BONUS = 75
export const MINIGAME_WINNER_BONUS = 40
export const MAX_PLAYERS = 8
export const MIN_PLAYERS = 2
export const MIN_CATEGORIES = 3

function createPlayer(name, usedColorIndices = [], id) {
  return {
    id: id ?? `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    score: 0,
    reaction: 'idle',
    variantIndex: randomVariantIndex(),
    colorIndex: nextAvailableColorIndex(usedColorIndices),
  }
}

export function createInitialState() {
  return {
    phase: GamePhase.LOBBY,
    players: [],
    roomCode: null,
    hostIp: null,
    availableCategories: categories,
    selectedCategoryIds: [],
    categoryQueue: [],
    questionSchedule: [],
    questionIndex: 0,
    correctCountsSinceMinigame: {},
    questionsSinceMinigame: 0,
    answers: {},
    revealedAnswer: null,
    questionDeadline: null,
    activeMinigameId: null,
    minigameTargetId: null,
    lastMinigameId: null,
    playedMinigameIds: [],
    minigameStage: null,
    shakeSeq: 0,
    flourishSeq: 0,
  }
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildQuestionSchedule(categoryQueue) {
  const schedule = []
  for (const difficulty of DIFFICULTY_ORDER) {
    for (const categoryId of categoryQueue) {
      const category = categories.find((c) => c.id === categoryId)
      const picks = shuffle(category.questions.filter((q) => q.difficulty === difficulty)).slice(
        0,
        QUESTIONS_PER_DIFFICULTY
      )
      for (const q of picks) {
        schedule.push({ ...q, categoryId: category.id, categoryName: category.name, categoryIcon: category.icon })
      }
    }
  }
  return schedule
}

export function getScheduleProgress(state) {
  const categoryCount = state.categoryQueue.length || 1
  const roundSize = categoryCount * QUESTIONS_PER_DIFFICULTY
  const difficultyTierIndex = Math.floor(state.questionIndex / roundSize)
  const indexWithinRound = state.questionIndex % roundSize
  const categoryPositionInRound = Math.floor(indexWithinRound / QUESTIONS_PER_DIFFICULTY)
  const indexWithinCategoryBlock = indexWithinRound % QUESTIONS_PER_DIFFICULTY
  return {
    difficulty: DIFFICULTY_ORDER[difficultyTierIndex] ?? DIFFICULTY_ORDER[DIFFICULTY_ORDER.length - 1],
    difficultyTierIndex,
    roundSize,
    questionInRound: indexWithinRound + 1,
    categoryPositionInRound,
    questionInCategoryBlock: indexWithinCategoryBlock + 1,
  }
}

function pickMinigameTarget(players, correctCounts) {
  const counts = players.map((p) => correctCounts[p.id] ?? 0)
  const minCount = Math.min(...counts)
  const candidates = players.filter((p) => (correctCounts[p.id] ?? 0) === minCount)
  return candidates[Math.floor(Math.random() * candidates.length)].id
}

function advanceQuestionOrFinish(state, players, shakeSeq, questionsSinceMinigame) {
  const nextIndex = state.questionIndex + 1
  if (nextIndex >= state.questionSchedule.length) {
    const topScore = Math.max(...players.map((p) => p.score))
    const finalPlayers = players.map((p) => ({ ...p, reaction: p.score === topScore ? 'celebrate' : 'sad' }))
    return { ...state, players: finalPlayers, phase: GamePhase.FINAL, shakeSeq }
  }

  const roundSize = state.categoryQueue.length * QUESTIONS_PER_DIFFICULTY
  const enteringNewDifficulty = nextIndex % roundSize === 0

  return {
    ...state,
    players,
    shakeSeq,
    questionsSinceMinigame,
    questionIndex: nextIndex,
    phase: enteringNewDifficulty ? GamePhase.INTRO : GamePhase.QUESTION,
    answers: {},
    revealedAnswer: null,
    questionDeadline: enteringNewDifficulty ? null : Date.now() + QUESTION_SECONDS * 1000,
    flourishSeq: enteringNewDifficulty ? state.flourishSeq + 1 : state.flourishSeq,
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload.code, hostIp: action.payload.hostIp ?? state.hostIp }
    case 'ADD_NETWORKED_PLAYER': {
      if (state.phase !== GamePhase.LOBBY) return state
      if (state.players.length >= MAX_PLAYERS) return state
      const name = action.payload.name.trim().slice(0, 16) || 'لاعب'
      const usedColorIndices = state.players.map((p) => p.colorIndex)
      return {
        ...state,
        players: [...state.players, createPlayer(name, usedColorIndices, action.payload.id)],
      }
    }
    case 'REMOVE_PLAYER': {
      if (state.phase !== GamePhase.LOBBY) return state
      return { ...state, players: state.players.filter((p) => p.id !== action.payload.playerId) }
    }
    case 'RANDOMIZE_PLAYER_VARIANT': {
      if (state.phase !== GamePhase.LOBBY) return state
      const { playerId } = action.payload
      const target = state.players.find((p) => p.id === playerId)
      if (!target) return state
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, variantIndex: randomVariantIndexExcluding(p.variantIndex) } : p
        ),
      }
    }
    case 'SET_PLAYER_COLOR': {
      if (state.phase !== GamePhase.LOBBY) return state
      const { playerId, colorIndex } = action.payload
      if (!Number.isInteger(colorIndex) || colorIndex < 0 || colorIndex >= PLAYER_COLORS.length) return state
      const target = state.players.find((p) => p.id === playerId)
      if (!target || target.colorIndex === colorIndex) return state
      const takenByOther = state.players.some((p) => p.id !== playerId && p.colorIndex === colorIndex)
      if (takenByOther) return state
      return {
        ...state,
        players: state.players.map((p) => (p.id === playerId ? { ...p, colorIndex } : p)),
      }
    }
    case 'SET_MINIGAME_STAGE':
      return { ...state, minigameStage: action.payload.stage }
    case 'START_CATEGORY_SELECTION':
      if (state.players.length < MIN_PLAYERS) return state
      return { ...state, phase: GamePhase.CATEGORY_SELECTION }
    case 'TOGGLE_CATEGORY': {
      const { categoryId } = action.payload
      const isSelected = state.selectedCategoryIds.includes(categoryId)
      return {
        ...state,
        selectedCategoryIds: isSelected
          ? state.selectedCategoryIds.filter((id) => id !== categoryId)
          : [...state.selectedCategoryIds, categoryId],
      }
    }
    case 'CONFIRM_CATEGORIES': {
      if (state.selectedCategoryIds.length < MIN_CATEGORIES) return state
      const categoryQueue = state.selectedCategoryIds
      return {
        ...state,
        categoryQueue,
        questionSchedule: buildQuestionSchedule(categoryQueue),
        questionIndex: 0,
        correctCountsSinceMinigame: {},
        questionsSinceMinigame: 0,
        phase: GamePhase.INTRO,
        flourishSeq: state.flourishSeq + 1,
      }
    }
    case 'START_QUESTION':
      return {
        ...state,
        phase: GamePhase.QUESTION,
        answers: {},
        revealedAnswer: null,
        questionDeadline: Date.now() + QUESTION_SECONDS * 1000,
        players: state.players.map((p) => ({ ...p, reaction: 'idle' })),
      }
    case 'SUBMIT_ANSWER': {
      const { playerId, answerIndex } = action.payload
      if (state.phase !== GamePhase.QUESTION) return state
      if (state.answers[playerId] !== undefined) return state
      return {
        ...state,
        answers: { ...state.answers, [playerId]: answerIndex },
      }
    }
    case 'REVEAL_ANSWER': {
      const question = state.questionSchedule[state.questionIndex]
      if (!question) return state
      const correctAnswer = question.correctAnswer

      const correctCountsSinceMinigame = { ...state.correctCountsSinceMinigame }
      const players = state.players.map((p) => {
        const answered = state.answers[p.id]
        const wasCorrect = answered === correctAnswer
        if (wasCorrect) correctCountsSinceMinigame[p.id] = (correctCountsSinceMinigame[p.id] ?? 0) + 1
        return {
          ...p,
          score: wasCorrect ? p.score + 100 : p.score,
          reaction: answered === undefined ? 'shock' : wasCorrect ? 'celebrate' : 'sad',
        }
      })

      const wrongCount = players.filter((p) => p.reaction !== 'celebrate').length
      const correctCount = players.length - wrongCount
      const shakeSeq = wrongCount > correctCount ? state.shakeSeq + 1 : state.shakeSeq

      return {
        ...state,
        phase: GamePhase.ANSWER_REVEAL,
        players,
        correctCountsSinceMinigame,
        revealedAnswer: correctAnswer,
        shakeSeq,
      }
    }
    case 'NEXT_QUESTION': {
      const questionsSinceMinigame = state.questionsSinceMinigame + 1
      const players = state.players.map((p) => ({ ...p, reaction: 'idle' }))

      if (questionsSinceMinigame >= QUESTIONS_BETWEEN_MINIGAMES) {
        const minigameTargetId = pickMinigameTarget(state.players, state.correctCountsSinceMinigame)
        const { id: activeMinigameId, playedIds: playedMinigameIds } = pickNextMinigame(
          state.playedMinigameIds,
          state.lastMinigameId
        )
        return {
          ...state,
          players,
          phase: GamePhase.DEATH_GAME,
          minigameTargetId,
          activeMinigameId,
          playedMinigameIds,
          questionsSinceMinigame: 0,
          correctCountsSinceMinigame: {},
          flourishSeq: state.flourishSeq + 1,
        }
      }

      return advanceQuestionOrFinish(state, players, state.shakeSeq, questionsSinceMinigame)
    }
    case 'COMPLETE_MINIGAME': {
      const { outcomes } = action.payload
      const outcomeMap = new Map(outcomes.map((o) => [o.playerId, o]))

      const players = state.players.map((p) => {
        const outcome = outcomeMap.get(p.id)
        if (!outcome) return p
        return {
          ...p,
          score: outcome.success ? p.score + (outcome.bonus ?? 0) : p.score,
          reaction: outcome.success ? 'celebrate' : 'sad',
        }
      })

      const targetOutcome = outcomeMap.get(state.minigameTargetId)
      const shakeSeq = targetOutcome?.success === false ? state.shakeSeq + 1 : state.shakeSeq

      return advanceQuestionOrFinish(
        { ...state, lastMinigameId: state.activeMinigameId, activeMinigameId: null, minigameTargetId: null },
        players,
        shakeSeq,
        state.questionsSinceMinigame
      )
    }

    case 'RESET_GAME':
      return { ...createInitialState(), roomCode: state.roomCode, hostIp: state.hostIp }

    default:
      return state
  }
}
