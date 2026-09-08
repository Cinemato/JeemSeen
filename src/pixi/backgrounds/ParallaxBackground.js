import { Container, Graphics, BlurFilter } from 'pixi.js'
import gsap from 'gsap'

const GLOW_COLORS = [0x7c3aed, 0x4c1d95, 0xa855f7, 0x5b21b6]

export class ParallaxBackground {
  constructor(width, height) {
    this.container = new Container()
    this.container.filters = [new BlurFilter({ strength: 40, quality: 3 })]
    this.tweens = []

    const count = 5
    for (let i = 0; i < count; i++) {
      const radius = Math.min(width, height) * (0.28 + Math.random() * 0.18)
      const g = new Graphics()
      g.circle(0, 0, radius).fill({
        color: GLOW_COLORS[i % GLOW_COLORS.length],
        alpha: 0.16 + Math.random() * 0.08,
      })
      g.x = Math.random() * width
      g.y = Math.random() * height
      this.container.addChild(g)

      const tween = gsap.to(g, {
        x: g.x + (Math.random() - 0.5) * width * 0.5,
        y: g.y + (Math.random() - 0.5) * height * 0.5,
        duration: 14 + Math.random() * 10,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
      this.tweens.push(tween)
    }
  }

  update() {}

  destroy() {
    this.tweens.forEach((t) => t.kill())
  }
}
