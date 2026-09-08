import { Graphics } from 'pixi.js'
import gsap from 'gsap'

export function spawnParticleBurst(parent, x, y, color = 0xfacc15, count = 14) {
  for (let i = 0; i < count; i++) {
    const dot = new Graphics().circle(0, 0, 4 + Math.random() * 3).fill(color)
    dot.x = x
    dot.y = y
    parent.addChild(dot)

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
    const distance = 60 + Math.random() * 60

    gsap.to(dot, {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      duration: 0.6 + Math.random() * 0.3,
      ease: 'power2.out',
      onComplete: () => {
        dot.destroy()
      },
    })
  }
}
