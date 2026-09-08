import { useGameState } from '../../../game/state/GameStateContext'
import { useGameService } from '../../../game/state/gameService'
import { sfx } from '../../../audio/audioEngine'
import { MIN_CATEGORIES } from '../../../game/state/gameReducer'

export function CategorySelectionScene() {
  const { state } = useGameState()
  const service = useGameService()

  function handleToggle(categoryId) {
    sfx.select()
    service.toggleCategory(categoryId)
  }

  function handleConfirm() {
    sfx.confirm()
    service.confirmCategories()
  }

  const count = state.selectedCategoryIds.length
  const missing = MIN_CATEGORIES - count

  return (
    <div className="scene top-scene stage-flow-scene">
      <h1 className="scene-title">اختر الفئات</h1>
      <p className="scene-subtitle">
        اضغط على الفئات التي تريد اللعب بها — {count} / {MIN_CATEGORIES} على الأقل
      </p>
      <div className="category-grid">
        {state.availableCategories.map((category) => {
          const selected = state.selectedCategoryIds.includes(category.id)
          return (
            <button
              key={category.id}
              className={`category-card ${selected ? 'selected' : ''}`}
              onClick={() => handleToggle(category.id)}
            >
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>
      <button className="btn" disabled={missing > 0} onClick={handleConfirm}>
        تأكيد واستمرار
      </button>
    </div>
  )
}
