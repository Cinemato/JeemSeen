import gsap from 'gsap'

export function shakeStage(stage, { intensity = 14, duration = 0.4, steps = 8 } = {}) {
  if (!stage) return
  const originX = stage.position.x
  const originY = stage.position.y
  gsap.killTweensOf(stage.position)

  const tl = gsap.timeline({
    onComplete: () => stage.position.set(originX, originY),
  })
  for (let i = 0; i < steps; i++) {
    tl.to(stage.position, {
      x: originX + (Math.random() - 0.5) * intensity,
      y: originY + (Math.random() - 0.5) * intensity,
      duration: duration / steps,
      ease: 'none',
    })
  }
  tl.to(stage.position, { x: originX, y: originY, duration: duration / steps })
}
