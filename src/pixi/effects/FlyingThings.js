import { Graphics } from 'pixi.js'
import gsap from 'gsap'

function drawShape(kind, color) {
  const g = new Graphics()
  if (kind === 'diamond') {
    g.poly([0, -16, 14, 0, 0, 16, -14, 0]).fill({ color, alpha: 0.85 })
  } else if (kind === 'triangle') {
    g.poly([0, -14, 13, 10, -13, 10]).fill({ color, alpha: 0.85 })
  } else if (kind === 'ring') {
    g.circle(0, 0, 12).stroke({ width: 4, color, alpha: 0.9 })
  } else {
    g.rect(-10, -10, 20, 20).fill({ color, alpha: 0.85 })
  }
  return g
}

export function spawnFlyingThings(app, colors, count = 6) {
  const width = app.screen.width
  const height = app.screen.height
  const kinds = ['diamond', 'triangle', 'ring', 'square']

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    const shape = drawShape(kind, color)
    const scale = 0.8 + Math.random() * 0.9
    shape.scale.set(scale)

    const fromLeft = Math.random() < 0.5
    const startY = Math.random() * height
    const endY = Math.random() * height
    shape.x = fromLeft ? -40 : width + 40
    shape.y = startY
    shape.alpha = 0
    shape.rotation = Math.random() * Math.PI

    app.stage.addChild(shape)

    const delay = i * 0.1 + Math.random() * 0.12
    const duration = 0.9 + Math.random() * 0.6

    gsap.to(shape, { alpha: 1, duration: 0.2, delay })
    gsap.to(shape, {
      x: fromLeft ? width + 40 : -40,
      y: endY,
      rotation: shape.rotation + (fromLeft ? 1 : -1) * (4 + Math.random() * 3),
      duration,
      delay,
      ease: 'power1.inOut',
      onComplete: () => shape.destroy(),
    })
    gsap.to(shape, { alpha: 0, duration: 0.25, delay: delay + duration - 0.25 })
  }
}
