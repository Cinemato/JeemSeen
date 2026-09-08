import { Graphics } from 'pixi.js'
import gsap from 'gsap'

const COLORS = [0xfacc15, 0xf87171, 0x4ade80, 0x60a5fa, 0xc084fc, 0xfb923c]

export function spawnConfetti(parent, x, y, count = 40) {
  for (let i = 0; i < count; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const piece = new Graphics().rect(-5, -3, 10, 6).fill(color)
    piece.x = x
    piece.y = y
    piece.rotation = Math.random() * Math.PI
    parent.addChild(piece)

    const angle = Math.random() * Math.PI - Math.PI / 2 - Math.PI / 2
    const speed = 200 + Math.random() * 260
    const vx = Math.cos(angle) * speed * 0.6
    const targetY = y + 260 + Math.random() * 220

    gsap.to(piece, {
      x: x + vx * 0.01 * 60,
      y: targetY,
      rotation: piece.rotation + (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 6),
      duration: 1.4 + Math.random() * 0.8,
      ease: 'power1.in',
      onComplete: () => piece.destroy(),
    })
    gsap.to(piece, {
      alpha: 0,
      duration: 0.6,
      delay: 1.2,
    })
  }
}

export function spawnPoof(parent, x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    const dot = new Graphics().circle(0, 0, 6 + Math.random() * 6).fill({ color: 0x9ca3af, alpha: 0.6 })
    dot.x = x
    dot.y = y
    parent.addChild(dot)

    const angle = Math.random() * Math.PI * 2
    const distance = 20 + Math.random() * 30
    gsap.to(dot, {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance - 20,
      alpha: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => dot.destroy(),
    })
  }
}
